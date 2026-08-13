import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Clock3 } from 'lucide-react'
import type { BlogPost } from '@/lib/blog/types'
import { formatUTCDate } from '@/lib/utils'

type BlogCardProps = {
  post: BlogPost
  featured?: boolean
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <article
      className={
        featured
          ? 'group grid overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white shadow-[0_24px_80px_rgba(30,41,59,0.10)] lg:grid-cols-[1.15fr_0.85fr]'
          : 'group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-white shadow-[0_16px_45px_rgba(30,41,59,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(30,41,59,0.12)]'
      }
    >
      <Link
        href={`/blog/${post.slug}`}
        className={`relative block overflow-hidden ${featured ? 'min-h-72 lg:min-h-[31rem]' : 'aspect-[16/10]'}`}
        aria-label={`Read ${post.title}`}
      >
        <Image
          src={post.coverImage.url}
          alt={post.coverImage.alt}
          fill
          priority={featured}
          sizes={featured ? '(max-width: 1024px) 100vw, 58vw' : '(max-width: 768px) 100vw, 33vw'}
          className='object-cover transition duration-700 group-hover:scale-[1.04]'
        />
        <div className='absolute inset-0 bg-linear-to-t from-slate-950/30 via-transparent to-transparent' />
      </Link>

      <div className={`flex flex-1 flex-col ${featured ? 'p-7 sm:p-10 lg:justify-center' : 'p-6'}`}>
        <div className='flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500'>
          {post.category ? (
            <span className='rounded-full bg-[#fff0df] px-3 py-1.5 text-[#b64d16]'>
              {post.category.title}
            </span>
          ) : null}
          <time dateTime={post.publishedAt}>{formatUTCDate(post.publishedAt)}</time>
          <span className='inline-flex items-center gap-1.5'>
            <Clock3 className='h-3.5 w-3.5' aria-hidden='true' />
            {post.readingTime} min
          </span>
        </div>

        <h2
          className={`mt-5 font-semibold tracking-[-0.04em] text-slate-950 ${
            featured ? 'text-3xl sm:text-4xl lg:text-5xl' : 'text-2xl'
          }`}
        >
          <Link href={`/blog/${post.slug}`} className='transition-colors hover:text-[#d95722]'>
            {post.title}
          </Link>
        </h2>
        <p className={`mt-4 text-slate-600 ${featured ? 'text-base leading-7 sm:text-lg sm:leading-8' : 'line-clamp-3 text-sm leading-6'}`}>
          {post.excerpt}
        </p>

        <Link
          href={`/blog/${post.slug}`}
          className='mt-7 inline-flex w-fit items-center gap-2 text-sm font-bold text-slate-950 transition-colors hover:text-[#d95722]'
        >
          Read article
          <ArrowUpRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5' aria-hidden='true' />
        </Link>
      </div>
    </article>
  )
}
