import { generateJson, type GeminiSchema } from '../../lib/gemini'
import { useAIStore } from '../../store/aiStore'
import { useTerminalStore } from '../../store/terminalStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { AIContext, AIReply } from './aiScript'

const SYSTEM_INSTRUCTION =
  'You are a coding assistant inside a software engineering assessment IDE. You only see the context provided. Be concise and practical. Answer in JSON.'

const SCHEMA: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    text: { type: 'STRING', description: 'Your answer in short markdown. Use `code` for identifiers.' },
    codeChange: {
      type: 'OBJECT',
      description: 'Only when you propose a change. The complete new content of one existing file.',
      properties: {
        file: { type: 'STRING', description: 'Path of an existing project file' },
        content: { type: 'STRING', description: 'Full new content of that file' },
      },
      required: ['file', 'content'],
    },
  },
  required: ['text'],
}

interface GeminiAssistantAnswer {
  text?: string
  codeChange?: { file?: string; content?: string }
}

const MAX_FILE_CHARS = 12_000
const MAX_OUTPUT_CHARS = 3_000
const HISTORY_MESSAGES = 6

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max)}\n…(truncated)` : text)

/** Output of the most recent test run, taken from the terminal. */
function lastTestOutput(): string {
  const lines = useTerminalStore.getState().lines
  const start = lines.map((l) => l.text).lastIndexOf('> node --test')
  if (start === -1) return '(no test run yet)'
  return clip(
    lines
      .slice(start)
      .filter((l) => l.kind !== 'cmd')
      .map((l) => l.text)
      .join('\n'),
    MAX_OUTPUT_CHARS,
  )
}

function buildPrompt(userText: string, ctx: AIContext): string {
  const { files } = useWorkspaceStore.getState()
  const current = files.find((f) => f.path === ctx.activeFile)
  const history = useAIStore
    .getState()
    .messages.slice(-HISTORY_MESSAGES)
    .map((m) => `${m.role}: ${clip(m.content, 500)}`)
    .join('\n')

  return [
    `Project files: ${files.map((f) => f.path).join(', ')}`,
    current
      ? `Current file: ${current.path}\n\`\`\`\n${clip(current.content, MAX_FILE_CHARS)}\n\`\`\``
      : 'Current file: (none open)',
    ctx.selection ? `Selected code in ${ctx.selection.file}:\n\`\`\`\n${ctx.selection.code}\n\`\`\`` : '',
    `Last test output:\n${lastTestOutput()}`,
    history ? `Conversation so far:\n${history}` : '',
    `User question: ${userText}`,
    'If you propose a change, set codeChange.file to an existing project file and codeChange.content to that file\'s complete new content.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** Asks Gemini to answer. Returns null when Gemini is unavailable so the caller can use the script. */
export async function askGemini(userText: string, ctx: AIContext): Promise<AIReply | null> {
  const answer = await generateJson<GeminiAssistantAnswer>({
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: buildPrompt(userText, ctx),
    responseSchema: SCHEMA,
    temperature: 0.4,
  })
  if (!answer || typeof answer.text !== 'string' || answer.text.trim() === '') return null

  const { file, content } = answer.codeChange ?? {}
  const fileExists = Boolean(file) && useWorkspaceStore.getState().files.some((f) => f.path === file)

  if (file && typeof content === 'string' && fileExists) {
    return { content: answer.text, code: content, targetFile: file, summary: `AI suggested a change to ${file}`, source: 'gemini' }
  }
  return { content: answer.text, summary: 'AI answered a question', source: 'gemini' }
}
