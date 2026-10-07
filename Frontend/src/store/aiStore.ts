import { create } from 'zustand'
import type { AIMessage } from '../types'

export type AIStatus = 'idle' | 'thinking' | 'streaming'

/** Editor selection attached to the next message as context. */
export interface SelectionChip {
  file: string
  code: string
}

interface AIState {
  messages: AIMessage[]
  status: AIStatus
  chip: SelectionChip | null
  /** Bumped to ask the chat input to take focus. */
  focusTick: number
  /** Debug toggle (Ctrl+Shift+D): show which engine produced each reply. */
  debug: boolean
  toggleDebug: () => void
  addMessage: (message: AIMessage) => void
  updateMessage: (id: string, patch: Partial<AIMessage>) => void
  setStatus: (status: AIStatus) => void
  attachSelection: (chip: SelectionChip) => void
  clearChip: () => void
  reset: () => void
}

let counter = 0
export const createMessageId = () => `m${++counter}`

export const useAIStore = create<AIState>((set) => ({
  messages: [],
  status: 'idle',
  chip: null,
  focusTick: 0,
  debug: false,

  toggleDebug: () => set((state) => ({ debug: !state.debug })),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  setStatus: (status) => set({ status }),

  attachSelection: (chip) => set((state) => ({ chip, focusTick: state.focusTick + 1 })),

  clearChip: () => set({ chip: null }),

  reset: () => set({ messages: [], status: 'idle', chip: null }),
}))
