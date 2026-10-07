import { Clock, Lock, Play } from 'lucide-react'
import clsx from 'clsx'
import type { ChallengeStatus, ChallengeSummary } from '../../types'
import DifficultyBadge from '../shared/DifficultyBadge'
import GithubIcon from '../shared/GithubIcon'

interface ChallengeCardProps {
  challenge: ChallengeSummary
  onStart: (id: string) => void
}

const STATUS_CLASS: Record<ChallengeStatus, string> = {
  'Not started': 'text-sky-300',
  'In progress': 'text-warn',
  Submitted: 'text-pass',
  Locked: 'text-fg-muted',
}

export default function ChallengeCard({ challenge, onStart }: ChallengeCardProps) {
  const locked = challenge.status === 'Locked'

  return (
    <article
      className={clsx(
        'flex flex-col rounded-lg border bg-panel p-5',
        locked ? 'border-line opacity-55' : 'border-line hover:border-sky-500/60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold leading-snug text-white">{challenge.title}</h3>
        {locked && <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted" aria-label="Locked" />}
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-fg-muted">
        <GithubIcon className="h-3.5 w-3.5" />
        {challenge.repo}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-line bg-editor px-2 py-0.5 text-xs">{challenge.category}</span>
        <DifficultyBadge difficulty={challenge.difficulty} />
        <span className="flex items-center gap-1 text-xs text-fg-muted">
          <Clock className="h-3.5 w-3.5" />
          {challenge.timeLimitMin} min
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {challenge.tags.map((tag) => (
          <span key={tag} className="rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-fg-muted">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-5">
        <span className={clsx('text-xs font-medium', STATUS_CLASS[challenge.status])}>{challenge.status}</span>
        {!locked && (
          <button
            type="button"
            onClick={() => onStart(challenge.id)}
            className="flex items-center gap-1.5 rounded bg-sky-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
          >
            <Play className="h-4 w-4" />
            Start challenge
          </button>
        )}
      </div>
    </article>
  )
}
