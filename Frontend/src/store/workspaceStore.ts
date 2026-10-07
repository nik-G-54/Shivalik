import { create } from 'zustand'
import { challenge } from '../mock/challenge'
import type { FileNode } from '../types'

export type SidePanelTab = 'issue' | 'ai'

/** Pristine file contents, used to detect which files the candidate has modified. */
export const originalContent: Record<string, string> = Object.fromEntries(
  challenge.files.map((file) => [file.path, file.content]),
)

interface WorkspaceState {
  files: FileNode[]
  openTabs: string[]
  activeFile: string | null
  selectedFile: string | null
  selectedCode: string
  sidePanelTab: SidePanelTab
  /** Epoch ms when the candidate entered the workspace; null until started. */
  startedAt: number | null
  /** Open a file in a tab and focus it. */
  openFile: (path: string) => void
  closeTab: (path: string) => void
  /** Content changed by the candidate typing in the editor. */
  updateFile: (path: string, content: string) => void
  /** Content replaced programmatically (e.g. an accepted AI suggestion). Also focuses the file. */
  applyEdit: (path: string, content: string) => void
  /** Current editor selection. Pass an empty string to clear it. */
  setSelection: (file: string | null, code: string) => void
  setSidePanelTab: (tab: SidePanelTab) => void
  /** Starts the assessment clock if it has not started yet. */
  startSession: () => void
  reset: () => void
}

const initialState = () => ({
  files: challenge.files.map((file) => ({ ...file })),
  openTabs: [] as string[],
  activeFile: null as string | null,
  selectedFile: null as string | null,
  selectedCode: '',
  sidePanelTab: 'issue' as SidePanelTab,
  startedAt: null as number | null,
})

const withContent = (files: FileNode[], path: string, content: string) =>
  files.map((file) => (file.path === path ? { ...file, content } : file))

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ...initialState(),

  openFile: (path) => {
    if (!get().files.some((file) => file.path === path)) return
    set((state) => ({
      openTabs: state.openTabs.includes(path) ? state.openTabs : [...state.openTabs, path],
      activeFile: path,
    }))
  },

  closeTab: (path) =>
    set((state) => {
      const index = state.openTabs.indexOf(path)
      if (index === -1) return state

      const openTabs = state.openTabs.filter((tab) => tab !== path)
      const activeFile =
        state.activeFile === path
          ? (openTabs[index] ?? openTabs[index - 1] ?? null)
          : state.activeFile

      return { openTabs, activeFile }
    }),

  updateFile: (path, content) =>
    set((state) => ({ files: withContent(state.files, path, content) })),

  applyEdit: (path, content) =>
    set((state) => ({
      files: withContent(state.files, path, content),
      openTabs: state.openTabs.includes(path) ? state.openTabs : [...state.openTabs, path],
      activeFile: path,
    })),

  setSelection: (file, code) => set({ selectedFile: code ? file : null, selectedCode: code }),

  setSidePanelTab: (tab) => set({ sidePanelTab: tab }),

  startSession: () => {
    if (get().startedAt === null) set({ startedAt: Date.now() })
  },

  reset: () => set(initialState()),
}))
