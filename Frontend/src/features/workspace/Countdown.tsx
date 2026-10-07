import { Clock } from 'lucide-react'
import clsx from 'clsx'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { formatClock, useCountdown } from './useCountdown'

interface CountdownProps {
  limitMin: number
}

export default function Countdown({ limitMin }: CountdownProps) {
  const startedAt = useWorkspaceStore((state) => state.startedAt)
  const remaining = useCountdown(limitMin, startedAt)

  return (
    <div
      title="Time remaining"
      className={clsx(
        'flex items-center gap-1.5 rounded border px-3 py-1 font-mono text-sm tabular-nums',
        remaining < 120
          ? 'animate-pulse border-fail/50 bg-fail/10 text-fail'
          : remaining < 600
            ? 'border-warn/50 bg-warn/10 text-warn'
            : 'border-line bg-panel text-fg',
      )}
    >
      <Clock className="h-4 w-4" />
      {formatClock(remaining)}
    </div>
  )
}
