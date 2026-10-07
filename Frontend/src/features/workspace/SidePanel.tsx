import { FileText, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useWorkspaceStore, type SidePanelTab } from '../../store/workspaceStore'
import AIAssistantPanel from '../ai-assistant/AIAssistantPanel'
import IssuePanel from './IssuePanel'

const TABS: { id: SidePanelTab; label: string; icon: typeof FileText }[] = [
  { id: 'issue', label: 'Issue', icon: FileText },
  { id: 'ai', label: 'AI Assistant', icon: Sparkles },
]

export default function SidePanel() {
  const tab = useWorkspaceStore((state) => state.sidePanelTab)
  const setTab = useWorkspaceStore((state) => state.setSidePanelTab)

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex h-9 shrink-0 bg-sidebar" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = tab === id
          const isAI = id === 'ai'

          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(id)}
              className={clsx(
                'flex items-center gap-1.5 border-r border-t-2 border-line px-4 text-[13px]',
                isActive
                  ? clsx('bg-panel text-white', isAI ? 'border-t-ai' : 'border-t-sky-500')
                  : 'border-t-transparent text-fg-muted hover:text-fg',
              )}
            >
              <Icon className={clsx('h-4 w-4', isAI && 'text-ai')} />
              <span className={clsx(isAI && isActive && 'text-ai')}>{label}</span>
            </button>
          )
        })}
      </div>
      <div className="min-h-0 flex-1">{tab === 'issue' ? <IssuePanel /> : <AIAssistantPanel />}</div>
    </div>
  )
}
