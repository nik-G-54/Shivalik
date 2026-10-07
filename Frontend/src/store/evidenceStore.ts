import { create } from 'zustand'

export type EvidenceFilter = 'all' | 'ai' | 'tests' | 'files'

const HIGHLIGHT_MS = 2000
let clearTimer: ReturnType<typeof setTimeout> | undefined

interface EvidenceState {
  filter: EvidenceFilter
  highlightedId: string | null
  /** Bumped on every focus request so repeated clicks on the same chip re-scroll. */
  focusTick: number
  setFilter: (filter: EvidenceFilter) => void
  /** Scroll the timeline to an event and highlight it for a moment. */
  focusEvidence: (id: string) => void
}

export const useEvidenceStore = create<EvidenceState>((set) => ({
  filter: 'all',
  highlightedId: null,
  focusTick: 0,

  setFilter: (filter) => set({ filter }),

  focusEvidence: (id) => {
    // Show everything so the target is never hidden by the current filter.
    set((state) => ({ filter: 'all', highlightedId: id, focusTick: state.focusTick + 1 }))
    clearTimeout(clearTimer)
    clearTimer = setTimeout(() => set({ highlightedId: null }), HIGHLIGHT_MS)
  },
}))
