import type { BlogHeading, BlogImage, PortableTextBlock } from '@/lib/blog/types'

const wordsPerMinute = 220

export function estimateReadingTime(input: { excerpt?: string | null; body?: PortableTextBlock[] | null }) {
  const text = [input.excerpt ?? '', plainTextFromBlocks(input.body ?? [])].join(' ').trim()
  const wordCount = text ? text.split(/\s+/).length : 0
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

export function plainTextFromBlocks(blocks: PortableTextBlock[]) {
  return blocks
    .map((block) => {
      if (block._type !== 'block' || !Array.isArray(block.children)) return ''
      return block.children.map((child) => child.text ?? '').join('')
    })
    .filter(Boolean)
    .join('\n')
}

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function extractHeadings(blocks: PortableTextBlock[]): BlogHeading[] {
  return blocks
    .map((block) => {
      if (block._type !== 'block') return null
      if (block.style !== 'h2' && block.style !== 'h3') return null

      const text = block.children?.map((child) => child.text ?? '').join('').trim() ?? ''
      if (!text) return null

      return {
        id: slugifyHeading(text),
        text,
        level: block.style === 'h3' ? 3 : 2,
      } satisfies BlogHeading
    })
    .filter((item): item is BlogHeading => Boolean(item))
}

export function pickImage(
  value: Partial<BlogImage> | null | undefined,
  fallback: BlogImage,
): BlogImage {
  return {
    url: value?.url?.trim() || fallback.url,
    alt: value?.alt?.trim() || fallback.alt,
  }
}
