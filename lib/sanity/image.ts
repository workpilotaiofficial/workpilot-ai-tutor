import createImageUrlBuilder, { type SanityImageSource } from '@sanity/image-url'
import { isSanityConfigured, sanityDataset, sanityProjectId } from '@/lib/sanity/env'

const builder = isSanityConfigured
  ? createImageUrlBuilder({
      projectId: sanityProjectId,
      dataset: sanityDataset,
    })
  : null

export function urlForImage(source: SanityImageSource) {
  return builder?.image(source)
}
