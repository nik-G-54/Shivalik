import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { useEventStore } from '../../store/eventStore'
import { useEvidenceStore, type EvidenceFilter } from '../../store/evidenceStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { eventCategory } from './eventStyle'
import TimelineItem from './TimelineItem'

const FILTERS: { id: EvidenceFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI' },
  { id: 'tests', label: 'Tests' },
  { id: 'files', label: 'Files' },
]

export default function EvidenceTimeline() {
  const events = useEventStore((state) => state.events)
  const startedAt = useWorkspaceStore((state) => state.startedAt)
  const filter = useEvidenceStore((state) => state.filter)
  const setFilter = useEvidenceStore((state) => state.setFilter)
  const highlightedId = useEvidenceStore((state) => state.highlightedId)
  const focusTick = useEvidenceStore((state) => state.focusTick)
  const scrollRef = useRef<HTMLDivElement>(null)

  const visible = filter === 'all' ? events : events.filter((e) => eventCategory(e.type) === filter)
  const start = startedAt ?? events[0]?.timestamp ?? 0

  // Scroll the list itself (not the page) so the focused event is centred.
  useEffect(() => {
    if (!highlightedId) return
    const container = scrollRef.current
    const item = container?.querySelector<HTMLElement>(`[data-evidence-id="${highlightedId}"]`)
    if (!container || !item) return
    container.scrollTo({
      top: item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2,
      behavior: 'smooth',
    })
    // Only a new focus request should scroll, not the highlight clearing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick])

  const countFor = (id: EvidenceFilter) =>
    id === 'all' ? events.length : events.filter((e) => eventCategory(e.type) === id).length

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-[15px] font-semibold text-white">Evidence Timeline</h2>
        <p className="text-[12px] text-fg-muted">Every action recorded during the session</p>
        <div className="mt-3 flex gap-1.5" role="tablist">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filter === id}
              onClick={() => setFilter(id)}
              className={clsx(
                'rounded-full border px-2.5 py-0.5 text-[12px]',
                filter === id
                  ? id === 'ai'
                    ? 'border-ai/60 bg-ai/20 text-ai'
                    : 'border-sky-400/60 bg-sky-400/15 text-sky-300'
                  : 'border-line text-fg-muted hover:text-fg',
              )}
            >
              {label} <span className="opacity-70">{countFor(id)}</span>
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto p-2">
        {visible.length === 0 ? (
          <p className="p-3 text-[13px] text-fg-muted">No events to show.</p>
        ) : (
          <ol className="space-y-0.5">
            {visible.map((event) => (
              <TimelineItem key={event.id} event={event} startedAt={start} highlighted={event.id === highlightedId} />
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
