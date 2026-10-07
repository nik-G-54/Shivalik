import { FileCode2 } from 'lucide-react'

export default function EmptyEditor() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-fg-muted">
      <FileCode2 className="h-14 w-14 opacity-30" strokeWidth={1.2} />
      <p className="text-sm">Select a file from the explorer to start editing</p>
      <p className="text-xs">
        Try <kbd className="rounded border border-line bg-panel px-1.5 py-0.5">src/utils/query.js</kbd>
      </p>
    </div>
  )
}
