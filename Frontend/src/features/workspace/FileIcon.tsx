import { File, FileCode, FileJson, FileText } from 'lucide-react'
import clsx from 'clsx'

interface FileIconProps {
  name: string
  className?: string
}

/** File icon with a colour hint by extension: js yellow, json amber, md blue. */
export default function FileIcon({ name, className }: FileIconProps) {
  const ext = name.split('.').pop()?.toLowerCase()
  const size = clsx('h-4 w-4 shrink-0', className)

  switch (ext) {
    case 'js':
      return <FileCode className={clsx(size, 'text-yellow-300')} />
    case 'json':
      return <FileJson className={clsx(size, 'text-orange-400')} />
    case 'md':
      return <FileText className={clsx(size, 'text-sky-400')} />
    default:
      return <File className={clsx(size, 'text-fg-muted')} />
  }
}
