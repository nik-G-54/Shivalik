import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export type StepStatus = 'pending' | 'active' | 'done'

interface EvaluationStepProps {
  label: string
  status: StepStatus
  detail?: string
}

export default function EvaluationStep({ label, status, detail }: EvaluationStepProps) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0">
        {status === 'done' ? (
          <CheckCircle2 className="h-5 w-5 text-pass" />
        ) : status === 'active' ? (
          <Loader2 className="h-5 w-5 animate-spin text-sky-400" />
        ) : (
          <Circle className="h-5 w-5 text-line" />
        )}
      </span>
      <div className="min-w-0">
        <div className={clsx('text-[14px]', status === 'pending' ? 'text-fg-muted' : 'text-white')}>{label}</div>
        {status === 'done' && detail && <div className="text-[12.5px] text-fg-muted">{detail}</div>}
      </div>
    </li>
  )
}
