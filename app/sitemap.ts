import type { MetadataRoute } from 'next'
import { getAllBlogPosts } from '@/lib/blog/service'
import { absoluteUrl } from '@/lib/site-config'
import { getPublicExploreSlugs } from '@/lib/explore/service'

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllBlogPosts()
  const guides = await getPublicExploreSlugs()
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/features'), changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/pricing'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/contact'), changeFrequency: 'yearly', priority: 0.5 },
    { url: absoluteUrl('/blog'), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/explore'), changeFrequency: 'daily', priority: 0.9 },
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

  const explorePages: MetadataRoute.Sitemap = guides.map((guide) => ({ url: absoluteUrl(`/explore/${guide.slug}`), lastModified: new Date(guide.publishedAt), changeFrequency: 'weekly', priority: 0.8, images: guide.image ? [guide.image] : undefined }))
  return [...staticPages, ...blogPages, ...explorePages]
}
