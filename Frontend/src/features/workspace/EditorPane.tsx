import { useCallback, useEffect, useRef, useState } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import '../shared/monacoSetup'
import { logEvent } from '../../store/eventStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import AskAIButton from './AskAIButton'
import { formatDiff, lineDiff } from './diffUtils'
import EditorTabs from './EditorTabs'
import EmptyEditor from './EmptyEditor'
import SavedToast from './SavedToast'

const MODIFIED_LOG_DEBOUNCE_MS = 1500
const SAVED_TOAST_MS = 1400

export default function EditorPane() {
  const files = useWorkspaceStore((state) => state.files)
  const activeFile = useWorkspaceStore((state) => state.activeFile)
  const selectedFile = useWorkspaceStore((state) => state.selectedFile)
  const selectedCode = useWorkspaceStore((state) => state.selectedCode)
  const updateFile = useWorkspaceStore((state) => state.updateFile)
  const setSelection = useWorkspaceStore((state) => state.setSelection)

  const [savedVisible, setSavedVisible] = useState(false)
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Content at the start of each pending edit burst, and the debounce timers that log it.
  const baselines = useRef(new Map<string, string>())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const file = files.find((f) => f.path === activeFile)

  const flushModified = useCallback((path: string) => {
    timers.current.delete(path)
    const before = baselines.current.get(path)
    baselines.current.delete(path)
    const after = useWorkspaceStore.getState().files.find((f) => f.path === path)?.content
    if (before === undefined || after === undefined || before === after) return

    const diff = lineDiff(before, after)
    logEvent('FILE_MODIFIED', `Modified ${path} (${formatDiff(diff)})`, { path, ...diff })
  }, [])

  // Log any pending edits when the editor goes away.
  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer, path) => {
        clearTimeout(timer)
        flushModified(path)
      })
    }
  }, [flushModified])

  useEffect(() => {
    setSelection(null, '')
  }, [activeFile, setSelection])

  const handleChange = (value: string | undefined) => {
    const path = useWorkspaceStore.getState().activeFile
    if (value === undefined || !path) return

    const previous = useWorkspaceStore.getState().files.find((f) => f.path === path)?.content
    if (previous === undefined || previous === value) return

    if (!baselines.current.has(path)) baselines.current.set(path, previous)
    updateFile(path, value)

    clearTimeout(timers.current.get(path))
    timers.current.set(path, setTimeout(() => flushModified(path), MODIFIED_LOG_DEBOUNCE_MS))
  }

  const handleMount: OnMount = (editor, monaco) => {
    // Ctrl/Cmd+S only shows a toast; nothing is persisted.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      setSavedVisible(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSavedVisible(false), SAVED_TOAST_MS)
    })

    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection()
      const model = editor.getModel()
      const text = selection && model && !selection.isEmpty() ? model.getValueInRange(selection) : ''
      setSelection(useWorkspaceStore.getState().activeFile, text)
    })
  }

  const showAskAI = selectedCode !== '' && selectedFile === activeFile

  return (
    <div className="flex h-full flex-col bg-editor">
      <EditorTabs />
      <div className="relative min-h-0 flex-1">
        {file ? (
          <Editor
            height="100%"
            path={file.path}
            language={file.language}
            value={file.content}
            theme="vs-dark"
            onChange={handleChange}
            onMount={handleMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Cascadia Code', 'JetBrains Mono', 'Fira Code', Consolas, monospace",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
              padding: { top: 8 },
            }}
          />
        ) : (
          <EmptyEditor />
        )}
        {showAskAI && <AskAIButton />}
        <SavedToast visible={savedVisible} />
      </div>
    </div>
  )
}
