import { useNavigate } from 'react-router-dom'
import { challenges } from '../../mock/challenge'
import { resetDemo } from '../../store/resetDemo'
import AppHeader from '../shared/AppHeader'
import ChallengeCard from './ChallengeCard'
import EvaluationStrip from './EvaluationStrip'
import StatTile from './StatTile'

export default function DashboardPage() {
  const navigate = useNavigate()

  const completed = challenges.filter((c) => c.status === 'Submitted').length
  const avgTime = Math.round(challenges.reduce((sum, c) => sum + c.timeLimitMin, 0) / challenges.length)

  // Every start is a clean run: clear events, test results, AI chat, workspace and report.
  const handleStart = (id: string) => {
    resetDemo()
    navigate(`/workspace/${id}`)
  }

  return (
    <div className="flex min-h-full flex-col bg-editor">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold text-white">Your Assessments</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">
              Real GitHub issues · Real codebases · AI assistant allowed · Your process is evaluated, not just your
              output.
            </p>
          </div>
          <div className="flex gap-3">
            <StatTile label="Assigned" value={String(challenges.length)} />
            <StatTile label="Completed" value={String(completed)} />
            <StatTile label="Avg time" value={`${avgTime} min`} />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} onStart={handleStart} />
          ))}
        </div>

        <EvaluationStrip />
      </main>
    </div>
  )
}
