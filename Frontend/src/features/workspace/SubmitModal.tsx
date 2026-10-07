import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, FileDiff, FlaskConical, XCircle } from 'lucide-react'
import { logEvent } from '../../store/eventStore'
import { useTestStore } from '../../store/testStore'
import { originalContent, useWorkspaceStore } from '../../store/workspaceStore'
import { lineDiff } from './diffUtils'
import { formatClock } from './useCountdown'

interface SubmitModalProps {
  challengeId: string
  onClose: () => void
}

export default function SubmitModal({ challengeId, onClose }: SubmitModalProps) {
  const navigate = useNavigate()
  const files = useWorkspaceStore((state) => state.files)
  const startedAt = useWorkspaceStore((state) => state.startedAt)
  const lastRun = useTestStore((state) => state.lastRun)
  // The modal is mounted on open, so this snapshot is the time at submission.
  const [openedAt] = useState(() => Date.now())

  const changed = files
    .filter((file) => file.content !== originalContent[file.path])
    .map((file) => ({ path: file.path, ...lineDiff(originalContent[file.path], file.content) }))
  const elapsedSec = startedAt === null ? 0 : Math.floor((openedAt - startedAt) / 1000)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const confirm = () => {
    logEvent('SUBMISSION_CREATED', `Submitted solution (${changed.length} files modified)`, {
      filesModified: changed.map((file) => file.path),
      testState: lastRun?.state ?? null,
      passed: lastRun?.passed ?? null,
      failed: lastRun?.failed ?? null,
      timeUsedSec: elapsedSec,
    })
    navigate(`/evaluating/${challengeId}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Submit solution"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-line bg-panel shadow-2xl"
      >
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-white">Submit your solution?</h2>
          <p className="mt-1 text-[13px] text-fg-muted">
            Your work will be evaluated. You cannot make changes after submitting.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4 text-[13px]">
          <section>
            <h3 className="mb-1.5 flex items-center gap-1.5 font-medium text-white">
              <FileDiff className="h-4 w-4 text-fg-muted" />
              Files modified ({changed.length})
            </h3>
            {changed.length === 0 ? (
              <p className="text-warn">No files changed yet.</p>
            ) : (
              <ul className="space-y-1">
                {changed.map((file) => (
                  <li key={file.path} className="flex items-center justify-between font-mono text-xs">
                    <span>{file.path}</span>
                    <span>
                      <span className="text-pass">+{file.added}</span>{' '}
                      <span className="text-fail">−{file.removed}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 flex items-center gap-1.5 font-medium text-white">
              <FlaskConical className="h-4 w-4 text-fg-muted" />
              Last test result
            </h3>
            {lastRun === null ? (
              <p className="text-warn">Tests have not been run yet.</p>
            ) : lastRun.failed === 0 ? (
              <p className="flex items-center gap-1.5 text-pass">
                <CheckCircle2 className="h-4 w-4" />
                All {lastRun.total} tests passing
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-fail">
                <XCircle className="h-4 w-4" />
                {lastRun.passed} passed, {lastRun.failed} failed
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-1.5 flex items-center gap-1.5 font-medium text-white">
              <Clock className="h-4 w-4 text-fg-muted" />
              Time used
            </h3>
            <p className="font-mono">{formatClock(elapsedSec)}</p>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line px-3.5 py-1.5 text-sm hover:bg-white/5"
          >
            Keep working
          </button>
          <button
            type="button"
            onClick={confirm}
            className="rounded bg-sky-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
          >
            Confirm submission
          </button>
        </div>
      </div>
    </div>
  )
}
