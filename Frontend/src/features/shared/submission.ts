import { useEventStore } from '../../store/eventStore'
import { useWorkspaceStore } from '../../store/workspaceStore'

export interface Submission {
  id: string
  /** Epoch ms of the SUBMISSION_CREATED event, or null if nothing was submitted. */
  submittedAt: number | null
  timeUsedSec: number
  startedAt: number | null
}

/** Reads submission info from the live event log. */
export function getSubmission(): Submission {
  const events = useEventStore.getState().events
  const submitted = events.find((e) => e.type === 'SUBMISSION_CREATED')
  const startedAt = useWorkspaceStore.getState().startedAt ?? events[0]?.timestamp ?? null

  const submittedAt = submitted?.timestamp ?? null
  const timeUsedSec =
    typeof submitted?.payload?.timeUsedSec === 'number'
      ? submitted.payload.timeUsedSec
      : submittedAt !== null && startedAt !== null
        ? Math.floor((submittedAt - startedAt) / 1000)
        : 0

  const idSource = submittedAt ?? startedAt ?? 0
  return { id: `SUB-${idSource.toString(36).toUpperCase().slice(-6).padStart(6, '0')}`, submittedAt, timeUsedSec, startedAt }
}

export function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
