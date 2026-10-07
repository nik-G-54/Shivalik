import { GitBranch, Loader2, Play, Send, SquareTerminal } from 'lucide-react'
import { useTerminalStore } from '../../store/terminalStore'
import type { Challenge } from '../../types'
import DifficultyBadge from '../shared/DifficultyBadge'
import { executeCommand } from './commands'
import Countdown from './Countdown'

interface TopBarProps {
  challenge: Challenge
  onSubmit: () => void
}

export default function TopBar({ challenge, onSubmit }: TopBarProps) {
  const running = useTerminalStore((state) => state.running)

  return (
    <header className="grid h-12 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line bg-sidebar px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center gap-2 font-semibold text-white">
          <SquareTerminal className="h-5 w-5 text-sky-400" />
          DevAssess
        </div>
        <span className="h-4 w-px shrink-0 bg-line" />
        <span className="truncate text-sm text-white">{challenge.title}</span>
        <span className="hidden shrink-0 items-center gap-1 text-xs text-fg-muted xl:flex">
          <GitBranch className="h-3.5 w-3.5" />
          {challenge.repo}
        </span>
        <DifficultyBadge difficulty={challenge.difficulty} />
      </div>

      <Countdown limitMin={challenge.timeLimitMin} />

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void executeCommand('npm test')}
          disabled={running}
          className="flex items-center gap-1.5 rounded border border-line bg-panel px-3 py-1.5 text-sm hover:border-pass hover:text-pass disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Tests
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center gap-1.5 rounded bg-sky-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
        >
          <Send className="h-4 w-4" />
          Submit
        </button>
      </div>
    </header>
  )
}
