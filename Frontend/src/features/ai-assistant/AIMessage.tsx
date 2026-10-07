import { Sparkles } from 'lucide-react'
import MarkdownView from '../shared/MarkdownView'
import type { AIMessage as AIMessageData } from '../../types'
import SuggestionCard from './SuggestionCard'

interface AIMessageProps {
  message: AIMessageData
  streaming?: boolean
}

export default function AIMessage({ message, streaming = false }: AIMessageProps) {
  if (message.role === 'user') {
    const lineCount = message.code?.split('\n').length ?? 0

    return (
      <div className="flex justify-end">
        <div className="max-w-[88%] rounded-lg bg-white/10 px-3 py-2 text-[13px]">
          {message.code && (
            <div className="mb-2 overflow-hidden rounded border border-line bg-editor">
              <div className="border-b border-line px-2 py-1 font-mono text-[11px] text-fg-muted">
                {message.targetFile} · {lineCount} {lineCount === 1 ? 'line' : 'lines'}
              </div>
              <pre className="max-h-28 overflow-auto px-2 py-1 text-[12px]">{message.code}</pre>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-l-2 border-ai pl-3">
      <div className="mb-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-ai">
        <Sparkles className="h-3 w-3" />
        AI Assistant
      </div>
      <div className="[&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
        <MarkdownView source={message.content} />
      </div>
      {streaming && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-ai align-middle" />}
      {message.code && message.targetFile && <SuggestionCard message={message} />}
    </div>
  )
}
