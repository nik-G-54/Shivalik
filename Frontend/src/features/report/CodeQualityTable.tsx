import type { SonarRow } from '../../types'
import ReportSection from './ReportSection'

interface CodeQualityTableProps {
  rows: SonarRow[]
}

const format = (value: number, unit?: string) => `${value}${unit ?? ''}`

/**
 * Candidate colour: neutral when it equals the reference; green only when better than both base and
 * reference; red only when worse than both; amber for anything in between.
 */
function candidateColor({ base, reference, candidate, lowerIsBetter }: SonarRow): string {
  if (candidate === reference) return 'text-fg'
  const better = (a: number, b: number) => (lowerIsBetter ? a < b : a > b)
  if (better(candidate, base) && better(candidate, reference)) return 'text-pass'
  if (better(base, candidate) && better(reference, candidate)) return 'text-fail'
  return 'text-warn'
}

export default function CodeQualityTable({ rows }: CodeQualityTableProps) {
  return (
    <ReportSection title="Code Quality" subtitle="SonarQube-style static analysis. Candidate: neutral = matches reference, green/red = better/worse than both base and reference, amber = in between.">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-wide text-fg-muted">
            <th className="pb-2 font-medium">Metric</th>
            <th className="pb-2 font-medium">Base</th>
            <th className="pb-2 font-medium">Reference</th>
            <th className="pb-2 font-medium">Candidate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.metric} className="border-b border-line/60 last:border-0">
              <td className="py-2 text-white">{row.metric}</td>
              <td className="py-2 font-mono text-fg-muted">{format(row.base, row.unit)}</td>
              <td className="py-2 font-mono text-fg-muted">{format(row.reference, row.unit)}</td>
              <td className={`py-2 font-mono font-semibold ${candidateColor(row)}`}>{format(row.candidate, row.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportSection>
  )
}
