import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowUp, Code2, X } from 'lucide-react'
import { useAIStore } from '../../store/aiStore'
import { sendMessage } from './aiService'

const MAX_HEIGHT_PX = 120

export default function ChatInput() {
  const busy = useAIStore((state) => state.status !== 'idle')
  const chip = useAIStore((state) => state.chip)
  const focusTick = useAIStore((state) => state.focusTick)
  const clearChip = useAIStore((state) => state.clearChip)

  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Focus on mount and whenever "Ask AI" attaches a selection.
  useEffect(() => {
    inputRef.current?.focus()
  }, [focusTick])

  // Grow with the content up to a limit.
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [text])

  const send = () => {
    if (!text.trim() || busy) return
    void sendMessage(text)
    setText('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  const chipLines = chip?.code.split('\n').length ?? 0

  return (
    <div className="border-t border-line p-3">
      {chip && (
        <div className="mb-2 flex items-center gap-1.5 rounded border border-ai/40 bg-ai/10 px-2 py-1 text-[12px]">
          <Code2 className="h-3.5 w-3.5 shrink-0 text-ai" />
          <span className="truncate font-mono">
            {chip.file.split('/').pop()} · {chipLines} {chipLines === 1 ? 'line' : 'lines'} selected
          </span>
          <button
            type="button"
            aria-label="Remove attached code"
            onClick={clearChip}
            className="ml-auto rounded p-0.5 text-fg-muted hover:bg-white/10 hover:text-fg"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 rounded-md border border-line bg-editor px-2 py-1.5 focus-within:border-ai">
        <textarea
          ref={inputRef}
          value={text}
          rows={1}
          disabled={busy}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the AI assistant…"
          aria-label="Message the AI assistant"
          className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent py-0.5 text-[13px] outline-none placeholder:text-fg-muted disabled:opacity-50"
        />
        <button
          type="button"
          aria-label="Send message"
          onClick={send}
          disabled={busy || !text.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-ai text-white hover:bg-ai/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-[11px] text-fg-muted">Enter to send · Shift+Enter for a new line</p>
    </div>
  )
}
