import { authorType } from '@/sanity/schemaTypes/authorType'
import { categoryType } from '@/sanity/schemaTypes/categoryType'
import { postType } from '@/sanity/schemaTypes/postType'
import { seoType } from '@/sanity/schemaTypes/seoType'

export const schemaTypes = [postType, seoType, authorType, categoryType]
