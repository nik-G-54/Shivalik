import { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { useAIStore } from '../../store/aiStore'
import AIMessage from './AIMessage'
import { sendMessage } from './aiService'
import ChatInput from './ChatInput'
import ContextBar from './ContextBar'
import SuggestedQuestions from './SuggestedQuestions'
import ThinkingDots from './ThinkingDots'

export default function AIAssistantPanel() {
  const messages = useAIStore((state) => state.messages)
  const status = useAIStore((state) => state.status)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, status])

  const lastId = messages[messages.length - 1]?.id

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex items-center gap-2 px-4 pb-1 pt-3">
        <Sparkles className="h-4 w-4 text-ai" />
        <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
      </div>
      <ContextBar />

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="text-[13px] text-fg-muted">
            Ask about the codebase, a failing test, or how to approach the fix. Suggested changes are never
            applied until you choose to apply them.
          </p>
        )}
        {messages.map((message) => (
          <AIMessage
            key={message.id}
            message={message}
            streaming={status === 'streaming' && message.id === lastId}
          />
        ))}
        {status === 'thinking' && <ThinkingDots />}
      </div>

      {messages.length === 0 && status === 'idle' && (
        <SuggestedQuestions onPick={(question) => void sendMessage(question)} />
      )}
      <ChatInput />
    </div>
  )
}
