interface ChangeStatProps {
  label: string
  value: string
  className?: string
}

export default function ChangeStat({ label, value, className }: ChangeStatProps) {
  return (
    <div className="min-w-[110px] rounded border border-line bg-editor px-4 py-2">
      <div className={`text-xl font-semibold ${className ?? 'text-white'}`}>{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-fg-muted">{label}</div>
    </div>
  )
}
