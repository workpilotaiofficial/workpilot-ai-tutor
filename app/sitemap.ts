import type { MetadataRoute } from 'next'
import { getAllBlogPosts } from '@/lib/blog/service'
import { absoluteUrl } from '@/lib/site-config'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllBlogPosts()
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/features'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/pricing'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/contact'), changeFrequency: 'yearly', priority: 0.5 },
    { url: absoluteUrl('/blog'), changeFrequency: 'daily', priority: 0.9 },
  ]
  const blogPages: MetadataRoute.Sitemap = posts
    .filter((post) => !post.seo.noIndex)
    .map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly',
      priority: post.featured ? 0.8 : 0.7,
      images: [post.coverImage.url],
    }))

  return [...staticPages, ...blogPages]
}
