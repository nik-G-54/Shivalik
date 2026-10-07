import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { challenge } from '../../mock/challenge'
import { getSonarRows } from '../../mock/evaluation'
import { useReportStore } from '../../store/reportStore'
import { resetDemo } from '../../store/resetDemo'
import AppHeader from '../shared/AppHeader'
import { computeChanges } from '../shared/changes'
import { getSubmission } from '../shared/submission'
import { detectTestState, isTestsWeakened } from '../workspace/testRunner'
import AIJudgmentCard from './AIJudgmentCard'
import ChangeAnalysis from './ChangeAnalysis'
import CodeQualityTable from './CodeQualityTable'
import CorrectnessTable from './CorrectnessTable'
import DimensionCard from './DimensionCard'
import EngineeringAssessment from './EngineeringAssessment'
import EvidenceTimeline from './EvidenceTimeline'
import ReferenceComparison from './ReferenceComparison'
import ReportHeader from './ReportHeader'

export default function ReportPage() {
  const navigate = useNavigate()
  const evaluation = useReportStore((state) => state.evaluation)

  // The session is frozen once submitted, so derive these once from the live stores.
  const [submission] = useState(getSubmission)
  const [changes] = useState(computeChanges)
  const [sonarRows] = useState(() => getSonarRows(detectTestState(), isTestsWeakened()))

  if (!evaluation) {
    return (
      <div className="flex min-h-full flex-col bg-editor">
        <AppHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-white">No evaluation to show yet.</p>
          <p className="text-sm text-fg-muted">Start a challenge and submit your solution to generate a report.</p>
          <Link to="/" className="rounded bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-500">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const restart = () => {
    resetDemo()
    navigate(`/workspace/${challenge.id}`)
  }

  const aiCriterion = evaluation.criteria.find((c) => c.name === 'AI Judgment')

  return (
    <div className="min-h-full bg-editor">
      <AppHeader />

      <div className="mx-auto grid max-w-[1400px] gap-6 px-6 py-6 lg:grid-cols-[minmax(0,68fr)_minmax(0,32fr)]">
        <main className="min-w-0 space-y-6">
          <ReportHeader evaluation={evaluation} submission={submission} />

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {evaluation.dimensions.map((dimension) => (
              <DimensionCard key={dimension.name} dimension={dimension} />
            ))}
          </div>

          <CorrectnessTable correctness={evaluation.correctness} />
          <CodeQualityTable rows={sonarRows} />
          <ChangeAnalysis changes={changes} />
          <ReferenceComparison comparison={evaluation.referenceComparison} />
          <EngineeringAssessment criteria={evaluation.criteria} />
          <AIJudgmentCard usage={evaluation.aiUsage} score={aiCriterion?.score ?? 0} />

          <footer className="flex flex-wrap justify-end gap-3 pb-6">
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded border border-line px-4 py-2 text-sm hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={restart}
              className="flex items-center gap-1.5 rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500"
            >
              <RotateCcw className="h-4 w-4" />
              Restart demo
            </button>
          </footer>
        </main>

        <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:self-start">
          <EvidenceTimeline />
        </aside>
      </div>
    </div>
  )
}
