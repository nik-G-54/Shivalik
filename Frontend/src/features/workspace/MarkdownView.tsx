import type { ReactNode } from 'react'
import { parseMarkdown, type Block } from './markdown'

interface MarkdownViewProps {
  source: string
}

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

const HEADING_CLASS: Record<number, string> = {
  1: 'mb-2 mt-4 border-b border-line pb-1 text-xl font-semibold text-white',
  2: 'mb-2 mt-4 border-b border-line pb-1 text-lg font-semibold text-white',
  3: 'mb-1.5 mt-3 text-base font-semibold text-white',
}

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.type) {
    case 'heading':
      return (
        <h3 key={key} className={HEADING_CLASS[block.level] ?? HEADING_CLASS[3]}>
          {renderInline(block.text)}
        </h3>
      )
    case 'paragraph':
      return (
        <p key={key} className="my-2 leading-relaxed">
          {renderInline(block.text)}
        </p>
      )
    case 'code':
      return (
        <pre
          key={key}
          className="my-2 overflow-x-auto rounded-md border border-line bg-sidebar p-3 text-[12.5px] leading-relaxed"
        >
          <code>{block.code}</code>
        </pre>
      )
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag
          key={key}
          className={`my-2 space-y-1 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'}`}
          start={block.ordered ? block.items[0].number : undefined}
        >
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed marker:text-fg-muted">
              {renderInline(item.text)}
              {item.children.map(renderBlock)}
            </li>
          ))}
        </ListTag>
      )
    }
  }
}

export default function MarkdownView({ source }: MarkdownViewProps) {
  return <div className="text-[13.5px]">{parseMarkdown(source).map(renderBlock)}</div>
}
