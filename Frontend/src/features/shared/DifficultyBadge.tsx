import clsx from 'clsx'
import type { Difficulty } from '../../types'

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Easy: 'border-pass/50 bg-pass/10 text-pass',
  Medium: 'border-warn/50 bg-warn/10 text-warn',
  Hard: 'border-fail/50 bg-fail/10 text-fail',
}

interface DifficultyBadgeProps {
  difficulty: Difficulty
  className?: string
}

export default function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <span
      className={clsx(
        'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
        DIFFICULTY_CLASS[difficulty],
        className,
      )}
    >
      {difficulty}
    </span>
  )
}
