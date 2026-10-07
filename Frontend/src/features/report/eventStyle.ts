import {
  CheckCircle2,
  File,
  Pencil,
  Play,
  Search,
  Send,
  Sparkles,
  SquareTerminal,
  Undo2,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { EvidenceFilter } from '../../store/evidenceStore'
import type { EventType } from '../../types'

interface EventStyle {
  icon: LucideIcon
  /** Tailwind text colour for the icon */
  color: string
}

const STYLES: Record<EventType, EventStyle> = {
  FILE_OPENED: { icon: File, color: 'text-fg-muted' },
  FILE_MODIFIED: { icon: Pencil, color: 'text-fg-muted' },
  SEARCH_PERFORMED: { icon: Search, color: 'text-fg-muted' },
  COMMAND_EXECUTED: { icon: SquareTerminal, color: 'text-fg-muted' },
  TEST_RUN: { icon: Play, color: 'text-fg-muted' },
  TEST_PASSED: { icon: CheckCircle2, color: 'text-pass' },
  TEST_FAILED: { icon: XCircle, color: 'text-fail' },
  AI_REQUEST: { icon: Sparkles, color: 'text-ai' },
  AI_RESPONSE: { icon: Sparkles, color: 'text-ai' },
  AI_SUGGESTION_ACCEPTED: { icon: CheckCircle2, color: 'text-ai' },
  AI_SUGGESTION_REJECTED: { icon: X, color: 'text-ai' },
  AI_CHANGE_REVERTED: { icon: Undo2, color: 'text-ai' },
  SUBMISSION_CREATED: { icon: Send, color: 'text-sky-400' },
}

export const eventStyle = (type: EventType): EventStyle => STYLES[type]

/** Which timeline filter an event belongs to. Submission shows under "All" only. */
export function eventCategory(type: EventType): Exclude<EvidenceFilter, 'all'> | null {
  if (type.startsWith('AI_')) return 'ai'
  if (type.startsWith('TEST_') || type === 'COMMAND_EXECUTED') return 'tests'
  if (type.startsWith('FILE_') || type === 'SEARCH_PERFORMED') return 'files'
  return null
}
