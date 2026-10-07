import { Info } from 'lucide-react'
import type { ReferenceComparison as ReferenceComparisonData } from '../../types'
import ComparisonBadge from './ComparisonBadge'
import DiffTabs from './DiffTabs'
import ReportSection from './ReportSection'

interface ReferenceComparisonProps {
  comparison: ReferenceComparisonData
}

export default function ReferenceComparison({ comparison }: ReferenceComparisonProps) {
  return (
    <ReportSection title="Reference Comparison" subtitle="How the final code compares with the reference fix.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <ComparisonBadge label="Root cause" verdict={comparison.rootCause} />
        <ComparisonBadge label="Behavior" verdict={comparison.behavior} />
        <ComparisonBadge label="Implementation" verdict={comparison.implementation} />
        <ComparisonBadge label="Complexity" verdict={comparison.complexity} />
        <ComparisonBadge label="Coverage" verdict={comparison.coverage} />
      </div>

      <div className="mt-4">
        <DiffTabs />
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[12.5px] text-fg-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Different implementations can score higher than the reference. We compare behaviour, not code similarity.
      </p>
    </ReportSection>
  )
}
