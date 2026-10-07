import { create } from 'zustand'

export type TerminalLineKind = 'cmd' | 'out' | 'pass' | 'fail' | 'info' | 'dim' | 'err'

export interface TerminalLine {
  id: number
  kind: TerminalLineKind
  text: string
}

interface TerminalState {
  lines: TerminalLine[]
  history: string[]
  /** True while a command (e.g. the test run) is still streaming output. */
  running: boolean
  append: (kind: TerminalLineKind, text: string) => void
  pushHistory: (command: string) => void
  setRunning: (running: boolean) => void
  clear: () => void
  reset: () => void
}

let nextId = 1

const welcome = (): TerminalLine[] => [
  { id: nextId++, kind: 'dim', text: 'Assessment terminal. Type "help" to see available commands.' },
]

export const useTerminalStore = create<TerminalState>((set) => ({
  lines: welcome(),
  history: [],
  running: false,

  append: (kind, text) =>
    set((state) => ({ lines: [...state.lines, { id: nextId++, kind, text }] })),

  pushHistory: (command) => set((state) => ({ history: [...state.history, command] })),

  setRunning: (running) => set({ running }),

  clear: () => set({ lines: [] }),

  reset: () => set({ lines: welcome(), history: [], running: false }),
}))
