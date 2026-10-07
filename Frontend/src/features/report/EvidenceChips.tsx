import EvidenceChip from './EvidenceChip'

interface EvidenceChipsProps {
  ids: string[]
}

export default function EvidenceChips({ ids }: EvidenceChipsProps) {
  if (ids.length === 0) return <span className="text-xs text-fg-muted">No evidence recorded</span>

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-fg-muted">Evidence</span>
      {ids.map((id) => (
        <EvidenceChip key={id} id={id} />
      ))}
    </div>
  )
}
