/** Colour for a 0-100 score. */
export function scoreColor(score: number): string {
  if (score >= 85) return 'var(--color-pass)'
  if (score >= 70) return '#4aa3ff'
  if (score >= 55) return 'var(--color-warn)'
  return 'var(--color-fail)'
}
