import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock3 } from 'lucide-react'
import Footer from '@/components/footer'
import { BlogCard } from '@/components/blog/blog-card'
import { BlogCta } from '@/components/blog/blog-cta'
import { ArticleShareLinks, PortableContent } from '@/components/blog/portable-content'
import { getAllBlogPosts, getBlogPostBySlug, getRelatedBlogPosts } from '@/lib/blog/service'
import { extractHeadings } from '@/lib/blog/utils'
import { absoluteUrl } from '@/lib/site-config'
import { formatUTCDate } from '@/lib/utils'

export const revalidate = 300

type ArticlePageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: 'Article not found', robots: { index: false, follow: false } }

  const canonical = post.seo.canonicalUrl || absoluteUrl(`/blog/${post.slug}`)
  const image = post.seo.ogImage ?? post.coverImage

  return {
    title: post.seo.title,
    description: post.seo.description,
    keywords: post.seo.focusKeyword ? [post.seo.focusKeyword] : undefined,
    alternates: { canonical },
    robots: { index: !post.seo.noIndex, follow: !post.seo.noFollow },
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.seo.title,
      description: post.seo.description,
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: [{ url: image.url, alt: image.alt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.title,
      description: post.seo.description,
      images: [image.url],
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const { isEnabled: preview } = await draftMode()
  const post = await getBlogPostBySlug(slug, preview)
  if (!post) notFound()

  const [relatedPosts, headings] = await Promise.all([
    getRelatedBlogPosts(post, preview),
    Promise.resolve(extractHeadings(post.body)),
  ])
  const canonical = post.seo.canonicalUrl || absoluteUrl(`/blog/${post.slug}`)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo.description,
    image: [post.seo.ogImage?.url ?? post.coverImage.url],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: canonical,
    author: post.author ? { '@type': 'Person', name: post.author.name } : { '@type': 'Organization', name: 'Neurova' },
    publisher: { '@type': 'Organization', name: 'Neurova', url: absoluteUrl('/') },
  }

  return (
    <main className='min-h-screen overflow-hidden bg-[#fbfaf6] text-slate-950'>
      <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <article>
        <header className='relative border-b border-slate-900/10 bg-[#f7f3ea] px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-20'>
          <div className='pointer-events-none absolute right-[-8rem] top-[-9rem] h-96 w-96 rounded-full bg-[#ffb486]/35 blur-3xl' />
          <div className='pointer-events-none absolute left-[-7rem] bottom-[-10rem] h-80 w-80 rounded-full bg-[#a8d9bf]/45 blur-3xl' />
          <div className='relative mx-auto max-w-5xl'>
            <Link href='/blog' className='inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#d95722]'>
              <ArrowLeft className='h-4 w-4' aria-hidden='true' /> Back to the blog
            </Link>
            {preview ? <div className='mt-6 w-fit rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-900'>Draft preview enabled</div> : null}

            <div className='mt-10 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500'>
              {post.category ? <Link href={`/blog?category=${encodeURIComponent(post.category.slug)}`} className='rounded-full bg-[#ffe4d1] px-3 py-1.5 text-[#b64d16] transition hover:bg-[#ffd7bd]'>{post.category.title}</Link> : null}
              <time dateTime={post.publishedAt}>{formatUTCDate(post.publishedAt)}</time>
              <span className='inline-flex items-center gap-1.5'><Clock3 className='h-3.5 w-3.5' />{post.readingTime} min read</span>
            </div>

            <h1 className='mt-6 max-w-5xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl'>{post.title}</h1>
            <p className='mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl'>{post.excerpt}</p>

            <div className='mt-9 flex flex-col gap-5 border-t border-slate-900/10 pt-6 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-3'>
                {post.author?.avatar ? (
                  <Image src={post.author.avatar.url} alt={post.author.avatar.alt} width={48} height={48} className='h-12 w-12 rounded-full object-cover' />
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white'>{post.author?.name?.slice(0, 1) ?? 'N'}</div>
                )}
                <div>
                  <p className='text-sm font-bold'>{post.author?.name ?? 'Neurova Editorial'}</p>
                  <p className='mt-0.5 text-xs text-slate-500'>{post.author?.role ?? 'Learning Systems Team'}</p>
                </div>
              </div>
              <ArticleShareLinks url={canonical} title={post.title} />
            </div>
          </div>
        </header>

        <div className='mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14'>
          <div className='relative aspect-[16/8] overflow-hidden rounded-[1.75rem] bg-slate-100 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:rounded-[2.5rem]'>
            <Image src={post.coverImage.url} alt={post.coverImage.alt} fill priority sizes='(max-width: 1280px) 100vw, 1280px' className='object-cover' />
          </div>

          <div className={`mx-auto mt-12 grid max-w-6xl gap-12 ${headings.length >= 2 ? 'lg:grid-cols-[220px_minmax(0,760px)] lg:justify-center' : 'lg:grid-cols-[minmax(0,760px)] lg:justify-center'}`}>
            {headings.length >= 2 ? (
              <aside className='hidden lg:block'>
                <nav className='sticky top-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm' aria-label='Table of contents'>
                  <p className='text-xs font-bold uppercase tracking-[0.18em] text-[#d95722]'>In this guide</p>
                  <ol className='mt-4 space-y-3'>
                    {headings.map((heading) => (
                      <li key={heading.id} className={heading.level === 3 ? 'pl-3' : ''}>
                        <a href={`#${heading.id}`} className='block text-sm leading-5 text-slate-600 transition hover:text-slate-950'>{heading.text}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </aside>
            ) : null}

            <div>
              <PortableContent body={post.body} />

              {post.author ? (
                <section className='mt-12 flex gap-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8' aria-label='About the author'>
                  {post.author.avatar ? <Image src={post.author.avatar.url} alt={post.author.avatar.alt} width={64} height={64} className='h-16 w-16 shrink-0 rounded-full object-cover' /> : <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e2f1e9] text-xl font-bold text-slate-800'>{post.author.name.slice(0, 1)}</div>}
                  <div>
                    <p className='text-xs font-bold uppercase tracking-[0.16em] text-[#d95722]'>Written by</p>
                    <h2 className='mt-1 text-xl font-semibold'>{post.author.name}</h2>
                    {post.author.bio ? <p className='mt-2 text-sm leading-6 text-slate-600'>{post.author.bio}</p> : null}
                  </div>
                </section>
              ) : null}

              <div className='mt-10'><BlogCta compact label={post.cta?.label} href={post.cta?.url} /></div>
            </div>
          </div>
        </div>
      </article>

      {relatedPosts.length ? (
        <section className='border-t border-slate-200 bg-[#f7f3ea] px-5 py-16 sm:px-8 sm:py-24' aria-labelledby='related-articles'>
          <div className='mx-auto max-w-7xl'>
            <p className='text-xs font-bold uppercase tracking-[0.2em] text-[#d95722]'>Keep learning</p>
            <h2 id='related-articles' className='mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl'>Read next</h2>
            <div className='mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>{relatedPosts.map((item) => <BlogCard key={item.id} post={item} />)}</div>
          </div>
        </section>
      ) : null}
      <Footer />
    </main>
  )
}
