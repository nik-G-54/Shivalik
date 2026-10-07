import type { DimensionScore } from '../../types'
import { scoreColor } from './scoreColor'

interface DimensionCardProps {
  dimension: DimensionScore
}

export default function DimensionCard({ dimension }: DimensionCardProps) {
  const isAI = dimension.name === 'AI Judgment'
  const color = isAI ? 'var(--color-ai)' : scoreColor(dimension.score)

  return (
    <div className={`rounded-lg border p-4 ${isAI ? 'border-ai/40 bg-ai/10' : 'border-line bg-panel'}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-[13px] font-medium text-white">{dimension.name}</h3>
        <span className="text-[11px] text-fg-muted">{dimension.weight}% weight</span>
      </div>
      <div className="mt-2 text-2xl font-semibold" style={{ color }}>
        {dimension.score}
        <span className="text-sm font-normal text-fg-muted">/100</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${dimension.score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
