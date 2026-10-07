import { useMemo } from 'react'
import { Check, FileDiff, Undo2, X } from 'lucide-react'
import clsx from 'clsx'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type { AIMessage, SuggestionStatus } from '../../types'
import { applySuggestion, rejectSuggestion, revertSuggestion } from './aiService'
import DiffView from './DiffView'
import { collapseDiff, countChanges, diffLines } from './lineDiff'

interface SuggestionCardProps {
  message: AIMessage
}

const STATUS_BADGE: Record<SuggestionStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'border-warn/50 bg-warn/10 text-warn' },
  accepted: { label: 'Applied', className: 'border-pass/50 bg-pass/10 text-pass' },
  rejected: { label: 'Rejected', className: 'border-fail/50 bg-fail/10 text-fail' },
  reverted: { label: 'Reverted', className: 'border-line bg-white/5 text-fg-muted' },
}

export default function SuggestionCard({ message }: SuggestionCardProps) {
  const { id, code = '', targetFile = '', suggestionStatus: status = 'pending', previousContent } = message
  const current = useWorkspaceStore((state) => state.files.find((f) => f.path === targetFile)?.content ?? '')

  // Once applied the file already equals the suggestion, so show the change against what it replaced.
  const base = status === 'accepted' ? (previousContent ?? current) : current
  const diff = useMemo(() => diffLines(base, code), [base, code])
  const { added, removed } = countChanges(diff)
  const badge = STATUS_BADGE[status]

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-ai/40 bg-editor">
      <div className="flex items-center gap-2 border-b border-line bg-panel px-3 py-1.5 text-[12px]">
        <FileDiff className="h-3.5 w-3.5 shrink-0 text-ai" />
        <span className="truncate font-mono text-white">{targetFile}</span>
        <span className="shrink-0 font-mono">
          <span className="text-pass">+{added}</span> <span className="text-fail">−{removed}</span>
        </span>
        <span className={clsx('ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium', badge.className)}>
          {badge.label}
        </span>
      </div>

      {added + removed === 0 ? (
        <p className="px-3 py-2 text-[12px] text-fg-muted">No differences from the current file.</p>
      ) : (
        <DiffView lines={collapseDiff(diff)} />
      )}

      {(status === 'pending' || status === 'accepted') && (
        <div className="flex gap-2 border-t border-line bg-panel px-3 py-2">
          {status === 'pending' ? (
            <>
              <button
                type="button"
                onClick={() => applySuggestion(id)}
                className="flex items-center gap-1 rounded bg-pass/90 px-3 py-1 text-[12px] font-medium text-black hover:bg-pass"
              >
                <Check className="h-3.5 w-3.5" />
                Apply
              </button>
              <button
                type="button"
                onClick={() => rejectSuggestion(id)}
                className="flex items-center gap-1 rounded border border-fail/60 px-3 py-1 text-[12px] font-medium text-fail hover:bg-fail/10"
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => revertSuggestion(id)}
              className="flex items-center gap-1 rounded border border-line px-3 py-1 text-[12px] font-medium hover:bg-white/5"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Revert
            </button>
          )}
        </div>
      )}
    </div>
  )
}
