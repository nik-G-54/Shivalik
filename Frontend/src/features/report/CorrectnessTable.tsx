import type { CorrectnessResults, TestResult } from '../../types'
import ReportSection from './ReportSection'

interface CorrectnessTableProps {
  correctness: CorrectnessResults
}

const ROWS: { key: keyof CorrectnessResults; label: string; note: string }[] = [
  { key: 'visible', label: 'Visible tests', note: 'Your last test run in the workspace' },
  { key: 'hidden', label: 'Hidden tests', note: 'Edge cases you could not see, such as numeric values' },
  { key: 'regression', label: 'Regression tests', note: 'Existing behaviour that must keep working' },
]

function resultColor({ passed, total }: TestResult): string {
  const ratio = total === 0 ? 0 : passed / total
  if (ratio === 1) return 'text-pass'
  return ratio >= 0.5 ? 'text-warn' : 'text-fail'
}

export default function CorrectnessTable({ correctness }: CorrectnessTableProps) {
  return (
    <ReportSection title="Correctness">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-[11.5px] uppercase tracking-wide text-fg-muted">
            <th className="pb-2 font-medium">Suite</th>
            <th className="pb-2 font-medium">Passed</th>
            <th className="hidden pb-2 font-medium sm:table-cell">What it covers</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ key, label, note }) => {
            const result = correctness[key]
            return (
              <tr key={key} className="border-b border-line/60 last:border-0">
                <td className="py-2.5 text-white">{label}</td>
                <td className={`py-2.5 font-mono font-semibold ${resultColor(result)}`}>
                  {result.passed}/{result.total}
                </td>
                <td className="hidden py-2.5 text-fg-muted sm:table-cell">{note}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ReportSection>
  )
}
