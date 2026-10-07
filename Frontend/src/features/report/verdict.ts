import type { Verdict } from '../../types'

export const VERDICTS: Verdict[] = ['Strong Hire', 'Hire', 'Lean Hire', 'No Hire']

export function verdictFor(score: number): Verdict {
  if (score >= 90) return 'Strong Hire'
  if (score >= 75) return 'Hire'
  if (score >= 60) return 'Lean Hire'
  return 'No Hire'
}
