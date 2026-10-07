import { Sparkles } from 'lucide-react'
import type { AIUsagePattern, AIUsage } from '../../types'
import EvidenceChips from './EvidenceChips'

interface AIJudgmentCardProps {
  usage: AIUsage
  /** AI Judgment criterion score out of 10 */
  score: number
}

const PATTERN_LABEL: Record<AIUsagePattern, string> = {
  augmentation: 'Augmentation',
  dependence: 'Dependence',
  independent: 'Independent',
}

const PATTERN_HINT: Record<AIUsagePattern, string> = {
  augmentation: 'Uses AI as a collaborator and verifies what it produces',
  dependence: 'Accepts AI output without checking it',
  independent: 'Works without the AI assistant',
}

export default function AIJudgmentCard({ usage, score }: AIJudgmentCardProps) {
  return (
    <section className="rounded-lg border-2 border-ai/60 bg-gradient-to-br from-ai/20 via-ai/10 to-panel p-6 shadow-[0_0_30px_-10px] shadow-ai/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-ai" />
          AI Judgment
        </h2>
        <span className="font-mono text-lg font-semibold text-ai">{score}/10</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-ai/60 bg-ai/20 px-3.5 py-1 text-[15px] font-semibold text-ai">
          {PATTERN_LABEL[usage.pattern]}
        </span>
        <span className="text-[13px] text-fg-muted">{PATTERN_HINT[usage.pattern]}</span>
      </div>

      <p className="mt-4 text-[14.5px] leading-relaxed text-white">{usage.summary}</p>

      <div className="mt-4">
        <EvidenceChips ids={usage.evidenceIds} />
      </div>
    </section>
  )
}
