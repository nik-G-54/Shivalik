import { originalContent, useWorkspaceStore } from '../../store/workspaceStore'
import { countChanges, diffLines } from './lineDiff'

export interface FileChange {
  path: string
  added: number
  removed: number
}

export interface ChangeSummary {
  files: FileChange[]
  added: number
  removed: number
}

/** Real diff of every file against its original content, from the live workspace. */
export function computeChanges(): ChangeSummary {
  const files: FileChange[] = useWorkspaceStore
    .getState()
    .files.filter((file) => file.content !== originalContent[file.path])
    .map((file) => ({
      path: file.path,
      ...countChanges(diffLines(originalContent[file.path], file.content)),
    }))

  return {
    files,
    added: files.reduce((sum, f) => sum + f.added, 0),
    removed: files.reduce((sum, f) => sum + f.removed, 0),
  }
}
