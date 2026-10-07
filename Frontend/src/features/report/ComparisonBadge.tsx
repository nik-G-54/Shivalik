import clsx from 'clsx'
import type { ComparisonVerdict } from '../../types'

interface ComparisonBadgeProps {
  label: string
  verdict: ComparisonVerdict
}

// green = match / better, amber = different, red = worse
const VERDICT_CLASS: Record<ComparisonVerdict, string> = {
  Match: 'border-pass/50 bg-pass/10 text-pass',
  Better: 'border-pass/50 bg-pass/10 text-pass',
  Different: 'border-warn/50 bg-warn/10 text-warn',
  Worse: 'border-fail/50 bg-fail/10 text-fail',
}

export default function ComparisonBadge({ label, verdict }: ComparisonBadgeProps) {
  return (
    <div className={clsx('rounded-lg border px-3 py-2', VERDICT_CLASS[verdict])}>
      <div className="text-[11px] uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-[15px] font-semibold">{verdict}</div>
    </div>
  )
}
