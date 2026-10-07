import { Sparkles } from 'lucide-react'
import { useWorkspaceStore } from '../../store/workspaceStore'

/** Floating shortcut shown over the editor while code is selected. */
export default function AskAIButton() {
  const setSidePanelTab = useWorkspaceStore((state) => state.setSidePanelTab)
  const lineCount = useWorkspaceStore((state) => state.selectedCode.split('\n').length)

  return (
    <button
      type="button"
      onClick={() => setSidePanelTab('ai')}
      className="absolute right-6 top-3 z-10 flex items-center gap-1.5 rounded-md border border-ai/50 bg-panel px-2.5 py-1 text-xs text-ai shadow-lg hover:bg-ai/15"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Ask AI
      <span className="text-fg-muted">
        ({lineCount} {lineCount === 1 ? 'line' : 'lines'})
      </span>
    </button>
  )
}
