import { create } from 'zustand'
import { evaluate } from '../features/report/evaluator'
import type { Evaluation } from '../types'

export type ReportStatus = 'idle' | 'running' | 'done' | 'error'

interface ReportState {
  evaluation: Evaluation | null
  status: ReportStatus
  /** Evaluates the live session. Resolves once the evaluation is stored (or failed). */
  run: () => Promise<void>
  reset: () => void
}

export const useReportStore = create<ReportState>((set) => ({
  evaluation: null,
  status: 'idle',

  run: async () => {
    set({ status: 'running', evaluation: null })
    try {
      set({ evaluation: await evaluate(), status: 'done' })
    } catch {
      set({ status: 'error' })
    }
  },

  reset: () => set({ evaluation: null, status: 'idle' }),
}))
