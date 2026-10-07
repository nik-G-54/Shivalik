import type { SonarRow } from '../types'
import type { TestState } from '../store/testStore'

/** Evaluation dimensions and their weights (sum to 100). Shown on the dashboard and used by the evaluator. */
export const DIMENSIONS = [
  { name: 'Correctness', weight: 35, blurb: 'Visible, hidden and regression tests' },
  { name: 'Code Quality', weight: 25, blurb: 'Static analysis versus the reference' },
  { name: 'Engineering Process', weight: 20, blurb: 'How you investigated, tested and scoped' },
  { name: 'AI Judgment', weight: 10, blurb: 'How you used and checked the AI assistant' },
  { name: 'Reference Alignment', weight: 10, blurb: 'Behaviour compared with the reference fix' },
] as const

type SonarMetric = SonarRow['metric']

interface SonarValues {
  bugs: number
  vulnerabilities: number
  smells: number
  complexity: number
  coverage: number
  duplication: number
}

const BASE: SonarValues = { bugs: 1, vulnerabilities: 0, smells: 3, complexity: 14, coverage: 71, duplication: 2.1 }
const REFERENCE: SonarValues = { bugs: 0, vulnerabilities: 0, smells: 3, complexity: 15, coverage: 74, duplication: 2.1 }

/** Static-analysis numbers for the candidate's final code, by which version of query.js they ended with. */
const CANDIDATE: Record<TestState, SonarValues> = {
  fixed: { ...REFERENCE },
  wrong: { bugs: 1, vulnerabilities: 0, smells: 4, complexity: 17, coverage: 71, duplication: 2.1 },
  buggy: { ...BASE },
}

const ROWS: { metric: SonarMetric; key: keyof SonarValues; unit?: string; lowerIsBetter: boolean }[] = [
  { metric: 'Bugs', key: 'bugs', lowerIsBetter: true },
  { metric: 'Vulnerabilities', key: 'vulnerabilities', lowerIsBetter: true },
  { metric: 'Code Smells', key: 'smells', lowerIsBetter: true },
  { metric: 'Complexity', key: 'complexity', lowerIsBetter: true },
  { metric: 'Coverage', key: 'coverage', unit: '%', lowerIsBetter: false },
  { metric: 'Duplication', key: 'duplication', unit: '%', lowerIsBetter: true },
]

/** SonarQube-style rows. Weakening the tests lowers the candidate's coverage. */
export function getSonarRows(state: TestState, testsWeakened: boolean): SonarRow[] {
  const candidate = { ...CANDIDATE[state] }
  if (testsWeakened) candidate.coverage -= 4

  return ROWS.map(({ metric, key, unit, lowerIsBetter }) => ({
    metric,
    base: BASE[key],
    reference: REFERENCE[key],
    candidate: candidate[key],
    unit,
    lowerIsBetter,
  }))
}
