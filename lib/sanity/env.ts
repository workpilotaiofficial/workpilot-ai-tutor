import { getSiteUrl } from '@/lib/site-config'

export const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() ?? ''
export const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() ?? ''
export const sanityExploreDataset = process.env.NEXT_PUBLIC_SANITY_EXPLORE_DATASET?.trim() ?? ''
export const sanityApiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() ?? '2026-08-13'
export const sanityReadToken = process.env.SANITY_API_READ_TOKEN?.trim() ?? ''
export const sanityPreviewUrl =
  process.env.SANITY_STUDIO_PREVIEW_URL?.trim() ?? `${getSiteUrl()}/api/draft/enable`
export const sanityPreviewSecret = process.env.SANITY_PREVIEW_SECRET?.trim() ?? ''
export const sanityExploreWebhookSecret = process.env.SANITY_EXPLORE_WEBHOOK_SECRET?.trim() ?? ''

export const isSanityConfigured = Boolean(
  sanityProjectId && sanityDataset && sanityApiVersion,
)
