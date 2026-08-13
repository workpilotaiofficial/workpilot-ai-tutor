import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { PublicStudySetReader } from '@/components/explore/public-study-set-reader'
import { getPublicExploreGuide } from '@/lib/explore/service'
import { absoluteUrl } from '@/lib/site-config'

export const revalidate = 300
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; const { isEnabled } = await draftMode(); const guide = await getPublicExploreGuide(slug, isEnabled); if (!guide) return {}; const title = guide.seo.title ?? guide.title; const description = guide.seo.description ?? guide.summary; const image = guide.seo.ogImage ?? guide.coverImage.url; return { title, description, robots: guide.seo.noIndex ? { index: false } : undefined, alternates: { canonical: guide.seo.canonicalUrl ?? `/explore/${guide.slug}` }, openGraph: { type: 'article', url: absoluteUrl(`/explore/${guide.slug}`), title, description, images: [{ url: image, alt: guide.coverImage.alt }] }, twitter: { card: 'summary_large_image', title, description, images: [image] } } }
export default async function GuidePage({ params }: Props) { const { slug } = await params; const { isEnabled } = await draftMode(); const guide = await getPublicExploreGuide(slug, isEnabled); if (!guide) notFound(); const jsonLd = { '@context': 'https://schema.org', '@type': 'LearningResource', name: guide.title, description: guide.summary, url: absoluteUrl(`/explore/${guide.slug}`), image: guide.coverImage.url, educationalLevel: guide.difficulty, timeRequired: `PT${guide.estimatedMinutes}M`, learningResourceType: guide.sections.map((section) => section.label), teaches: guide.learningObjectives }; return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}/><PublicStudySetReader guide={guide} preview={isEnabled}/></> }
