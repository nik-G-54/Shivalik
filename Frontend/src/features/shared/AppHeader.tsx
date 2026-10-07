import { Building2, SquareTerminal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { candidate } from '../../mock/candidate'

export default function AppHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-line bg-sidebar px-6">
      <Link to="/" className="flex items-center gap-2 font-semibold text-white">
        <SquareTerminal className="h-5 w-5 text-sky-400" />
        DevAssess
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <span className="hidden items-center gap-1.5 text-fg-muted sm:flex">
          <Building2 className="h-4 w-4" />
          Assessment by {candidate.company}
        </span>
        <span className="hidden h-4 w-px bg-line sm:block" />
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
            {candidate.initials}
          </span>
          <span className="text-white">{candidate.name}</span>
        </div>
      </div>
    </header>
  )
}
