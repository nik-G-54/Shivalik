import { challenge, REFERENCE_FIX, WRONG_MARKER } from '../../mock/challenge'
import { DIMENSIONS, getSonarRows } from '../../mock/evaluation'
import { useAIStore } from '../../store/aiStore'
import { useEventStore } from '../../store/eventStore'
import { useTestStore, type TestState } from '../../store/testStore'
import { useWorkspaceStore } from '../../store/workspaceStore'
import type {
  ActivityEvent,
  AIUsage,
  ComparisonVerdict,
  CorrectnessResults,
  CriterionScore,
  Evaluation,
  ReferenceComparison,
  TestResult,
} from '../../types'
import { TESTS_FILE } from '../ai-assistant/aiScript'
import { computeChanges } from '../shared/changes'
import { detectTestState, isTestsWeakened } from '../workspace/testRunner'
import { evaluateWithLLM } from './evaluatorLLM'
import { verdictFor } from './verdict'

const HIDDEN: Record<TestState, TestResult> = {
  fixed: { passed: 6, total: 6 },
  wrong: { passed: 4, total: 6 },
  buggy: { passed: 3, total: 6 },
}

const REGRESSION: Record<TestState, TestResult> = {
  fixed: { passed: 3, total: 3 },
  wrong: { passed: 1, total: 3 },
  buggy: { passed: 0, total: 3 },
}

const VISIBLE_TOTAL = 10
const RECOVERY_PENALTY = 25
const MAX_CRITERION_SCORE = 10

const clamp = (value: number, min = 0, max = MAX_CRITERION_SCORE) => Math.max(min, Math.min(max, value))
const ratio = ({ passed, total }: TestResult) => (total === 0 ? 0 : passed / total)
const normalize = (code: string) => code.replace(/\s+/g, ' ').trim()

const VERDICT_SCORE: Record<ComparisonVerdict, number> = { Match: 100, Better: 100, Different: 60, Worse: 20 }

/** Visible = the real last test run; hidden and regression come from the final state of the target file. */
export function correctnessFor(state: TestState): CorrectnessResults {
  const lastRun = useTestStore.getState().lastRun
  return {
    visible: lastRun ? { passed: lastRun.passed, total: lastRun.total } : { passed: 0, total: VISIBLE_TOTAL },
    hidden: HIDDEN[state],
    regression: REGRESSION[state],
  }
}

function compare(candidate: number, reference: number, lowerIsBetter: boolean): ComparisonVerdict {
  if (candidate === reference) return 'Match'
  return candidate < reference === lowerIsBetter ? 'Better' : 'Worse'
}

/** Deterministic, rule-based evaluation of the live session. Always available, works offline. */
export async function evaluateWithRules(): Promise<Evaluation> {
  const events = useEventStore.getState().events
  const messages = useAIStore.getState().messages
  const state = detectTestState()
  const weakened = isTestsWeakened()
  const changes = computeChanges()
  const target = challenge.targetFile

  // ---- event helpers ----
  const at = (event?: ActivityEvent) => (event ? events.indexOf(event) : -1)
  const of = (...types: ActivityEvent['type'][]) => events.filter((e) => types.includes(e.type))
  const laterThan = (event: ActivityEvent | undefined, list: ActivityEvent[]) =>
    event ? list.find((e) => at(e) > at(event)) : undefined
  const ids = (list: (ActivityEvent | undefined)[]) =>
    [...new Set(list.filter((e): e is ActivityEvent => e !== undefined))]
      .sort((a, b) => at(a) - at(b))
      .map((e) => e.id)
  const messageFor = (event: ActivityEvent) => messages.find((m) => m.id === event.payload?.messageId)

  // ---- signals ----
  const accepted = of('AI_SUGGESTION_ACCEPTED')
  const firstAccepted = accepted[0]
  const acceptedWrong = accepted.find((e) => messageFor(e)?.code?.includes(WRONG_MARKER))
  const acceptedTests = accepted.find((e) => e.payload?.targetFile === TESTS_FILE)
  const rejected = of('AI_SUGGESTION_REJECTED')
  const rejectedTests = rejected.find((e) => e.payload?.targetFile === TESTS_FILE)
  const reverted = of('AI_CHANGE_REVERTED')
  const revertedWrong = acceptedWrong
    ? reverted.find((e) => e.payload?.messageId === acceptedWrong.payload?.messageId)
    : undefined
  const keptWrong = Boolean(acceptedWrong) && !revertedWrong

  const testResults = of('TEST_PASSED', 'TEST_FAILED')
  const failedRuns = of('TEST_FAILED')
  const firstFailed = failedRuns[0]
  const lastPassed = of('TEST_PASSED').at(-1)
  const testRuns = of('TEST_RUN')

  const changeEvents = of('FILE_MODIFIED', 'AI_SUGGESTION_ACCEPTED', 'AI_CHANGE_REVERTED')
  const firstChange = changeEvents[0]
  const lastChange = changeEvents.at(-1)
  const verifiedAfterChange = laterThan(lastChange, testResults)
  const finalResult = testResults.at(-1)
  const finalPassed = finalResult?.type === 'TEST_PASSED' && (!lastChange || at(finalResult) > at(lastChange))
  const beforeFirstChange = (e: ActivityEvent) => !firstChange || at(e) < at(firstChange)
  // A test run before the first code change (file edit or AI apply). A failure is the strongest form.
  const preChangeFailed = firstFailed !== undefined && beforeFirstChange(firstFailed) ? firstFailed : undefined
  const preChangeTest = preChangeFailed ?? testRuns.find(beforeFirstChange)
  const reproduced = preChangeFailed !== undefined
  const failedAfterAccept = laterThan(acceptedWrong ?? firstAccepted, failedRuns)
  const verifiedAIChange = laterThan(firstAccepted, testResults)

  const openedTarget = events.find((e) => e.type === 'FILE_OPENED' && e.payload?.path === target)
  const targetChange = changeEvents.find((e) => e.payload?.path === target || e.payload?.targetFile === target)
  const viewedTarget = openedTarget ?? targetChange

  const requests = of('AI_REQUEST')
  const firstRequest = requests[0]
  const askedBeforeChange = firstRequest !== undefined && (!firstChange || at(firstRequest) < at(firstChange))

  // A test failure, then a later change, then a later test run: the candidate iterated on feedback.
  const iterated = failedRuns.some((failed) => {
    const change = laterThan(failed, changeEvents)
    return change !== undefined && laterThan(change, testRuns) !== undefined
  })

  const targetLines = (changes.files.find((f) => f.path === target)?.added ?? 0) + (changes.files.find((f) => f.path === target)?.removed ?? 0)
  const changedNonTest = changes.files.filter((f) => !f.path.startsWith('tests/'))
  const testsTouched = changes.files.some((f) => f.path.startsWith('tests/'))

  // ---- correctness ----
  const correctness = correctnessFor(state)

  // ---- criteria ----
  const rootCauseScore = clamp(
    1 + (viewedTarget ? 2 : 0) + (reproduced ? 2 : 0) + (askedBeforeChange ? 1 : 0) + (state === 'fixed' ? 3 : state === 'wrong' ? 1 : 0),
  )
  const rootCauseReason = [
    state === 'fixed'
      ? 'Identified that _ne was missing from the operator list and ended with a fix that matches the reference behaviour.'
      : state === 'wrong'
        ? 'Recognised that _ne needed explicit handling, but the final change mishandles the query input, so the cause was only partly understood.'
        : 'The _ne bug was not fixed in the submitted code.',
    viewedTarget ? `Worked in ${target}.` : `Never looked at ${target}.`,
    preChangeTest
      ? reproduced
        ? 'Reproduced the bug with the test suite before changing code.'
        : 'Ran the test suite before changing code.'
      : 'Changed code before running any tests.',
    askedBeforeChange ? 'Asked questions before editing.' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const testingScore = clamp(
    testRuns.length === 0
      ? 1
      : 1 +
          2 +
          (testRuns.length >= 2 ? 1 : 0) +
          (verifiedAfterChange ? 2 : 0) +
          (finalPassed ? 2 : 0) +
          (verifiedAIChange ? 1 : 0) -
          (weakened ? 5 : 0),
  )
  const testingReason =
    testRuns.length === 0
      ? 'Never ran the test suite, so nothing the candidate changed was verified.'
      : [
          `Ran the tests ${testRuns.length} ${testRuns.length === 1 ? 'time' : 'times'}.`,
          verifiedAfterChange ? 'Re-ran them after the last change.' : 'Did not re-run tests after the last change.',
          verifiedAIChange ? 'Ran the tests after applying an AI suggestion instead of trusting it.' : '',
          finalPassed ? 'The final run passed.' : 'The final run did not pass.',
          weakened ? 'Weakened an existing test to get a green run, which undermines the suite.' : '',
        ]
          .filter(Boolean)
          .join(' ')

  const judgmentRaw =
    3 +
    (state === 'fixed' ? 3 : 0) +
    (changedNonTest.length === 1 && targetLines <= 8 ? 1 : 0) -
    (acceptedWrong ? 3 : 0) -
    (keptWrong ? 1 : 0)
  const judgmentScore = clamp(weakened || acceptedTests ? Math.min(judgmentRaw, 2) : judgmentRaw)
  const judgmentReason =
    weakened || acceptedTests
      ? 'Changed an existing test to make the suite pass instead of fixing the code. That hides a real defect and is a serious engineering judgment failure.'
      : [
          state === 'fixed' ? 'Shipped a correct fix' : state === 'wrong' ? 'Shipped a fix that still breaks behaviour' : 'Shipped no working fix',
          changedNonTest.length === 1 && targetLines <= 8 ? 'with a small, focused diff.' : 'with a larger diff than the problem needed.',
          acceptedWrong ? 'Applied an AI fix without checking its side effects first.' : '',
          revertedWrong ? 'Backed it out once the tests exposed the problem.' : '',
          keptWrong ? 'Kept an AI change that introduces a side effect.' : '',
        ]
          .filter(Boolean)
          .join(' ')

  const debuggingScore = clamp(
    2 + (viewedTarget ? 1 : 0) + (reproduced ? 2 : 0) + (iterated ? 2 : 0) + (state === 'fixed' ? 3 : 0),
  )
  const debuggingReason = [
    preChangeTest
      ? reproduced
        ? 'Reproduced the bug with the test suite before changing code.'
        : 'Ran the test suite before changing code.'
      : 'Did not run tests before changing code.',
    iterated ? 'Used test feedback to change approach and tried again.' : 'Did not iterate on test feedback.',
    state === 'fixed' ? 'Ended with all tests passing.' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const scopeScore = clamp(
    changes.files.length === 0
      ? 3
      : 10 - (testsTouched ? 4 : 0) - 2 * Math.max(0, changedNonTest.length - 1) - (targetLines > 15 ? 2 : 0),
  )
  const scopeReason =
    changes.files.length === 0
      ? 'No files were changed.'
      : testsTouched
        ? `Modified the test suite (${changes.files.map((f) => f.path).join(', ')}) in addition to the code under test.`
        : `Only ${changedNonTest.map((f) => f.path).join(', ')} changed (+${changes.added} −${changes.removed}). No unrelated edits.`

  let aiScore: number
  let aiReason: string
  if (requests.length === 0) {
    aiScore = 7
    aiReason = 'Did not use the AI assistant, so there is no AI judgment to assess.'
  } else {
    const raw =
      4 +
      (askedBeforeChange ? 1 : 0) -
      (acceptedWrong ? 3 : 0) +
      (verifiedAIChange && accepted.length > 0 ? 1 : 0) +
      (revertedWrong ? 1 : 0) +
      (rejectedTests ? 1 : 0) -
      (keptWrong ? 2 : 0) +
      (accepted.length === 0 && state === 'fixed' ? 2 : 0)
    aiScore = clamp(acceptedTests ? Math.min(raw, 2) : raw)
    aiReason = acceptedTests
      ? 'Accepted an AI suggestion that weakened an existing test to get a green run. This is the opposite of verifying AI output.'
      : [
          `Sent ${requests.length} ${requests.length === 1 ? 'prompt' : 'prompts'} to the AI.`,
          acceptedWrong ? 'Applied an AI fix that had a side effect.' : accepted.length > 0 ? 'Applied an AI suggestion.' : 'Applied no AI code.',
          verifiedAIChange && accepted.length > 0 ? 'Ran the tests to check it.' : accepted.length > 0 ? 'Did not run tests on it.' : '',
          revertedWrong ? 'Reverted the flawed change after the tests exposed it.' : '',
          rejectedTests ? 'Rejected a suggestion that would have weakened the tests.' : '',
          keptWrong ? 'Kept the flawed change.' : '',
        ]
          .filter(Boolean)
          .join(' ')
  }

  const criteria: CriterionScore[] = [
    {
      name: 'Root-Cause Understanding',
      score: rootCauseScore,
      maxScore: MAX_CRITERION_SCORE,
      reason: rootCauseReason,
      evidenceIds: ids([openedTarget, preChangeTest, firstRequest, state === 'fixed' ? lastPassed : acceptedWrong]),
    },
    {
      name: 'Testing Strategy',
      score: testingScore,
      maxScore: MAX_CRITERION_SCORE,
      reason: testingReason,
      evidenceIds: ids([testRuns[0], firstFailed, laterThan(firstAccepted, testResults), verifiedAfterChange, lastPassed, acceptedTests]),
    },
    {
      name: 'Engineering Judgment',
      score: judgmentScore,
      maxScore: MAX_CRITERION_SCORE,
      reason: judgmentReason,
      evidenceIds: ids([acceptedTests, acceptedWrong, revertedWrong, lastChange, lastPassed]),
    },
    {
      name: 'Debugging',
      score: debuggingScore,
      maxScore: MAX_CRITERION_SCORE,
      reason: debuggingReason,
      evidenceIds: ids([preChangeTest, firstFailed, failedAfterAccept, laterThan(firstFailed, changeEvents), lastPassed]),
    },
    {
      name: 'Scope Discipline',
      score: scopeScore,
      maxScore: MAX_CRITERION_SCORE,
      reason: scopeReason,
      evidenceIds: ids([acceptedTests, ...changeEvents.slice(-2), of('SUBMISSION_CREATED')[0]]),
    },
    {
      name: 'AI Judgment',
      score: aiScore,
      maxScore: MAX_CRITERION_SCORE,
      reason: aiReason,
      evidenceIds: ids([firstAccepted, failedAfterAccept, rejected[0], reverted[0], lastPassed, acceptedTests]),
    },
  ]

  // ---- AI usage ----
  const aiUsage: AIUsage = {
    pattern: requests.length === 0 ? 'independent' : acceptedTests || keptWrong ? 'dependence' : 'augmentation',
    summary:
      requests.length === 0
        ? 'The candidate solved the task without the AI assistant.'
        : acceptedTests
          ? 'The candidate let the AI weaken a test to get a green run and did not question it. That is dependence, not collaboration.'
          : keptWrong
            ? 'The candidate applied the AI fix and kept it without noticing the side effect it introduces.'
            : accepted.length === 0
              ? 'The candidate used the AI for explanations and wrote the change themselves.'
              : 'The candidate treated the AI as a collaborator: they tried its suggestion, verified it with tests, reverted it when it broke an existing test, and refused a suggestion that would have weakened the suite.',
    evidenceIds: criteria[5].evidenceIds,
  }

  // ---- reference comparison ----
  const sonar = getSonarRows(state, weakened)
  const row = (metric: string) => sonar.find((r) => r.metric === metric)!
  const referenceComparison: ReferenceComparison = {
    rootCause: state === 'fixed' ? 'Match' : state === 'wrong' ? 'Different' : 'Worse',
    behavior: state === 'fixed' ? 'Match' : 'Worse',
    implementation:
      state !== 'fixed'
        ? 'Worse'
        : normalize(useWorkspaceStore.getState().files.find((f) => f.path === target)?.content ?? '') === normalize(REFERENCE_FIX)
          ? 'Match'
          : 'Different',
    complexity: compare(row('Complexity').candidate, row('Complexity').reference, true),
    coverage: compare(row('Coverage').candidate, row('Coverage').reference, false),
  }

  // ---- dimensions and overall ----
  const bugs = row('Bugs').candidate
  const vulns = row('Vulnerabilities').candidate
  const smellsOver = Math.max(0, row('Code Smells').candidate - row('Code Smells').reference)
  const complexityOver = Math.max(0, row('Complexity').candidate - row('Complexity').reference)
  const codeQuality = clamp(100 - 20 * bugs - 10 * vulns - 5 * smellsOver - 3 * complexityOver - (weakened ? 15 : 0), 0, 100)

  const score = (name: string) => criteria.find((c) => c.name === name)!.score
  // Recovering from a flawed AI change is better than keeping it, but it still cost the candidate time and trust.
  const recoveryPenalty = revertedWrong ? RECOVERY_PENALTY : 0
  const process = clamp(
    ((score('Root-Cause Understanding') + score('Testing Strategy') + score('Engineering Judgment') + score('Debugging') + score('Scope Discipline')) / 5) * 10 -
      recoveryPenalty,
    0,
    100,
  )
  const referenceAlignment =
    (Object.values(referenceComparison) as ComparisonVerdict[]).reduce((sum, v) => sum + VERDICT_SCORE[v], 0) / Object.keys(referenceComparison).length

  const scores = [
    100 * (0.4 * ratio(correctness.visible) + 0.4 * ratio(correctness.hidden) + 0.2 * ratio(correctness.regression)),
    codeQuality,
    process,
    aiScore * 10,
    referenceAlignment,
  ]
  const dimensions = DIMENSIONS.map((d, i) => ({ name: d.name, weight: d.weight, score: Math.round(scores[i]) }))
  const overallScore = Math.round(dimensions.reduce((sum, d) => sum + (d.weight * d.score) / 100, 0))

  // ---- summary ----
  const outcome =
    state === 'fixed'
      ? `Fixed the _ne bug: the final code matches the reference behaviour and ${correctness.visible.passed}/${correctness.visible.total} visible tests pass.`
      : state === 'wrong'
        ? `Submitted a change that makes author_ne filter, but it fails hidden checks (${correctness.hidden.passed}/${correctness.hidden.total}) because it mutates the query and mishandles numeric values.`
        : 'The _ne bug is still present in the submitted code.'
  const story = acceptedTests
    ? 'The candidate accepted an AI suggestion that weakened an existing test to get a green run, which hides a real defect.'
    : acceptedWrong && revertedWrong
      ? `They first applied a flawed AI suggestion, ran the tests, reverted it${rejectedTests ? ', rejected a second suggestion that would have weakened the tests' : ''}${state === 'fixed' ? ' and wrote the correct fix themselves' : ''}.`
      : keptWrong
        ? 'They applied the AI fix and kept it without checking its side effects.'
        : requests.length === 0
          ? 'They did not use the AI assistant.'
          : accepted.length === 0
            ? 'They used the AI assistant for explanations only.'
            : 'They applied an AI suggestion and verified it with the tests.'

  await Promise.resolve()

  return {
    overallScore,
    verdict: verdictFor(overallScore),
    summary: `${outcome} ${story}`,
    dimensions,
    correctness,
    criteria,
    referenceComparison,
    aiUsage,
    source: 'rules',
  }
}

/**
 * Evaluates the session: Gemini interprets the evidence when available, otherwise (missing key, network
 * error, bad response) the rules result is returned. Deterministic facts always come from the rules.
 */
export async function evaluate(): Promise<Evaluation> {
  const rules = await evaluateWithRules()
  try {
    return (await evaluateWithLLM(rules)) ?? rules
  } catch (error) {
    console.warn('[gemini] evaluation failed, using the rules engine:', error)
    return rules
  }
}
