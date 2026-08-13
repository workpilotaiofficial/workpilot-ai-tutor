import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === 'production'
    : process.env.NODE_ENV === 'production'

  return {
    rules: isProduction
      ? { userAgent: '*', allow: '/', disallow: ['/admin/', '/dashboard/', '/studio/', '/api/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  }
}
