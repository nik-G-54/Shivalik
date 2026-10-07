import { Cpu, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { challenge } from '../../mock/challenge'
import { candidate } from '../../mock/candidate'
import type { Evaluation, Verdict } from '../../types'
import { formatDateTime, formatDuration, type Submission } from '../shared/submission'
import ScoreRing from './ScoreRing'

interface ReportHeaderProps {
  evaluation: Evaluation
  submission: Submission
}

const VERDICT_CLASS: Record<Verdict, string> = {
  'Strong Hire': 'border-pass/60 bg-pass/15 text-pass',
  Hire: 'border-sky-400/60 bg-sky-400/15 text-sky-300',
  'Lean Hire': 'border-warn/60 bg-warn/15 text-warn',
  'No Hire': 'border-fail/60 bg-fail/15 text-fail',
}

export default function ReportHeader({ evaluation, submission }: ReportHeaderProps) {
  const SourceIcon = evaluation.source === 'llm' ? Sparkles : Cpu

  return (
    <section className="flex flex-col gap-6 rounded-lg border border-line bg-panel p-6 sm:flex-row sm:items-center">
      <ScoreRing score={evaluation.overallScore} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-white">{challenge.title}</h1>
          <span
            className={clsx('rounded-full border px-3 py-0.5 text-sm font-semibold', VERDICT_CLASS[evaluation.verdict])}
          >
            {evaluation.verdict}
          </span>
        </div>

        <p className="mt-1 text-[13px] text-fg-muted">
          {candidate.name}
          {submission.submittedAt !== null && ` · Submitted ${formatDateTime(submission.submittedAt)}`}
          {` · Time used ${formatDuration(submission.timeUsedSec)} of ${challenge.timeLimitMin}:00`}
        </p>

        <p className="mt-3 text-[14px] leading-relaxed">{evaluation.summary}</p>

        <span className="mt-3 inline-flex items-center gap-1.5 rounded border border-line bg-editor px-2 py-1 text-[11.5px] text-fg-muted">
          <SourceIcon className="h-3.5 w-3.5" />
          Evaluated by {evaluation.source === 'llm' ? 'Gemini' : 'rules engine'}
        </span>
      </div>
    </section>
  )
}
