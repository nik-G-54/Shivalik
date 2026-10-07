import clsx from 'clsx'
import type { TerminalLine as TerminalLineData } from '../../store/terminalStore'
import { PROMPT } from './commands'

interface TerminalLineProps {
  line: TerminalLineData
}

const KIND_CLASS: Record<TerminalLineData['kind'], string> = {
  cmd: 'text-white',
  out: 'text-fg',
  pass: 'text-pass',
  fail: 'text-fail',
  info: 'text-sky-300',
  dim: 'text-fg-muted',
  err: 'text-fail',
}

export default function TerminalLine({ line }: TerminalLineProps) {
  const isCommand = line.kind === 'cmd' && line.text.startsWith(PROMPT)

  return (
    <div className={clsx('min-h-[1.4em] whitespace-pre-wrap break-words', KIND_CLASS[line.kind])}>
      {isCommand ? (
        <>
          <span className="text-pass">{PROMPT}</span>
          {line.text.slice(PROMPT.length)}
        </>
      ) : (
        line.text
      )}
    </div>
  )
}
