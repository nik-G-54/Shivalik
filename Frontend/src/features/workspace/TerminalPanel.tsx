import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { useTerminalStore } from '../../store/terminalStore'
import { executeCommand, PROMPT } from './commands'
import TerminalLine from './TerminalLine'

export default function TerminalPanel() {
  const lines = useTerminalStore((state) => state.lines)
  const history = useTerminalStore((state) => state.history)
  const running = useTerminalStore((state) => state.running)

  const [input, setInput] = useState('')
  // Index into history while navigating with the arrow keys; null = typing a new command.
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, running])

  // Give the input focus back once a command finishes.
  useEffect(() => {
    if (!running) inputRef.current?.focus()
  }, [running])

  const submit = () => {
    const command = input
    setInput('')
    setHistoryIndex(null)
    void executeCommand(command)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      submit()
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (history.length === 0) return
      const next = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(next)
      setInput(history[next])
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (historyIndex === null) return
      if (historyIndex >= history.length - 1) {
        setHistoryIndex(null)
        setInput('')
      } else {
        setHistoryIndex(historyIndex + 1)
        setInput(history[historyIndex + 1])
      }
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault()
      void executeCommand('clear')
    }
  }

  return (
    <div className="flex h-full flex-col bg-editor">
      <div className="flex h-9 shrink-0 items-center justify-between border-t border-line bg-editor px-4">
        <span className="border-b border-sky-500 py-2 text-[11px] font-semibold uppercase tracking-wider text-white">
          Terminal
        </span>
        <button
          type="button"
          title="Clear terminal"
          onClick={() => void executeCommand('clear')}
          disabled={running}
          className="rounded p-1 text-fg-muted hover:bg-white/10 hover:text-fg disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 font-mono text-[13px] leading-[1.4]"
      >
        {lines.map((line) => (
          <TerminalLine key={line.id} line={line} />
        ))}

        <div className="flex items-center gap-2">
          {!running && <span className="shrink-0 text-pass">{PROMPT}</span>}
          <input
            ref={inputRef}
            value={input}
            disabled={running}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal input"
            className="min-w-0 flex-1 bg-transparent text-white caret-white outline-none"
          />
        </div>
      </div>
    </div>
  )
}
