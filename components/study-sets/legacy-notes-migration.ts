import type { JSONContent } from '@tiptap/core'
import { markdownToPlainText, normalizeComparablePlainText } from './notes-content'

const SUPPORTED_NODE_TYPES = new Set([
  'doc',
  'paragraph',
  'text',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'hardBreak',
])

function findUnsupportedNode(node: JSONContent): string | null {
  if (node.type && !SUPPORTED_NODE_TYPES.has(node.type)) {
    return node.type
  }

  for (const child of node.content ?? []) {
    const unsupported = findUnsupportedNode(child)
    if (unsupported) return unsupported
  }

  return null
}

function getLegacyPlainText(node: JSONContent): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'

  const text = (node.content ?? []).map(getLegacyPlainText).join('')
  if (
    node.type === 'paragraph' ||
    node.type === 'heading' ||
    node.type === 'listItem' ||
    node.type === 'blockquote' ||
    node.type === 'codeBlock'
  ) {
    return `${text}\n`
  }

  return text
}

export type LegacyNotesMigrationResult = {
  markdown: string
  plainText: string
}

export async function convertLegacyTipTapToMarkdown(
  richTextContent: Record<string, unknown>,
): Promise<LegacyNotesMigrationResult> {
  const json = richTextContent as JSONContent
  const unsupportedNode = findUnsupportedNode(json)

  if (unsupportedNode) {
    throw new Error(`Unsupported legacy note node: ${unsupportedNode}`)
  }

  const [{ Editor }, starterKitModule, highlightModule, markdownModule] =
    await Promise.all([
      import('@tiptap/core'),
      import('@tiptap/starter-kit'),
      import('@tiptap/extension-highlight'),
      import('@tiptap/markdown'),
    ])

  const StarterKit = starterKitModule.default
  const Highlight = highlightModule.default
  const { Markdown } = markdownModule
  const editor = new Editor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5] } }),
      Highlight,
      Markdown,
    ],
    content: json,
  })

  try {
    const markdown = editor
      .getMarkdown()
      // Canonical notes deliberately do not process raw HTML. Keep the text,
      // while dropping the presentation-only underline left by the old editor.
      .replace(/<\/?u>/gi, '')
      .trim()

    if (/<\/?[A-Za-z][^>]*>/.test(markdown)) {
      throw new Error('Legacy note contains HTML that cannot be migrated safely.')
    }

    const sourcePlainText = normalizeComparablePlainText(getLegacyPlainText(json))
    const migratedPlainText = markdownToPlainText(markdown)

    if (
      sourcePlainText &&
      normalizeComparablePlainText(migratedPlainText) !== sourcePlainText
    ) {
      throw new Error('Legacy note migration did not preserve all visible text.')
    }

    return {
      markdown,
      plainText: migratedPlainText,
    }
  } finally {
    editor.destroy()
  }
}

