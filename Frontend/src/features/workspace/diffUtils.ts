export interface LineDiff {
  added: number
  removed: number
}

/** Approximate +/- line counts between two texts (order-insensitive multiset diff). */
export function lineDiff(before: string, after: string): LineDiff {
  const counts = new Map<string, number>()
  for (const line of before.split('\n')) counts.set(line, (counts.get(line) ?? 0) + 1)

  let added = 0
  for (const line of after.split('\n')) {
    const remaining = counts.get(line) ?? 0
    if (remaining > 0) counts.set(line, remaining - 1)
    else added++
  }

  let removed = 0
  for (const remaining of counts.values()) removed += remaining

  return { added, removed }
}

export function formatDiff({ added, removed }: LineDiff): string {
  return `+${added}/−${removed} lines`
}
