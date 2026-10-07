import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEventStore } from '../../store/eventStore'
import { useReportStore } from '../../store/reportStore'
import { formatDateTime, getSubmission } from '../shared/submission'
import EvaluationStep, { type StepStatus } from './EvaluationStep'
import { AI_STEP_LABEL, buildPreSteps, REPORT_STEP_LABEL } from './evaluationSteps'

const STEP_MS = 1000
const AI_MIN_MS = 1500
const REPORT_MS = 700
const REDIRECT_MS = 800

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export default function EvaluatingPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const [submission] = useState(getSubmission)
  const [eventCount] = useState(() => useEventStore.getState().events.length)
  const [steps] = useState(() => [
    ...buildPreSteps(eventCount),
    { label: AI_STEP_LABEL, detail: () => '' },
    { label: REPORT_STEP_LABEL, detail: () => '' },
  ])

  const [completed, setCompleted] = useState(0)
  const [details, setDetails] = useState<string[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const finish = (index: number, detail: string) => {
      if (cancelled) return
      setDetails((previous) => {
        const next = [...previous]
        next[index] = detail
        return next
      })
      setCompleted(index + 1)
    }

    const run = async () => {
      for (let i = 0; i < 5; i++) {
        await sleep(STEP_MS)
        finish(i, steps[i].detail())
      }

      // The AI evaluation step lasts until evaluate() resolves, and at least AI_MIN_MS.
      await Promise.all([useReportStore.getState().run(), sleep(AI_MIN_MS)])
      if (cancelled) return
      const { evaluation } = useReportStore.getState()
      if (!evaluation) {
        setFailed(true)
        return
      }
      finish(
        5,
        evaluation.source === 'llm'
          ? `Gemini analysed ${useEventStore.getState().events.length} evidence items`
          : 'Rules engine (offline mode)',
      )

      await sleep(REPORT_MS)
      finish(6, 'Report ready')

      await sleep(REDIRECT_MS)
      if (!cancelled) navigate(`/report/${id}`)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [id, navigate, steps])

  const statusOf = (index: number): StepStatus =>
    index < completed ? 'done' : index === completed ? 'active' : 'pending'

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-editor p-6">
      <div className="fixed left-0 top-0 h-0.5 w-full bg-line">
        <div
          className="h-full bg-sky-500 transition-all duration-700"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>

      <div className="w-full max-w-md rounded-xl border border-line bg-panel p-7 shadow-xl">
        <h1 className="text-xl font-semibold text-white">Evaluating your submission</h1>
        <p className="mt-1 font-mono text-[12.5px] text-fg-muted">
          {submission.id}
          {submission.submittedAt !== null && ` · ${formatDateTime(submission.submittedAt)}`}
        </p>

        <ol className="mt-6 space-y-4">
          {steps.map((step, index) => (
            <EvaluationStep key={step.label} label={step.label} status={statusOf(index)} detail={details[index]} />
          ))}
        </ol>

        {failed && (
          <p className="mt-5 text-sm text-fail">
            The evaluation failed.{' '}
            <Link to="/" className="underline">
              Back to dashboard
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
