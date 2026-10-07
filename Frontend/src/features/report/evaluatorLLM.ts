import { challenge, REFERENCE_FIX } from '../../mock/challenge'
import { DIMENSIONS, getSonarRows } from '../../mock/evaluation'
import { generateJson, type GeminiSchema } from '../../lib/gemini'
import { useAIStore } from '../../store/aiStore'
import { useEventStore } from '../../store/eventStore'
import { originalContent, useWorkspaceStore } from '../../store/workspaceStore'
import type {
  AIUsagePattern,
  ComparisonVerdict,
  CriterionScore,
  Evaluation,
  ReferenceComparison,
} from '../../types'
import { computeChanges } from '../shared/changes'
import { collapseDiff, diffLines, type DiffLine } from '../shared/lineDiff'
import { formatDuration } from '../shared/submission'
import { detectTestState, isTestsWeakened } from '../workspace/testRunner'
import { verdictFor, VERDICTS } from './verdict'

const COMPARISONS: ComparisonVerdict[] = ['Match', 'Different', 'Better', 'Worse']
const PATTERNS: AIUsagePattern[] = ['augmentation', 'dependence', 'independent']
const COMPARISON_KEYS: (keyof ReferenceComparison)[] = ['rootCause', 'behavior', 'implementation', 'complexity', 'coverage']

/** Dimensions whose scores come from Gemini; the rest are deterministic and stay with the rules result. */
const LLM_DIMENSIONS = ['Engineering Process', 'AI Judgment', 'Reference Alignment'] as const

const SYSTEM_INSTRUCTION = [
  'You are an evaluator for a software engineering assessment platform. You interpret evidence about how a candidate worked; you do not produce the deterministic facts.',
  'Rules:',
  '- You never invent events. Every claim must cite evidence ids (like "E04") that exist in the input event log.',
  '- Test results are authoritative. Do not contradict them.',
  '- Do not penalise using the AI assistant itself. Judge how the candidate verified, challenged and adapted AI output.',
  '- Changing or weakening tests to make them pass is a strong negative signal.',
  '- Reproducing the bug before changing code, testing AI output, rejecting bad suggestions and reverting incorrect changes are strong positive signals.',
  '- Reasons must be specific, 1-2 sentences, and mention what the candidate actually did.',
  '- Criterion scores are integers from 0 to 10. Dimension scores are 0 to 100.',
  '- Answer only with JSON matching the schema.',
].join('\n')

const str = (description?: string): GeminiSchema => ({ type: 'STRING', ...(description && { description }) })
const enumOf = (values: string[]): GeminiSchema => ({ type: 'STRING', enum: values })
const idList: GeminiSchema = { type: 'ARRAY', items: str(), description: 'Event ids from the input, e.g. E04' }

const RESPONSE_SCHEMA: GeminiSchema = {
  type: 'OBJECT',
  properties: {
    summary: str('2-3 sentences describing what the candidate did and how well'),
    verdict: enumOf(VERDICTS),
    criteria: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: str(),
          score: { type: 'INTEGER', description: '0-10' },
          reason: str(),
          evidenceIds: idList,
        },
        required: ['name', 'score', 'reason', 'evidenceIds'],
      },
    },
    referenceComparison: {
      type: 'OBJECT',
      properties: Object.fromEntries(COMPARISON_KEYS.map((key) => [key, enumOf(COMPARISONS)])),
      required: COMPARISON_KEYS,
    },
    aiUsage: {
      type: 'OBJECT',
      properties: { pattern: enumOf(PATTERNS), summary: str(), evidenceIds: idList },
      required: ['pattern', 'summary', 'evidenceIds'],
    },
    engineeringProcessScore: { type: 'INTEGER', description: '0-100' },
    aiJudgmentScore: { type: 'INTEGER', description: '0-100' },
    referenceAlignmentScore: { type: 'INTEGER', description: '0-100' },
  },
  required: [
    'summary',
    'verdict',
    'criteria',
    'referenceComparison',
    'aiUsage',
    'engineeringProcessScore',
    'aiJudgmentScore',
    'referenceAlignmentScore',
  ],
}

interface GeminiCriterion {
  name?: string
  score?: number
  reason?: string
  evidenceIds?: string[]
}

interface GeminiEvaluation {
  summary?: string
  verdict?: string
  criteria?: GeminiCriterion[]
  referenceComparison?: Partial<Record<keyof ReferenceComparison, string>>
  aiUsage?: { pattern?: string; summary?: string; evidenceIds?: string[] }
  engineeringProcessScore?: number
  aiJudgmentScore?: number
  referenceAlignmentScore?: number
}

/** What the last validation dropped or replaced, so a run can be audited. */
export const llmDebug: { droppedEvidenceIds: string[]; criteriaTakenFromRules: string[] } = {
  droppedEvidenceIds: [],
  criteriaTakenFromRules: [],
}

const clampTo = (value: unknown, min: number, max: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : null

const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): T | null =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null

/** Compact diff text for the prompt: changed lines with two lines of context. */
function diffText(before: string, after: string): string {
  const render = (line: DiffLine) =>
    line.type === 'skip' ? `  ... ${line.count} unchanged lines` : `${line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' '} ${line.text}`
  return collapseDiff(diffLines(before, after), 2).map(render).join('\n')
}

/** Everything Gemini is allowed to see, built from the live session. */
function buildEvidencePackage(rules: Evaluation) {
  const events = useEventStore.getState().events
  const startedAt = useWorkspaceStore.getState().startedAt ?? events[0]?.timestamp ?? 0
  const state = detectTestState()
  const weakened = isTestsWeakened()
  const changes = computeChanges()
  const files = useWorkspaceStore.getState().files
  const target = challenge.targetFile

  return {
    challenge: {
      title: challenge.title,
      repo: challenge.repo,
      issue: `${challenge.issueTitle}\n${challenge.issueMarkdown.slice(0, 700)}`,
      targetFile: target,
    },
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      time: formatDuration(Math.max(0, Math.round((e.timestamp - startedAt) / 1000))),
      summary: e.summary,
    })),
    changedFiles: changes.files.map((f) => ({
      path: f.path,
      added: f.added,
      removed: f.removed,
      diff: diffText(originalContent[f.path], files.find((x) => x.path === f.path)?.content ?? ''),
    })),
    aiSuggestions: useAIStore
      .getState()
      .messages.filter((m) => m.role === 'assistant' && m.code && m.targetFile)
      .map((m) => ({
        messageId: m.id,
        file: m.targetFile,
        status: m.suggestionStatus,
        diffAgainstOriginal: diffText(originalContent[m.targetFile!] ?? '', m.code!),
      })),
    referenceFixDiff: diffText(originalContent[target], REFERENCE_FIX),
    testResults: rules.correctness,
    deterministicFacts: {
      note: 'Authoritative. Computed by the platform, not by you.',
      finalCodeState: state === 'fixed' ? 'correct fix' : state === 'wrong' ? 'flawed fix' : 'bug still present',
      testsWeakenedByCandidate: weakened,
      sonarQube: getSonarRows(state, weakened),
      changeAnalysis: { files: changes.files.length, added: changes.added, removed: changes.removed },
      dimensionWeights: DIMENSIONS.map((d) => ({ name: d.name, weight: d.weight })),
      correctnessScore: rules.dimensions.find((d) => d.name === 'Correctness')?.score,
      codeQualityScore: rules.dimensions.find((d) => d.name === 'Code Quality')?.score,
    },
    criteriaToScore: rules.criteria.map((c) => c.name),
  }
}

/**
 * Validates Gemini's answer against the evidence and merges it into the rules result.
 * Anything missing or invalid is taken from the rules result instead.
 */
export function mergeLLMResult(raw: GeminiEvaluation, rules: Evaluation, validIds: Set<string>): Evaluation {
  llmDebug.droppedEvidenceIds = []
  llmDebug.criteriaTakenFromRules = []

  const keepValid = (ids: unknown): string[] => {
    if (!Array.isArray(ids)) return []
    llmDebug.droppedEvidenceIds.push(...ids.map(String).filter((id) => !validIds.has(id)))
    return [...new Set(ids.filter((id): id is string => typeof id === 'string' && validIds.has(id)))]
  }

  const criteria: CriterionScore[] = rules.criteria.map((fallback) => {
    const candidate = raw.criteria?.find((c) => c.name === fallback.name)
    const score = clampTo(candidate?.score, 0, fallback.maxScore)
    const evidenceIds = keepValid(candidate?.evidenceIds)
    const reason = typeof candidate?.reason === 'string' ? candidate.reason.trim() : ''
    if (!candidate || score === null || evidenceIds.length === 0 || reason === '') {
      llmDebug.criteriaTakenFromRules.push(fallback.name)
      return fallback
    }
    return { name: fallback.name, score, maxScore: fallback.maxScore, reason, evidenceIds }
  })

  const referenceComparison = { ...rules.referenceComparison }
  for (const key of COMPARISON_KEYS) {
    referenceComparison[key] = oneOf(raw.referenceComparison?.[key], COMPARISONS) ?? rules.referenceComparison[key]
  }

  const aiEvidence = keepValid(raw.aiUsage?.evidenceIds)
  const aiUsage = {
    pattern: oneOf(raw.aiUsage?.pattern, PATTERNS) ?? rules.aiUsage.pattern,
    summary: raw.aiUsage?.summary?.trim() || rules.aiUsage.summary,
    evidenceIds: aiEvidence.length > 0 ? aiEvidence : rules.aiUsage.evidenceIds,
  }

  const llmScores: Record<(typeof LLM_DIMENSIONS)[number], number | null> = {
    'Engineering Process': clampTo(raw.engineeringProcessScore, 0, 100),
    'AI Judgment': clampTo(raw.aiJudgmentScore, 0, 100),
    'Reference Alignment': clampTo(raw.referenceAlignmentScore, 0, 100),
  }
  const dimensions = rules.dimensions.map((d) => {
    const llm = (LLM_DIMENSIONS as readonly string[]).includes(d.name) ? llmScores[d.name as (typeof LLM_DIMENSIONS)[number]] : null
    return llm === null ? d : { ...d, score: llm }
  })

  const overallScore = Math.round(dimensions.reduce((sum, d) => sum + (d.weight * d.score) / 100, 0))

  // Trust Gemini's verdict only when it is consistent with the score (within one step of the thresholds).
  const computed = verdictFor(overallScore)
  const proposed = oneOf(raw.verdict, VERDICTS)
  const verdict =
    proposed && Math.abs(VERDICTS.indexOf(proposed) - VERDICTS.indexOf(computed)) <= 1 ? proposed : computed

  return {
    overallScore,
    verdict,
    summary: raw.summary?.trim() || rules.summary,
    dimensions,
    correctness: rules.correctness,
    criteria,
    referenceComparison,
    aiUsage,
    source: 'llm',
  }
}

/** Asks Gemini to interpret the evidence. Returns null on any failure so the caller keeps the rules result. */
export async function evaluateWithLLM(rules: Evaluation): Promise<Evaluation | null> {
  const evidence = buildEvidencePackage(rules)
  const validIds = new Set(evidence.events.map((e) => e.id))

  const raw = await generateJson<GeminiEvaluation>({
    systemInstruction: SYSTEM_INSTRUCTION,
    prompt: `Evaluate this candidate session. Evidence package (JSON):\n${JSON.stringify(evidence)}`,
    responseSchema: RESPONSE_SCHEMA,
    temperature: 0.2,
  })
  if (!raw || typeof raw !== 'object') return null

  try {
    return mergeLLMResult(raw, rules, validIds)
  } catch (error) {
    console.warn('[gemini] could not merge the evaluation:', error)
    return null
  }
}
