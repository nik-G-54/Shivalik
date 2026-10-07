import { create } from 'zustand'
import type { ActivityEvent, EventType } from '../types'

interface EventState {
  events: ActivityEvent[]
  logEvent: (
    type: EventType,
    summary: string,
    payload?: Record<string, unknown>,
  ) => ActivityEvent
  reset: () => void
}

const formatId = (n: number) => `E${String(n).padStart(2, '0')}`

export const useEventStore = create<EventState>((set, get) => ({
  events: [],

  logEvent: (type, summary, payload) => {
    const event: ActivityEvent = {
      id: formatId(get().events.length + 1),
      type,
      timestamp: Date.now(),
      summary,
      payload,
    }
    set((state) => ({ events: [...state.events, event] }))
    return event
  },

  reset: () => set({ events: [] }),
}))

/** Non-hook access for event handlers and helpers outside React. */
export const logEvent = (
  type: EventType,
  summary: string,
  payload?: Record<string, unknown>,
) => useEventStore.getState().logEvent(type, summary, payload)
