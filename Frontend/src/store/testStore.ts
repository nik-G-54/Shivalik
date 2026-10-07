import { create } from 'zustand'

export type TestState = 'buggy' | 'wrong' | 'fixed'

export interface TestRun {
  passed: number
  failed: number
  total: number
  state: TestState
  timestamp: number
}

interface TestStoreState {
  lastRun: TestRun | null
  runs: number
  recordRun: (run: Omit<TestRun, 'timestamp'>) => void
  reset: () => void
}

export const useTestStore = create<TestStoreState>((set) => ({
  lastRun: null,
  runs: 0,

  recordRun: (run) =>
    set((state) => ({
      lastRun: { ...run, timestamp: Date.now() },
      runs: state.runs + 1,
    })),

  reset: () => set({ lastRun: null, runs: 0 }),
}))
