import clsx from 'clsx'
import type { ActivityEvent } from '../../types'
import { formatDuration } from '../shared/submission'
import { eventStyle } from './eventStyle'

interface TimelineItemProps {
  event: ActivityEvent
  /** Epoch ms of the session start */
  startedAt: number
  highlighted: boolean
}

export default function TimelineItem({ event, startedAt, highlighted }: TimelineItemProps) {
  const { icon: Icon, color } = eventStyle(event.type)
  const seconds = Math.max(0, Math.round((event.timestamp - startedAt) / 1000))

  return (
    <li
      data-evidence-id={event.id}
      className={clsx(
        'flex gap-2.5 rounded-md px-2.5 py-2 transition-colors',
        highlighted ? 'animate-pulse bg-ai/20 ring-2 ring-ai' : 'hover:bg-white/5',
      )}
    >
      <Icon className={clsx('mt-0.5 h-4 w-4 shrink-0', color)} />
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[11.5px]">
          <span className="font-mono font-semibold text-sky-300">{event.id}</span>
          <span className="font-mono text-fg-muted">{formatDuration(seconds)}</span>
          <span className="truncate text-[10.5px] uppercase tracking-wide text-fg-muted">
            {event.type.replace(/_/g, ' ').toLowerCase()}
          </span>
        </div>
        <p className="break-words text-[12.5px] leading-snug text-fg">{event.summary}</p>
      </div>
    </li>
  )
}
