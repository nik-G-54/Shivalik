import type { FileNode } from '../../types'

export interface TreeNode {
  name: string
  path: string
  type: 'dir' | 'file'
  children: TreeNode[]
}

const byDirThenName = (a: TreeNode, b: TreeNode) =>
  a.type !== b.type ? (a.type === 'dir' ? -1 : 1) : a.name.localeCompare(b.name)

/** Builds a folder tree (folders first, then files, alphabetical) from flat file paths. */
export function buildTree(files: Pick<FileNode, 'path'>[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', type: 'dir', children: [] }

  for (const { path } of files) {
    const parts = path.split('/')
    let parent = root

    parts.forEach((name, i) => {
      const isFile = i === parts.length - 1
      const nodePath = parts.slice(0, i + 1).join('/')
      let node = parent.children.find((child) => child.name === name)

      if (!node) {
        node = { name, path: nodePath, type: isFile ? 'file' : 'dir', children: [] }
        parent.children.push(node)
      }
      parent = node
    })
  }

  const sortDeep = (node: TreeNode) => {
    node.children.sort(byDirThenName)
    node.children.forEach(sortDeep)
  }
  sortDeep(root)

  return root.children
}

/** Direct children of a directory path ('' = project root), or null if it does not exist. */
export function listDirectory(files: Pick<FileNode, 'path'>[], dir: string): TreeNode[] | null {
  const clean = dir.replace(/^\.\//, '').replace(/\/+$/, '')
  if (clean === '' || clean === '.') return buildTree(files)

  let level = buildTree(files)
  for (const part of clean.split('/')) {
    const next = level.find((node) => node.name === part && node.type === 'dir')
    if (!next) return null
    level = next.children
  }
  return level
}
