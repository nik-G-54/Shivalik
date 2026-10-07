export type DiffLine =
  | { type: 'same' | 'add' | 'del'; text: string }
  | { type: 'skip'; count: number }

const toLines = (text: string) => text.replace(/\n$/, '').split('\n')

/** Line diff via longest common subsequence. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = toLines(before)
  const b = toLines(after)

  // Common prefix/suffix are cheap to peel off and keep the LCS table small.
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }

  const midA = a.slice(start, endA)
  const midB = b.slice(start, endB)
  const n = midA.length
  const m = midB.length

  const lcs = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] =
        midA[i] === midB[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const result: DiffLine[] = a.slice(0, start).map((text) => ({ type: 'same', text }))
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (midA[i] === midB[j]) {
      result.push({ type: 'same', text: midA[i] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      result.push({ type: 'del', text: midA[i++] })
    } else {
      result.push({ type: 'add', text: midB[j++] })
    }
  }
  while (i < n) result.push({ type: 'del', text: midA[i++] })
  while (j < m) result.push({ type: 'add', text: midB[j++] })

  for (const text of a.slice(endA)) result.push({ type: 'same', text })
  return result
}

export function countChanges(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const line of lines) {
    if (line.type === 'add') added++
    else if (line.type === 'del') removed++
  }
  return { added, removed }
}

/** Keeps changed lines plus `context` lines around them; collapses the rest into skip markers. */
export function collapseDiff(lines: DiffLine[], context = 1): DiffLine[] {
  const keep = new Array<boolean>(lines.length).fill(false)
  lines.forEach((line, i) => {
    if (line.type === 'add' || line.type === 'del') {
      for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++) {
        keep[k] = true
      }
    }
  })

  const result: DiffLine[] = []
  let skipped = 0
  lines.forEach((line, i) => {
    if (keep[i]) {
      if (skipped > 0) result.push({ type: 'skip', count: skipped })
      skipped = 0
      result.push(line)
    } else {
      skipped++
    }
  })
  if (skipped > 0) result.push({ type: 'skip', count: skipped })
  return result
}
