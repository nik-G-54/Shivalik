import { X } from 'lucide-react'
import clsx from 'clsx'
import { logEvent } from '../../store/eventStore'
import { originalContent, useWorkspaceStore } from '../../store/workspaceStore'
import FileIcon from './FileIcon'

export default function EditorTabs() {
  const files = useWorkspaceStore((state) => state.files)
  const openTabs = useWorkspaceStore((state) => state.openTabs)
  const activeFile = useWorkspaceStore((state) => state.activeFile)
  const openFile = useWorkspaceStore((state) => state.openFile)
  const closeTab = useWorkspaceStore((state) => state.closeTab)

  const handleSelect = (path: string) => {
    if (path === activeFile) return
    openFile(path)
    logEvent('FILE_OPENED', `Switched to ${path}`, { path, via: 'tab' })
  }

  return (
    <div className="flex h-9 shrink-0 overflow-x-auto bg-sidebar" role="tablist">
      {openTabs.map((path) => {
        const name = path.split('/').pop()!
        const isActive = path === activeFile
        const isModified = files.find((file) => file.path === path)?.content !== originalContent[path]

        return (
          <div
            key={path}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(path)}
            title={path}
            className={clsx(
              'group flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-line border-t-2 pl-3 pr-1.5 text-[13px]',
              isActive
                ? 'border-t-sky-500 bg-editor text-white'
                : 'border-t-transparent bg-panel text-fg-muted hover:text-fg',
            )}
          >
            <FileIcon name={name} />
            <span className="whitespace-nowrap">{name}</span>
            <button
              type="button"
              aria-label={`Close ${name}`}
              onClick={(event) => {
                event.stopPropagation()
                closeTab(path)
              }}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/10"
            >
              {isModified && <span className="h-2 w-2 rounded-full bg-warn group-hover:hidden" />}
              <X className={clsx('h-3.5 w-3.5', isModified ? 'hidden group-hover:block' : 'opacity-0 group-hover:opacity-100', isActive && !isModified && 'opacity-100')} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
