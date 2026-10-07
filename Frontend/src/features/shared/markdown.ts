// Tiny markdown parser: headings, paragraphs, fenced code, ordered/unordered lists
// (with fenced code nested inside list items). Inline parsing is done at render time.

export interface ListItem {
  number?: number
  text: string
  children: Block[]
}

export type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'list'; ordered: boolean; items: ListItem[] }

const FENCE = /^(\s*)```(\S*)\s*$/
const HEADING = /^(#{1,6})\s+(.*)$/
const LIST_ITEM = /^\s*(?:(\d+)\.|[-*])\s+(.*)$/

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let previousBlank = true

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const last = blocks[blocks.length - 1]

    const fence = FENCE.exec(line)
    if (fence) {
      const indent = fence[1].length
      const body: string[] = []
      i++
      while (i < lines.length && !FENCE.test(lines[i])) {
        body.push(lines[i].slice(Math.min(indent, lines[i].length - lines[i].trimStart().length)))
        i++
      }
      const code: Block = { type: 'code', lang: fence[2], code: body.join('\n') }

      if (indent > 0 && last?.type === 'list') {
        last.items[last.items.length - 1].children.push(code)
      } else {
        blocks.push(code)
      }
      previousBlank = false
      continue
    }

    if (line.trim() === '') {
      previousBlank = true
      continue
    }

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      previousBlank = false
      continue
    }

    const item = LIST_ITEM.exec(line)
    if (item) {
      const ordered = item[1] !== undefined
      const entry: ListItem = {
        number: ordered ? Number(item[1]) : undefined,
        text: item[2],
        children: [],
      }
      if (last?.type === 'list' && last.ordered === ordered) last.items.push(entry)
      else blocks.push({ type: 'list', ordered, items: [entry] })
      previousBlank = false
      continue
    }

    // Continuation line of a list item (indented) or of the previous paragraph.
    if (!previousBlank && last?.type === 'paragraph') {
      last.text += ` ${line.trim()}`
    } else if (last?.type === 'list' && /^\s+/.test(line)) {
      const item = last.items[last.items.length - 1]
      if (!previousBlank && item.children.length === 0) item.text += ` ${line.trim()}`
      else item.children.push({ type: 'paragraph', text: line.trim() })
    } else {
      blocks.push({ type: 'paragraph', text: line.trim() })
    }
    previousBlank = false
  }

  return blocks
}
