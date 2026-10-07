interface StatTileProps {
  label: string
  value: string
}

export default function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="rounded-lg border border-line bg-panel px-5 py-3">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="text-xs uppercase tracking-wide text-fg-muted">{label}</div>
    </div>
  )
}
