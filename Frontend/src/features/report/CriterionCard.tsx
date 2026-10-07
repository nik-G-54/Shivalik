import type { CriterionScore } from '../../types'
import EvidenceChips from './EvidenceChips'
import { scoreColor } from './scoreColor'

interface CriterionCardProps {
  criterion: CriterionScore
}

export default function CriterionCard({ criterion }: CriterionCardProps) {
  const percent = (criterion.score / criterion.maxScore) * 100

  return (
    <div className="rounded-lg border border-line bg-editor/50 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-[14px] font-medium text-white">{criterion.name}</h4>
        <span className="font-mono text-sm font-semibold" style={{ color: scoreColor(percent) }}>
          {criterion.score}/{criterion.maxScore}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-fg">{criterion.reason}</p>
      <div className="mt-2.5">
        <EvidenceChips ids={criterion.evidenceIds} />
      </div>
    </div>
  )
}
