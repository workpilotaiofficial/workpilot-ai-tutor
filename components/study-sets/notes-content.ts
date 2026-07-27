import { unified } from 'unified'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'

type MarkdownNode = {
  type?: string
  value?: string
  alt?: string
  children?: MarkdownNode[]
}

const BLOCK_NODE_TYPES = new Set([
  'root',
  'paragraph',
  'heading',
  'blockquote',
  'list',
  'listItem',
  'table',
  'tableRow',
  'code',
  'thematicBreak',
])

function collectText(node: MarkdownNode): string {
  if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') {
    return node.value ?? ''
  }

  if (node.type === 'image') {
    return node.alt ?? ''
  }

  if (node.type === 'break') {
    return '\n'
  }

  const childText = (node.children ?? []).map(collectText).join(
    node.type === 'tableRow' ? '\t' : '',
  )

  return BLOCK_NODE_TYPES.has(node.type ?? '') ? `${childText}\n` : childText
}

export function markdownToPlainText(markdown: string) {
  if (!markdown.trim()) return ''

  try {
    const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownNode
    return collectText(tree)
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  } catch {
    return markdown
      .replace(/```[\s\S]*?```/g, (block) =>
        block.replace(/^```[^\n]*\n?/, '').replace(/```$/, ''),
      )
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^[#>*+-]+\s*/gm, '')
      .replace(/[*_~=`]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
}

export function normalizeComparablePlainText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function isAllowedNotesUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true

  try {
    const parsed = new URL(trimmed)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

