import { Link } from 'react-router-dom'
import { challenge } from '../../mock/challenge'

interface PlaceholderPageProps {
  name: string
  route: string
  id?: string
}

const NAV = [
  { label: 'Dashboard', to: '/' },
  { label: 'Workspace', to: `/workspace/${challenge.id}` },
  { label: 'Evaluating', to: `/evaluating/${challenge.id}` },
  { label: 'Report', to: `/report/${challenge.id}` },
]

/** Temporary stand-in used by the feature pages until their real UIs are built. */
export default function PlaceholderPage({ name, route, id }: PlaceholderPageProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-editor text-fg">
      <h1 className="text-3xl font-semibold">{name}</h1>
      <code className="rounded border border-line bg-panel px-2 py-1 text-sm">
        {route}
        {id ? ` (id: ${id})` : ''}
      </code>
      <nav className="mt-2 flex gap-2">
        {NAV.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            className="rounded border border-line bg-panel px-3 py-1 text-sm hover:border-ai hover:text-ai"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
