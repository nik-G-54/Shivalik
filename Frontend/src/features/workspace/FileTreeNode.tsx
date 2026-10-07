import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'
import clsx from 'clsx'
import type { TreeNode } from './fileTree'
import FileIcon from './FileIcon'

interface FileTreeNodeProps {
  node: TreeNode
  depth: number
  activeFile: string | null
  modified: Set<string>
  onOpen: (path: string) => void
}

const INDENT_PX = 12

export default function FileTreeNode({ node, depth, activeFile, modified, onOpen }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const paddingLeft = 8 + depth * INDENT_PX

  if (node.type === 'file') {
    return (
      <button
        type="button"
        onClick={() => onOpen(node.path)}
        style={{ paddingLeft: paddingLeft + 16 }}
        className={clsx(
          'flex h-[22px] w-full items-center gap-1.5 pr-2 text-left text-[13px] hover:bg-white/5',
          activeFile === node.path && 'bg-white/10 text-white',
        )}
      >
        <FileIcon name={node.name} />
        <span className="truncate">{node.name}</span>
        {modified.has(node.path) && (
          <span title="Modified" className="ml-auto h-2 w-2 shrink-0 rounded-full bg-warn" />
        )}
      </button>
    )
  }

  const Chevron = expanded ? ChevronDown : ChevronRight
  const FolderIcon = expanded ? FolderOpen : Folder

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        style={{ paddingLeft }}
        className="flex h-[22px] w-full items-center gap-1 pr-2 text-left text-[13px] hover:bg-white/5"
      >
        <Chevron className="h-4 w-4 shrink-0 text-fg-muted" />
        <FolderIcon className="h-4 w-4 shrink-0 text-sky-300/80" />
        <span className="truncate">{node.name}</span>
      </button>
      {expanded &&
        node.children.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            modified={modified}
            onOpen={onOpen}
          />
        ))}
    </div>
  )
}
