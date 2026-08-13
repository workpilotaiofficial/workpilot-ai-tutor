import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from '@/sanity/schemaTypes'
import {
  sanityApiVersion,
  sanityDataset,
  sanityPreviewUrl,
  sanityProjectId,
} from '@/lib/sanity/env'

export default defineConfig({
  name: 'default',
  title: 'Neurova Blog Studio',
  projectId: sanityProjectId || 'neurova-demo',
  dataset: sanityDataset || 'production',
  basePath: '/studio',
  schema: {
    types: schemaTypes,
  },
  plugins: [structureTool()],
  document: {
    productionUrl: async (prev, context) => {
      if (context.document?._type !== 'post') return prev

      const slug = await context.getClient({ apiVersion: sanityApiVersion }).fetch(
        `*[_id == $id][0].slug.current`,
        { id: context.document?._id },
      )

      const previewUrl = new URL(sanityPreviewUrl)
      previewUrl.searchParams.set('slug', slug ? `/blog/${slug}` : '/blog')
      return previewUrl.toString()
    },
  },
})
