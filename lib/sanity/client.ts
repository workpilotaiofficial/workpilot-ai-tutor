import { createClient, type QueryParams } from 'next-sanity'
import {
  isSanityConfigured,
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
  sanityReadToken,
} from '@/lib/sanity/env'

const client = isSanityConfigured
  ? createClient({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      apiVersion: sanityApiVersion,
      useCdn: true,
    })
  : null

type SanityFetchOptions = {
  query: string
  params?: QueryParams
  preview?: boolean
  revalidate?: number
  tags?: string[]
}

export async function sanityFetch<T>({
  query,
  params = {},
  preview = false,
  revalidate = 300,
  tags = ['blog'],
}: SanityFetchOptions): Promise<T | null> {
  if (!client) return null

  const activeClient =
    preview && sanityReadToken
      ? client.withConfig({
          useCdn: false,
          token: sanityReadToken,
          perspective: 'previewDrafts' as never,
        })
      : client

  try {
    return await activeClient.fetch<T>(query, params, {
      next: preview ? { revalidate: 0, tags } : { revalidate, tags },
    })
  } catch {
    return null
  }
}
