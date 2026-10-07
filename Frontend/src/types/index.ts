export interface FileNode {
  path: string
  content: string
  language: string
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type ChallengeStatus = 'Not started' | 'In progress' | 'Submitted' | 'Locked'

/** Dashboard-card metadata. Locked challenges only need this much. */
export interface ChallengeSummary {
  id: string
  title: string
  repo: string
  difficulty: Difficulty
  timeLimitMin: number
  category: string
  status: ChallengeStatus
  issueTitle: string
}

export interface Challenge extends ChallengeSummary {
  issueMarkdown: string
  files: FileNode[]
  /** Path of the file that contains the bug */
  targetFile: string
}

export type EventType =
  | 'FILE_OPENED'
  | 'FILE_MODIFIED'
  | 'SEARCH_PERFORMED'
  | 'COMMAND_EXECUTED'
  | 'TEST_RUN'
  | 'TEST_PASSED'
  | 'TEST_FAILED'
  | 'AI_REQUEST'
  | 'AI_RESPONSE'
  | 'AI_SUGGESTION_ACCEPTED'
  | 'AI_SUGGESTION_REJECTED'
  | 'AI_CHANGE_REVERTED'
  | 'SUBMISSION_CREATED'

export interface ActivityEvent {
  /** E01, E02, ... */
  id: string
  type: EventType
  timestamp: number
  summary: string
  payload?: Record<string, unknown>
}

export interface CriterionScore {
  name: string
  score: number
  maxScore: number
  reason: string
  /** ActivityEvent ids that back up this score */
  evidenceIds: string[]
}

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'reverted'

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  code?: string
  targetFile?: string
  suggestionStatus?: SuggestionStatus
  /** File content before an accepted suggestion was applied, so it can be reverted. */
  previousContent?: string
}

// ---- Evaluation report ----

export interface TestResult {
  passed: number
  total: number
}

export interface CorrectnessResults {
  visible: TestResult
  hidden: TestResult
  regression: TestResult
}

export interface SonarRow {
  metric: 'Bugs' | 'Vulnerabilities' | 'Code Smells' | 'Complexity' | 'Coverage' | 'Duplication'
  base: number
  reference: number
  candidate: number
  /** Display suffix, e.g. '%' */
  unit?: string
  /** Whether a lower number is the better outcome (Bugs, Complexity...) */
  lowerIsBetter: boolean
}

export type ComparisonVerdict = 'Match' | 'Different' | 'Better' | 'Worse'

export interface ComparisonRow {
  aspect: 'Root cause' | 'Behavior' | 'Implementation' | 'Complexity'
  verdict: ComparisonVerdict
  note: string
}
