import { logEvent } from '../../store/eventStore'
import { createMessageId, useAIStore, type SelectionChip } from '../../store/aiStore'
import { useTestStore } from '../../store/testStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { detectTestState } from '../workspace/testRunner'
import { countChanges, diffLines } from './lineDiff'
import { pickEntry, TESTS_FILE, type AIContext, type AIReply } from './aiScript'

const THINK_MIN_MS = 600
const THINK_EXTRA_MS = 300
const WORD_DELAY_MS = 20

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
const baseName = (path: string) => path.split('/').pop() ?? path
const shorten = (text: string, max = 60) => {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine
}

const fileContent = (path: string) =>
  useWorkspaceStore.getState().files.find((file) => file.path === path)?.content ?? ''

function buildContext(selection: SelectionChip | null): AIContext {
  return {
    activeFile: useWorkspaceStore.getState().activeFile,
    selection,
    lastRun: useTestStore.getState().lastRun,
    fileState: detectTestState(),
    testsContent: fileContent(TESTS_FILE),
  }
}

/** Short description of what the AI could see, used in the AI_REQUEST summary. */
function describeContext(ctx: AIContext): string {
  const parts: string[] = []
  if (ctx.activeFile) parts.push(`file ${baseName(ctx.activeFile)}`)
  if (ctx.selection) {
    const count = ctx.selection.code.split('\n').length
    parts.push(`${count} selected ${count === 1 ? 'line' : 'lines'} of ${baseName(ctx.selection.file)}`)
  }
  if (ctx.lastRun) parts.push(`last test run ${ctx.lastRun.passed} passed, ${ctx.lastRun.failed} failed`)
  return parts.length > 0 ? parts.join(', ') : 'no context'
}

/** The scripted brain: picks a reply from the user's text and the current workspace state. */
export function respond(userText: string, context: AIContext): AIReply {
  return pickEntry(userText, context).reply(context)
}

/** Sends a user message, then streams the scripted reply into the AI store. Logs AI_REQUEST and AI_RESPONSE. */
export async function sendMessage(rawText: string): Promise<void> {
  const text = rawText.trim()
  const ai = useAIStore.getState()
  if (!text || ai.status !== 'idle') return

  const chip = ai.chip
  const context = buildContext(chip)

  ai.addMessage({
    id: createMessageId(),
    role: 'user',
    content: text,
    code: chip?.code,
    targetFile: chip?.file,
  })
  ai.clearChip()
  ai.setStatus('thinking')

  logEvent('AI_REQUEST', `Asked AI: "${shorten(text)}" (context: ${describeContext(context)})`, {
    prompt: text,
    activeFile: context.activeFile,
    selectedFile: chip?.file ?? null,
    selectedLines: chip ? chip.code.split('\n').length : 0,
    lastTestState: context.lastRun?.state ?? null,
  })

  const reply = respond(text, context)
  await sleep(THINK_MIN_MS + Math.random() * THINK_EXTRA_MS)

  const id = createMessageId()
  useAIStore.getState().addMessage({ id, role: 'assistant', content: '' })
  useAIStore.getState().setStatus('streaming')

  let streamed = ''
  for (const word of reply.content.match(/\S+\s*/g) ?? []) {
    streamed += word
    useAIStore.getState().updateMessage(id, { content: streamed })
    await sleep(WORD_DELAY_MS)
  }

  useAIStore.getState().updateMessage(id, {
    content: reply.content,
    code: reply.code,
    targetFile: reply.targetFile,
    suggestionStatus: reply.code ? 'pending' : undefined,
  })
  useAIStore.getState().setStatus('idle')

  logEvent('AI_RESPONSE', reply.summary, {
    messageId: id,
    targetFile: reply.targetFile ?? null,
    hasCodeChange: Boolean(reply.code),
  })
}

function findSuggestion(messageId: string) {
  const message = useAIStore.getState().messages.find((m) => m.id === messageId)
  return message?.code !== undefined && message.targetFile ? message : undefined
}

/** Applies the suggested code to the target file, remembering the old content for Revert. */
export function applySuggestion(messageId: string): void {
  const message = findSuggestion(messageId)
  if (!message || message.suggestionStatus !== 'pending') return

  const path = message.targetFile!
  const previous = fileContent(path)
  const { added, removed } = countChanges(diffLines(previous, message.code!))

  useWorkspaceStore.getState().applyEdit(path, message.code!)
  useAIStore.getState().updateMessage(messageId, {
    suggestionStatus: 'accepted',
    previousContent: previous,
  })
  logEvent('AI_SUGGESTION_ACCEPTED', `Applied AI suggestion to ${path} (+${added}/−${removed} lines)`, {
    messageId,
    targetFile: path,
    added,
    removed,
  })
}

export function rejectSuggestion(messageId: string): void {
  const message = findSuggestion(messageId)
  if (!message || message.suggestionStatus !== 'pending') return

  useAIStore.getState().updateMessage(messageId, { suggestionStatus: 'rejected' })
  logEvent('AI_SUGGESTION_REJECTED', `Rejected AI suggestion for ${message.targetFile}`, {
    messageId,
    targetFile: message.targetFile,
  })
}

/** Restores the file content from before the suggestion was applied. */
export function revertSuggestion(messageId: string): void {
  const message = findSuggestion(messageId)
  if (!message || message.suggestionStatus !== 'accepted' || message.previousContent === undefined) return

  const path = message.targetFile!
  useWorkspaceStore.getState().applyEdit(path, message.previousContent)
  useAIStore.getState().updateMessage(messageId, { suggestionStatus: 'reverted' })
  logEvent('AI_CHANGE_REVERTED', `Reverted AI change to ${path}`, { messageId, targetFile: path })
}
