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
  tags: string[]
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

export type AIMessageSource = 'script' | 'gemini'

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
  /** Where an assistant reply came from. */
  source?: AIMessageSource
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

export type Verdict = 'Strong Hire' | 'Hire' | 'Lean Hire' | 'No Hire'

export interface DimensionScore {
  name: string
  /** Percent weight; all dimensions sum to 100 */
  weight: number
  /** 0-100 */
  score: number
}

export interface ReferenceComparison {
  rootCause: ComparisonVerdict
  behavior: ComparisonVerdict
  implementation: ComparisonVerdict
  complexity: ComparisonVerdict
  coverage: ComparisonVerdict
}

export type AIUsagePattern = 'augmentation' | 'dependence' | 'independent'

export interface AIUsage {
  pattern: AIUsagePattern
  summary: string
  evidenceIds: string[]
}

/** The full evaluation. A rules engine or an LLM can produce it; the report only reads this shape. */
export interface Evaluation {
  /** 0-100 */
  overallScore: number
  verdict: Verdict
  summary: string
  dimensions: DimensionScore[]
  correctness: CorrectnessResults
  criteria: CriterionScore[]
  referenceComparison: ReferenceComparison
  aiUsage: AIUsage
  source: 'rules' | 'llm'
}
