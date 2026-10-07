import { Sparkles } from 'lucide-react'

export default function AIAssistantPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-panel text-fg-muted">
      <Sparkles className="h-10 w-10 text-ai/60" strokeWidth={1.4} />
      <p className="text-sm">AI Assistant coming next</p>
    </div>
  )
}
