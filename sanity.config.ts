import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from '@/sanity/schemaTypes'
import { exploreStudySetType, exploreSubjectType } from '@/sanity/schemaTypes/exploreTypes'
import { seoType } from '@/sanity/schemaTypes/seoType'
import { sanityApiVersion, sanityDataset, sanityExploreDataset, sanityPreviewUrl, sanityProjectId } from '@/lib/sanity/env'

const projectId = sanityProjectId || 'neurova-demo'
const productionUrl = (kind: 'blog' | 'explore') => async (prev: string | undefined, context: any) => {
  const expected = kind === 'blog' ? 'post' : 'exploreStudySet'
  if (context.document?._type !== expected) return prev
  const slug = await context.getClient({ apiVersion: sanityApiVersion }).fetch(`*[_id == $id][0].slug.current`, { id: context.document?._id })
  const url = new URL(sanityPreviewUrl)
  url.searchParams.set('slug', slug ? `/${kind}/${slug}` : `/${kind}`)
  return url.toString()
}

export default defineConfig([
  { name: 'blog', title: 'Neurova Blog Studio', projectId, dataset: sanityDataset || 'production', basePath: '/studio/blog', schema: { types: schemaTypes }, plugins: [structureTool()], document: { productionUrl: productionUrl('blog') } },
  { name: 'explore', title: 'Neurova Explore Studio', projectId, dataset: sanityExploreDataset || 'explore', basePath: '/studio/explore', schema: { types: [exploreSubjectType, exploreStudySetType, seoType] }, plugins: [structureTool()], document: { productionUrl: productionUrl('explore') } },
])
