import { useEventStore } from '../../store/eventStore'
import { useEvidenceStore } from '../../store/evidenceStore'

interface EvidenceChipProps {
  /** Event id, e.g. E04 */
  id: string
}

/** Clickable [E04] reference. Click scrolls the timeline to the event; hover shows its summary. */
export default function EvidenceChip({ id }: EvidenceChipProps) {
  const summary = useEventStore((state) => state.events.find((e) => e.id === id)?.summary)
  const focusEvidence = useEvidenceStore((state) => state.focusEvidence)

  return (
    <button
      type="button"
      onClick={() => focusEvidence(id)}
      className="group relative rounded border border-line bg-editor px-1.5 py-0.5 font-mono text-[11.5px] text-sky-300 hover:border-sky-400 hover:bg-sky-400/10"
    >
      [{id}]
      {summary && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden w-max max-w-[280px] rounded border border-line bg-sidebar px-2.5 py-1.5 text-left font-sans text-[12px] font-normal leading-snug text-fg shadow-xl group-hover:block"
        >
          {summary}
        </span>
      )}
    </button>
  )
}
