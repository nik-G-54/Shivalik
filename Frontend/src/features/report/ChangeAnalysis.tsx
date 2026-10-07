import { FileDiff } from 'lucide-react'
import type { ChangeSummary } from '../shared/changes'
import ChangeStat from './ChangeStat'
import ReportSection from './ReportSection'

interface ChangeAnalysisProps {
  changes: ChangeSummary
}

export default function ChangeAnalysis({ changes }: ChangeAnalysisProps) {
  return (
    <ReportSection title="Change Analysis" subtitle="Computed from the original files and the final workspace.">
      <div className="mb-4 flex flex-wrap gap-3">
        <ChangeStat label="Files changed" value={String(changes.files.length)} />
        <ChangeStat label="Lines added" value={`+${changes.added}`} className="text-pass" />
        <ChangeStat label="Lines removed" value={`−${changes.removed}`} className="text-fail" />
      </div>

      {changes.files.length === 0 ? (
        <p className="text-[13px] text-fg-muted">No files were changed.</p>
      ) : (
        <ul className="divide-y divide-line/60 rounded border border-line">
          {changes.files.map((file) => (
            <li key={file.path} className="flex items-center gap-2 px-3 py-2 text-[13px]">
              <FileDiff className="h-4 w-4 shrink-0 text-fg-muted" />
              <span className="truncate font-mono text-white">{file.path}</span>
              <span className="ml-auto shrink-0 font-mono">
                <span className="text-pass">+{file.added}</span> <span className="text-fail">−{file.removed}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </ReportSection>
  )
}
