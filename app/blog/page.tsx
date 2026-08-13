import type { Metadata } from 'next'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { ArrowRight, BookOpen, BrainCircuit, Sparkles } from 'lucide-react'
import Footer from '@/components/footer'
import { BlogCard } from '@/components/blog/blog-card'
import { BlogCta } from '@/components/blog/blog-cta'
import { getBlogIndexData } from '@/lib/blog/service'
import { absoluteUrl } from '@/lib/site-config'
import { cn } from '@/lib/utils'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const { featured } = await getBlogIndexData()
  const title = 'AI Study Tips, Exam Prep & Learning Guides'
  const description = 'Practical AI study workflows, revision strategies, and learning guides built to help students learn faster and remember more.'
  const image = featured?.seo.ogImage?.url ?? featured?.coverImage.url

  return {
    title,
    description,
    alternates: { canonical: '/blog' },
    openGraph: {
      type: 'website',
      url: absoluteUrl('/blog'),
      title,
      description,
      images: image ? [{ url: image, alt: featured?.seo.ogImage?.alt ?? featured?.coverImage.alt }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

type BlogIndexPageProps = {
  searchParams: Promise<{ category?: string | string[] }>
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const { isEnabled: preview } = await draftMode()
  const query = await searchParams
  const category = typeof query.category === 'string' ? query.category : undefined
  const { categories, featured, remainingPosts } = await getBlogIndexData(category, preview)
  const activeCategory = categories.find((item) => item.slug === category)

  return (
    <main className='min-h-screen overflow-hidden bg-[#f7f3ea] text-slate-950'>
      <section className='relative border-b border-slate-900/10 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-24'>
        <div className='pointer-events-none absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#a8d9bf]/50 blur-3xl' />
        <div className='pointer-events-none absolute right-[-6rem] top-12 h-72 w-72 rounded-full bg-[#ffb486]/35 blur-3xl' />
        <div className='absolute inset-0 opacity-35 [background-image:radial-gradient(#1e293b_0.7px,transparent_0.7px)] [background-size:22px_22px]' />

        <div className='relative mx-auto max-w-7xl text-center'>
          {preview ? (
            <div className='mx-auto mb-6 w-fit rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-900'>Draft preview enabled</div>
          ) : null}
          <p className='inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c84f1b] shadow-sm backdrop-blur'>
            <Sparkles className='h-4 w-4' aria-hidden='true' />
            The Neurova Learning Lab
          </p>
          <h1 className='mx-auto mt-7 max-w-5xl text-5xl font-semibold leading-[0.96] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]'>
            Study less randomly.
            <span className='block text-[#e45e25]'>Learn with a system.</span>
          </h1>
          <p className='mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-xl sm:leading-8'>
            Field-tested study strategies, AI workflows, and exam advice for students who want better results without adding more hours.
          </p>
          <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Link href='/signup' className='inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#e45e25]'>
              Try Neurova free <ArrowRight className='h-4 w-4' />
            </Link>
            <a href='#latest' className='inline-flex min-h-12 items-center justify-center rounded-full border border-slate-900/15 bg-white/70 px-6 py-3 text-sm font-bold text-slate-800 transition hover:bg-white'>Browse the latest guides</a>
          </div>

          <div className='mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-3 text-left sm:gap-5'>
            {[
              { icon: BrainCircuit, value: 'AI-first', label: 'study workflows' },
              { icon: BookOpen, value: 'Practical', label: 'learning guides' },
              { icon: Sparkles, value: 'Student-led', label: 'exam tactics' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={value} className='rounded-2xl border border-slate-900/10 bg-white/65 p-3 shadow-sm backdrop-blur sm:p-5'>
                <Icon className='h-5 w-5 text-[#e45e25]' aria-hidden='true' />
                <p className='mt-3 text-sm font-bold sm:text-base'>{value}</p>
                <p className='mt-1 text-xs leading-5 text-slate-500 sm:text-sm'>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className='mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20'>
        <nav aria-label='Blog categories' className='flex flex-wrap items-center justify-center gap-2'>
          <Link href='/blog' className={cn('rounded-full border px-4 py-2 text-sm font-semibold transition', !category ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-900/10 bg-white text-slate-600 hover:border-slate-900/30')}>All topics</Link>
          {categories.map((item) => (
            <Link key={item.slug} href={`/blog?category=${encodeURIComponent(item.slug)}`} className={cn('rounded-full border px-4 py-2 text-sm font-semibold transition', category === item.slug ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-900/10 bg-white text-slate-600 hover:border-slate-900/30')}>
              {item.title}
            </Link>
          ))}
        </nav>

        <section id='latest' className='scroll-mt-28 pt-12 sm:pt-16'>
          <div className='mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='text-xs font-bold uppercase tracking-[0.2em] text-[#d95722]'>{activeCategory ? activeCategory.title : 'Editor’s pick'}</p>
              <h2 className='mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl'>{activeCategory ? `Ideas for ${activeCategory.title.toLowerCase()}` : 'Start with this guide'}</h2>
            </div>
            {activeCategory?.description ? <p className='max-w-md text-sm leading-6 text-slate-600'>{activeCategory.description}</p> : null}
          </div>

          {featured ? (
            <BlogCard post={featured} featured />
          ) : (
            <div className='rounded-[2rem] border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center'>
              <h2 className='text-2xl font-semibold'>No articles here yet</h2>
              <p className='mt-3 text-slate-600'>Choose another topic or check back after the next guide is published.</p>
              <Link href='/blog' className='mt-6 inline-flex font-bold text-[#d95722]'>View all articles</Link>
            </div>
          )}
        </section>

        {remainingPosts.length ? (
          <section className='py-16 sm:py-24' aria-labelledby='more-stories'>
            <div className='mb-8 flex items-end justify-between gap-6'>
              <div>
                <p className='text-xs font-bold uppercase tracking-[0.2em] text-[#d95722]'>Fresh from the lab</p>
                <h2 id='more-stories' className='mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl'>More useful reads</h2>
              </div>
              <span className='hidden text-sm font-semibold text-slate-500 sm:block'>{remainingPosts.length} {remainingPosts.length === 1 ? 'article' : 'articles'}</span>
            </div>
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {remainingPosts.map((post) => <BlogCard key={post.id} post={post} />)}
            </div>
          </section>
        ) : null}

        <BlogCta />
      </div>
      <Footer />
    </main>
  )
}
