import { CircleDot, Target } from 'lucide-react'
import { challenge } from '../../mock/challenge'
import MarkdownView from '../shared/MarkdownView'

const LABELS = [
  { name: 'bug', className: 'border-fail/50 bg-fail/15 text-fail' },
  { name: 'query', className: 'border-sky-400/50 bg-sky-400/15 text-sky-300' },
]

export default function IssuePanel() {
  return (
    <div className="h-full overflow-y-auto bg-panel px-4 py-4">
      <h2 className="text-lg font-semibold leading-snug text-white">{challenge.issueTitle}</h2>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-pass/20 px-2.5 py-0.5 text-xs font-medium text-pass">
          <CircleDot className="h-3.5 w-3.5" />
          Open
        </span>
        <span className="text-xs text-fg-muted">{challenge.repo} · opened by a contributor</span>
      </div>

      <div className="mt-2 flex gap-1.5">
        {LABELS.map((label) => (
          <span
            key={label.name}
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${label.className}`}
          >
            {label.name}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-line bg-editor/40 px-4 py-2">
        <MarkdownView source={challenge.issueMarkdown} />
      </div>

      <div className="mt-4 rounded-md border border-ai/40 bg-ai/10 p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ai">
          <Target className="h-4 w-4" />
          Your task
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed marker:text-ai">
          <li>Fix the bug without breaking existing behaviour.</li>
          <li>Run the tests to check your work.</li>
          <li>You may use the AI assistant, but you are responsible for what you ship.</li>
        </ul>
      </div>
    </div>
  )
}
