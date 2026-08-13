import Image from 'next/image'
import { PortableText, toPlainText, type PortableTextComponents } from '@portabletext/react'
import type { ReactNode } from 'react'
import type { PortableTextBlock as BlogPortableTextBlock } from '@/lib/blog/types'
import { slugifyHeading } from '@/lib/blog/utils'

type LinkValue = {
  href?: string
  blank?: boolean
}

type ImageValue = {
  asset?: { url?: string }
  alt?: string
  caption?: string
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children, value }) => <h2 id={slugifyHeading(toPlainText(value))}>{children}</h2>,
    h3: ({ children, value }) => <h3 id={slugifyHeading(toPlainText(value))}>{children}</h3>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    link: ({ children, value }) => {
      const { href = '#', blank = false } = (value ?? {}) as LinkValue
      const external = href.startsWith('http')
      return (
        <a href={href} target={blank ? '_blank' : undefined} rel={blank || external ? 'noreferrer noopener' : undefined}>
          {children}
        </a>
      )
    },
    code: ({ children }) => <code>{children}</code>,
  },
  types: {
    image: ({ value }) => {
      const image = value as ImageValue
      if (!image.asset?.url) return null

      return (
        <figure>
          <div className='relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100'>
            <Image src={image.asset.url} alt={image.alt || 'Article illustration'} fill sizes='(max-width: 900px) 100vw, 760px' className='object-cover' />
          </div>
          {image.caption ? <figcaption>{image.caption}</figcaption> : null}
        </figure>
      )
    },
  },
}

export function PortableContent({ body }: { body: BlogPortableTextBlock[] }) {
  return (
    <div className='blog-prose'>
      <PortableText value={body as unknown as Parameters<typeof PortableText>[0]['value']} components={components} />
    </div>
  )
}

export function ArticleShareLinks({ url, title }: { url: string; title: string }) {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const links: Array<{ label: string; href: string; mark: ReactNode }> = [
    { label: 'Share on X', href: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`, mark: 'X' },
    { label: 'Share on LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, mark: 'in' },
    { label: 'Share by email', href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`, mark: '@' },
  ]

  return (
    <div className='flex items-center gap-2' aria-label='Share this article'>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={link.href.startsWith('http') ? '_blank' : undefined}
          rel={link.href.startsWith('http') ? 'noreferrer noopener' : undefined}
          aria-label={link.label}
          className='flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-[#ff7438] hover:text-[#d95722]'
        >
          {link.mark}
        </a>
      ))}
    </div>
  )
}
