import type {
  ComparisonRow,
  CorrectnessResults,
  CriterionScore,
  SonarRow,
} from '../types'

export const correctness: CorrectnessResults = {
  visible: { passed: 18, total: 18 },
  hidden: { passed: 9, total: 10 },
  regression: { passed: 4, total: 4 },
}

export const sonarRows: SonarRow[] = [
  { metric: 'Bugs', base: 1, reference: 0, candidate: 0, lowerIsBetter: true },
  { metric: 'Vulnerabilities', base: 0, reference: 0, candidate: 0, lowerIsBetter: true },
  { metric: 'Code Smells', base: 3, reference: 3, candidate: 2, lowerIsBetter: true },
  { metric: 'Complexity', base: 14, reference: 15, candidate: 14, lowerIsBetter: true },
  { metric: 'Coverage', base: 71, reference: 74, candidate: 78, unit: '%', lowerIsBetter: false },
  { metric: 'Duplication', base: 2.1, reference: 2.1, candidate: 1.8, unit: '%', lowerIsBetter: true },
]

export const referenceComparison: ComparisonRow[] = [
  {
    aspect: 'Root cause',
    verdict: 'Match',
    note: 'Identified that _ne was missing from the recognised operator list.',
  },
  {
    aspect: 'Behavior',
    verdict: 'Match',
    note: 'GET /posts?author_ne=typicode now excludes typicode posts; other operators unchanged.',
  },
  {
    aspect: 'Implementation',
    verdict: 'Different',
    note: 'Added a dedicated helper instead of a new switch case. Valid, but a larger diff than the reference.',
  },
  {
    aspect: 'Complexity',
    verdict: 'Better',
    note: 'Cyclomatic complexity stayed at 14 versus 15 for the reference.',
  },
]

export const criteria: CriterionScore[] = [
  {
    name: 'Root-Cause Understanding',
    score: 18,
    maxScore: 20,
    reason:
      'Traced the symptom to parseKey() and noticed _ne was missing from OPERATORS before changing any code.',
    evidenceIds: ['E02', 'E04', 'E05'],
  },
  {
    name: 'Testing Strategy',
    score: 11,
    maxScore: 15,
    reason:
      'Ran the suite before and after the fix, but did not add a numeric _ne case, which the hidden tests cover.',
    evidenceIds: ['E06', 'E07', 'E12'],
  },
  {
    name: 'Engineering Judgment',
    score: 12,
    maxScore: 15,
    reason:
      'Chose a sound approach but refactored a helper that the issue did not require.',
    evidenceIds: ['E09', 'E10'],
  },
  {
    name: 'Debugging',
    score: 17,
    maxScore: 20,
    reason:
      'Reproduced the failure with the failing test, narrowed it to one file and verified the fix with a re-run.',
    evidenceIds: ['E03', 'E06', 'E11'],
  },
  {
    name: 'Scope Discipline',
    score: 14,
    maxScore: 15,
    reason:
      'Only src/utils/query.js was modified. No unrelated files were touched.',
    evidenceIds: ['E10', 'E13'],
  },
  {
    name: 'AI Judgment',
    score: 10,
    maxScore: 15,
    reason:
      'Rejected the first AI suggestion after reading it, but accepted the second without running the tests against it first.',
    evidenceIds: ['E08', 'E09', 'E10'],
  },
]

export const overallScore = criteria.reduce((sum, c) => sum + c.score, 0)
export const overallMaxScore = criteria.reduce((sum, c) => sum + c.maxScore, 0)
