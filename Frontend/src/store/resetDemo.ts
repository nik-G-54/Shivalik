import { useAIStore } from './aiStore'
import { useEventStore } from './eventStore'
import { useReportStore } from './reportStore'
import { useTerminalStore } from './terminalStore'
import { useTestStore } from './testStore'
import { useWorkspaceStore } from './workspaceStore'

/** Clears all session state so every demo run starts clean. */
export function resetDemo(): void {
  useEventStore.getState().reset()
  useTestStore.getState().reset()
  useAIStore.getState().reset()
  useTerminalStore.getState().reset()
  useWorkspaceStore.getState().reset()
  useReportStore.getState().reset()
}
