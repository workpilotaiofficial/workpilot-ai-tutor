export type PortableTextSpan = {
  _key?: string
  _type?: string
  text?: string
  marks?: string[]
}

export type PortableTextMarkDefinition = {
  _key?: string
  _type?: string
  href?: string
  blank?: boolean
}

export type PortableTextBlock = {
  _key?: string
  _type: string
  style?: string
  listItem?: string
  level?: number
  children?: PortableTextSpan[]
  markDefs?: PortableTextMarkDefinition[]
  asset?: {
    url?: string
  }
  alt?: string
  caption?: string
}

export type BlogImage = {
  url: string
  alt: string
}

export type BlogSEO = {
  title: string
  description: string
  canonicalUrl?: string | null
  ogImage?: BlogImage | null
  noIndex: boolean
  noFollow: boolean
  focusKeyword?: string | null
}

export type BlogCategory = {
  title: string
  slug: string
  description?: string | null
}

export type BlogAuthor = {
  name: string
  role?: string | null
  bio?: string | null
  avatar?: BlogImage | null
}

export type BlogCTA = {
  label: string
  url: string
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  coverImage: BlogImage
  publishedAt: string
  featured: boolean
  readingTime: number
  author?: BlogAuthor | null
  category?: BlogCategory | null
  cta?: BlogCTA | null
  seo: BlogSEO
  body: PortableTextBlock[]
}

export type BlogHeading = {
  id: string
  text: string
  level: 2 | 3
}
