import { fallbackBlogPosts } from '@/lib/blog/fallback-posts'
import type { BlogCategory, BlogPost } from '@/lib/blog/types'
import { estimateReadingTime, pickImage } from '@/lib/blog/utils'
import { sanityFetch } from '@/lib/sanity/client'
import { isSanityConfigured } from '@/lib/sanity/env'
import {
  allPostsQuery,
  categoriesQuery,
  fallbackRelatedPostsQuery,
  postBySlugQuery,
  postsByCategoryQuery,
  relatedPostsQuery,
} from '@/lib/sanity/queries'

const fallbackCover = {
  url: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&w=1400&q=80',
  alt: 'Neurova blog cover placeholder',
}

type RawPost = Record<string, any>
type RawCategory = Record<string, any>

export function isBlogCmsConfigured() {
  return isSanityConfigured
}

function normalizeCategory(raw: RawCategory | null | undefined): BlogCategory | null {
  const slug = typeof raw?.slug === 'string' ? raw.slug.trim() : ''
  const title = typeof raw?.title === 'string' ? raw.title.trim() : ''
  if (!slug || !title) return null

  return {
    title,
    slug,
    description: typeof raw?.description === 'string' ? raw.description.trim() : null,
  }
}

function normalizePost(raw: RawPost): BlogPost | null {
  const slug = typeof raw?.slug === 'string' ? raw.slug.trim() : ''
  const title = typeof raw?.title === 'string' ? raw.title.trim() : ''
  const excerpt = typeof raw?.excerpt === 'string' ? raw.excerpt.trim() : ''
  const publishedAt = typeof raw?.publishedAt === 'string' ? raw.publishedAt : ''

  if (!slug || !title || !excerpt || !publishedAt) return null

  const coverImage = pickImage(raw.coverImage, fallbackCover)
  const body = Array.isArray(raw.body) ? raw.body : []
  const readingTime =
    typeof raw.readingTime === 'number' && raw.readingTime > 0
      ? Math.round(raw.readingTime)
      : estimateReadingTime({ excerpt, body })
  const category = normalizeCategory(raw.category)
  const authorName = typeof raw?.author?.name === 'string' ? raw.author.name.trim() : ''

  return {
    id: typeof raw?._id === 'string' ? raw._id : slug,
    title,
    slug,
    excerpt,
    publishedAt,
    featured: Boolean(raw?.featured),
    readingTime,
    coverImage,
    author: authorName
      ? {
          name: authorName,
          role: typeof raw?.author?.role === 'string' ? raw.author.role.trim() : null,
          bio: typeof raw?.author?.bio === 'string' ? raw.author.bio.trim() : null,
          avatar: raw?.author?.avatar?.url
            ? pickImage(raw.author.avatar, {
                url: raw.author.avatar.url,
                alt: raw.author.name,
              })
            : null,
        }
      : null,
    category,
    cta:
      typeof raw?.ctaLabel === 'string' &&
      raw.ctaLabel.trim() &&
      typeof raw?.ctaUrl === 'string' &&
      raw.ctaUrl.trim()
        ? {
            label: raw.ctaLabel.trim(),
            url: raw.ctaUrl.trim(),
          }
        : {
            label: 'Start free',
            url: '/signup',
          },
    seo: {
      title:
        typeof raw?.seo?.title === 'string' && raw.seo.title.trim()
          ? raw.seo.title.trim()
          : title,
      description:
        typeof raw?.seo?.description === 'string' && raw.seo.description.trim()
          ? raw.seo.description.trim()
          : excerpt,
      canonicalUrl:
        typeof raw?.seo?.canonicalUrl === 'string' && raw.seo.canonicalUrl.trim()
          ? raw.seo.canonicalUrl.trim()
          : null,
      ogImage: raw?.seo?.ogImage?.url
        ? pickImage(raw.seo.ogImage, coverImage)
        : coverImage,
      noIndex: Boolean(raw?.seo?.noIndex),
      noFollow: Boolean(raw?.seo?.noFollow),
      focusKeyword:
        typeof raw?.seo?.focusKeyword === 'string' ? raw.seo.focusKeyword.trim() : null,
    },
    body,
  }
}

async function fetchPosts(categorySlug?: string, preview = false) {
  if (!isSanityConfigured) {
    const filtered = categorySlug
      ? fallbackBlogPosts.filter((post) => post.category?.slug === categorySlug)
      : fallbackBlogPosts
    return filtered
  }

  const query = categorySlug ? postsByCategoryQuery : allPostsQuery
  const params = categorySlug ? { category: categorySlug } : {}
  const response = await sanityFetch<RawPost[]>({
    query,
    params,
    preview,
    revalidate: 300,
  })

  return Array.isArray(response)
    ? response.map(normalizePost).filter((post): post is BlogPost => Boolean(post))
    : []
}

export async function getBlogCategories(preview = false) {
  if (!isSanityConfigured) {
    return Array.from(
      new Map(
        fallbackBlogPosts
          .map((post) => post.category)
          .filter((category): category is BlogCategory => Boolean(category))
          .map((category) => [category.slug, category]),
      ).values(),
    )
  }

  const response = await sanityFetch<RawCategory[]>({
    query: categoriesQuery,
    preview,
    revalidate: 300,
  })

  const categories = Array.isArray(response)
    ? response.map(normalizeCategory).filter((item): item is BlogCategory => Boolean(item))
    : []

  return categories
}

export async function getBlogIndexData(categorySlug?: string, preview = false) {
  const posts = await fetchPosts(categorySlug, preview)
  const categories = await getBlogCategories(preview)
  const featured = posts.find((post) => post.featured) ?? posts[0] ?? null
  const remainingPosts = featured ? posts.filter((post) => post.slug !== featured.slug) : posts

  return {
    posts,
    categories,
    featured,
    remainingPosts,
  }
}

export async function getBlogPostBySlug(slug: string, preview = false) {
  if (!isSanityConfigured) {
    return fallbackBlogPosts.find((post) => post.slug === slug) ?? null
  }

  const response = await sanityFetch<RawPost>({
    query: postBySlugQuery,
    params: { slug },
    preview,
    revalidate: 300,
  })

  return response ? normalizePost(response) : null
}

export async function getRelatedBlogPosts(post: BlogPost, preview = false) {
  if (!isSanityConfigured) {
    return fallbackBlogPosts.filter((item) => item.slug !== post.slug).slice(0, 3)
  }

  const response = await sanityFetch<RawPost[]>({
    query: post.category?.slug ? relatedPostsQuery : fallbackRelatedPostsQuery,
    params: {
      slug: post.slug,
      category: post.category?.slug ?? '',
    },
    preview,
    revalidate: 300,
  })

  const related = Array.isArray(response)
    ? response.map(normalizePost).filter((item): item is BlogPost => Boolean(item))
    : []

  return related
}

export async function getAllBlogPosts(preview = false) {
  return fetchPosts(undefined, preview)
}
