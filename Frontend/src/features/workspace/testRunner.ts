import { challenge, FIX_MARKER, WRONG_MARKER } from '../../mock/challenge'
import { logEvent } from '../../store/eventStore'
import { useTerminalStore } from '../../store/terminalStore'
import { useTestStore, type TestState } from '../../store/testStore'
import { originalContent, useWorkspaceStore } from '../../store/workspaceStore'

interface TestCase {
  name: string
  ms: number
  failed?: boolean
}

interface Scenario {
  tests: TestCase[]
  durationMs: number
  /** Lines printed under "failing tests:" (empty when everything passes). */
  failureReport: string[]
}

// Names, outcomes, durations and assertion output measured by running the
// real mock repo (src/mock/repo) against each version of src/utils/query.js.
const names = [
  'filters by exact string match',
  'filters by exact numeric match (query values are strings)',
  'supports _gte',
  'supports _lte',
  'supports _like (case-insensitive)',
  'ignores params that are not fields',
  'does not mutate the query object',
  'supports _ne (excludes matching items)',
  'sorts descending with _sort and _order',
  'paginates with _page and _limit',
]

const durations = {
  buggy: [4.6752, 0.3326, 0.2787, 0.2407, 0.3799, 0.2658, 0.5401, 3.3748, 0.4203, 0.5946],
  wrong: [7.1052, 0.4326, 0.2933, 0.2709, 0.4377, 0.3264, 2.9883, 0.3646, 0.4407, 0.6153],
  fixed: [4.6496, 0.3294, 0.6105, 0.5882, 0.7015, 0.4022, 0.4914, 0.2791, 0.5166, 0.7034],
}

const MUTATION_TEST = names[6]
const RELAXED_TEST = 'accepts a query object with operators'

const buildTests = (state: TestState, failedName?: string, weakened = false): TestCase[] =>
  names.map((name, i) => ({
    name: weakened && name === MUTATION_TEST ? RELAXED_TEST : name,
    ms: durations[state][i],
    failed: name === failedName,
  }))

const TESTS_FILE = 'tests/query.test.js'

const SCENARIOS: Record<TestState, Scenario> = {
  buggy: {
    tests: buildTests('buggy', names[7]),
    durationMs: 205.8422,
    failureReport: [
      'test at tests\\query.test.js:44:1',
      `✖ ${names[7]} (3.3748ms)`,
      '  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:',
      '  + actual - expected',
      '',
      '    [',
      '  +   1,',
      '      2,',
      '  +   3,',
      '      4',
      '    ]',
      '',
      '      at TestContext.<anonymous> (tests/query.test.js:45:10)',
      '',
      "    actual: [ 1, 2, 3, 4 ],",
      '    expected: [ 2, 4 ],',
      "    operator: 'deepStrictEqual'",
    ],
  },
  wrong: {
    tests: buildTests('wrong', names[6]),
    durationMs: 198.3132,
    failureReport: [
      'test at tests\\query.test.js:38:1',
      `✖ ${names[6]} (2.9883ms)`,
      '  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:',
      '  + actual - expected',
      '',
      '    {',
      "  -   author_ne: 'bob',",
      "      title_like: 'a',",
      "      views_gte: '10'",
      '    }',
      '',
      '      at TestContext.<anonymous> (tests/query.test.js:41:10)',
      '',
      "    actual: { views_gte: '10', title_like: 'a' },",
      "    expected: { author_ne: 'bob', views_gte: '10', title_like: 'a' },",
      "    operator: 'deepStrictEqual'",
    ],
  },
  fixed: {
    tests: buildTests('fixed'),
    durationMs: 195.8744,
    failureReport: [],
  },
}

/** True when the candidate has replaced the "does not mutate the query object" test with a weaker one. */
export function isTestsWeakened(): boolean {
  const content = useWorkspaceStore.getState().files.find((f) => f.path === TESTS_FILE)?.content ?? ''
  return content !== originalContent[TESTS_FILE] && !content.includes(MUTATION_TEST)
}

/** The wrong fix only fails the mutation test, so weakening that test makes the suite pass. */
function resolveScenario(state: TestState, weakened: boolean): Scenario {
  if (!weakened) return SCENARIOS[state]
  if (state === 'wrong') {
    return { tests: buildTests('wrong', undefined, true), durationMs: 196.4021, failureReport: [] }
  }
  return {
    ...SCENARIOS[state],
    tests: buildTests(state, state === 'buggy' ? names[7] : undefined, true),
  }
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** Decides which version of the target file the candidate currently has. */
export function detectTestState(): TestState {
  const { files } = useWorkspaceStore.getState()
  const content = files.find((file) => file.path === challenge.targetFile)?.content ?? ''

  if (content.includes(WRONG_MARKER)) return 'wrong'
  if (content.includes(FIX_MARKER)) return 'fixed'
  return 'buggy'
}

/** Streams a node --test style run into the terminal and records the result. */
export async function runTests(): Promise<void> {
  const { append } = useTerminalStore.getState()
  const state = detectTestState()
  const scenario = resolveScenario(state, isTestsWeakened())

  logEvent('TEST_RUN', 'Started test run (npm test)', { state })

  append('dim', '> mini-json-server@0.4.2 test')
  append('dim', '> node --test')
  append('out', '')
  await sleep(350)

  for (const test of scenario.tests) {
    await sleep(110 + Math.random() * 90)
    const duration = `(${test.ms.toFixed(4)}ms)`
    append(test.failed ? 'fail' : 'pass', `${test.failed ? '✖' : '✔'} ${test.name} ${duration}`)
  }

  const failedTests = scenario.tests.filter((test) => test.failed)
  const passed = scenario.tests.length - failedTests.length

  await sleep(200)
  const summary = [
    `tests ${scenario.tests.length}`,
    'suites 0',
    `pass ${passed}`,
    `fail ${failedTests.length}`,
    'cancelled 0',
    'skipped 0',
    'todo 0',
    `duration_ms ${scenario.durationMs}`,
  ]
  summary.forEach((line) => append('info', `ℹ ${line}`))

  if (failedTests.length > 0) {
    append('out', '')
    append('fail', '✖ failing tests:')
    append('out', '')
    for (const line of scenario.failureReport) {
      append(line.startsWith('✖') ? 'fail' : 'out', line)
    }
  }

  useTestStore.getState().recordRun({
    passed,
    failed: failedTests.length,
    total: scenario.tests.length,
    state,
  })

  if (failedTests.length === 0) {
    logEvent('TEST_PASSED', `Tests: ${passed} passed, 0 failed`, { state, passed, failed: 0 })
  } else {
    const failedNames = failedTests.map((test) => test.name.replace(/ \(.*\)$/, '')).join(', ')
    logEvent('TEST_FAILED', `Tests: ${passed} passed, ${failedTests.length} failed (${failedNames})`, {
      state,
      passed,
      failed: failedTests.length,
      failedTests: failedTests.map((test) => test.name),
    })
  }
}
