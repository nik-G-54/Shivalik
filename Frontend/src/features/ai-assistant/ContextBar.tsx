import { Eye } from 'lucide-react'
import { useTestStore } from '../../store/testStore'
import { useWorkspaceStore } from '../../store/workspaceStore'

/** Shows what the assistant can currently see. */
export default function ContextBar() {
  const activeFile = useWorkspaceStore((state) => state.activeFile)
  const selectedCode = useWorkspaceStore((state) => state.selectedCode)
  const lastRun = useTestStore((state) => state.lastRun)

  const selectedLines = selectedCode ? selectedCode.split('\n').length : 0

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-1.5 text-[11.5px] text-fg-muted">
      <span className="flex items-center gap-1">
        <Eye className="h-3.5 w-3.5 text-ai" />
        Context
      </span>
      <span>
        File: <span className="font-mono text-fg">{activeFile?.split('/').pop() ?? 'none'}</span>
      </span>
      {selectedLines > 0 && (
        <span>
          Selected: <span className="text-fg">{selectedLines} {selectedLines === 1 ? 'line' : 'lines'}</span>
        </span>
      )}
      {lastRun && (
        <span>
          Last test run:{' '}
          <span className={lastRun.failed === 0 ? 'text-pass' : 'text-fail'}>
            {lastRun.passed} passed, {lastRun.failed} failed
          </span>
        </span>
      )}
    </div>
  )
}
