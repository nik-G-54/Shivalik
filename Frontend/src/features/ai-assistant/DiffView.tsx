import clsx from 'clsx'
import type { DiffLine } from '../shared/lineDiff'

interface DiffViewProps {
  lines: DiffLine[]
}

export default function DiffView({ lines }: DiffViewProps) {
  return (
    <pre className="max-h-64 overflow-auto bg-sidebar py-1 text-[12px] leading-[1.5]">
      {lines.map((line, i) => {
        if (line.type === 'skip') {
          return (
            <div key={i} className="px-3 text-fg-muted/70">
              ⋯ {line.count} unchanged {line.count === 1 ? 'line' : 'lines'}
            </div>
          )
        }
        return (
          <div
            key={i}
            className={clsx(
              'flex whitespace-pre px-3',
              line.type === 'add' && 'bg-pass/15 text-pass',
              line.type === 'del' && 'bg-fail/15 text-fail',
              line.type === 'same' && 'text-fg-muted',
            )}
          >
            <span className="w-4 shrink-0 select-none">
              {line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' '}
            </span>
            <span>{line.text}</span>
          </div>
        )
      })}
    </pre>
  )
}
