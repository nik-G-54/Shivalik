import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'
import { logEvent } from '../../store/eventStore'
import { originalContent, useWorkspaceStore } from '../../store/workspaceStore'
import { buildTree } from './fileTree'
import FileIcon from './FileIcon'
import FileTreeNode from './FileTreeNode'

const SEARCH_LOG_DEBOUNCE_MS = 700

export default function FileExplorer() {
  const files = useWorkspaceStore((state) => state.files)
  const activeFile = useWorkspaceStore((state) => state.activeFile)
  const openFile = useWorkspaceStore((state) => state.openFile)
  const [query, setQuery] = useState('')

  const tree = useMemo(() => buildTree(files), [files])
  const modified = useMemo(
    () => new Set(files.filter((file) => file.content !== originalContent[file.path]).map((f) => f.path)),
    [files],
  )

  const term = query.trim().toLowerCase()
  const results = useMemo(
    () => (term ? files.filter((file) => file.path.split('/').pop()!.toLowerCase().includes(term)) : []),
    [files, term],
  )

  // Log the search once the candidate stops typing.
  useEffect(() => {
    if (!term) return
    const timer = setTimeout(() => {
      const count = useWorkspaceStore
        .getState()
        .files.filter((file) => file.path.split('/').pop()!.toLowerCase().includes(term)).length
      logEvent('SEARCH_PERFORMED', `Searched files for "${term}" (${count} results)`, {
        query: term,
        results: count,
      })
    }, SEARCH_LOG_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term])

  const handleOpen = (path: string) => {
    openFile(path)
    logEvent('FILE_OPENED', `Opened ${path}`, { path })
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
        Explorer
      </div>

      <div className="px-2 pb-2">
        <div className="flex items-center gap-1.5 rounded border border-line bg-editor px-2 py-1 focus-within:border-sky-500">
          <Search className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files"
            spellCheck={false}
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-fg-muted"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-2">
        {term ? (
          results.length === 0 ? (
            <p className="px-4 py-2 text-[13px] text-fg-muted">No files match "{query.trim()}"</p>
          ) : (
            results.map((file) => {
              const name = file.path.split('/').pop()!
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => handleOpen(file.path)}
                  className={clsx(
                    'flex h-[22px] w-full items-center gap-1.5 px-4 text-left text-[13px] hover:bg-white/5',
                    activeFile === file.path && 'bg-white/10 text-white',
                  )}
                >
                  <FileIcon name={name} />
                  <span className="truncate">{name}</span>
                  <span className="truncate text-xs text-fg-muted">{file.path}</span>
                  {modified.has(file.path) && (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-warn" />
                  )}
                </button>
              )
            })
          )
        ) : (
          <>
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-fg">
              json-server
            </div>
            {tree.map((node) => (
              <FileTreeNode
                key={node.path}
                node={node}
                depth={0}
                activeFile={activeFile}
                modified={modified}
                onOpen={handleOpen}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
