import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Clock, Search } from 'lucide-react'
import Footer from '@/components/footer'
import { listPublicExplore } from '@/lib/explore/service'

export const revalidate = 300
export const metadata: Metadata = { title: 'Explore free study guides', description: 'Browse public, read-only study guides across popular subjects.', alternates: { canonical: '/explore' } }
export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams; const subject = typeof q.subject === 'string' ? q.subject : undefined; const search = typeof q.search === 'string' ? q.search : undefined; const cursor = typeof q.cursor === 'string' ? q.cursor : undefined; const result = await listPublicExplore({ subject, search, cursor, limit: 12 }); const href = (next?: string) => `/explore?${new URLSearchParams(Object.fromEntries(Object.entries({ subject, search, cursor: next }).filter(([, v]) => v)) as Record<string, string>)}`; return <main className="min-h-screen bg-[#f7f3ea] text-slate-950">

    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8"><form className="mx-auto flex max-w-2xl gap-2" action="/explore"><label className="relative flex-1"><span className="sr-only">Search guides</span><Search className="absolute left-4 top-4 h-5 w-5 text-slate-400" /><input name="search" defaultValue={search} placeholder="Search guides, subjects or tags" className="h-13 w-full rounded-full border bg-white pl-12 pr-5" /></label>{subject ? <input type="hidden" name="subject" value={subject} /> : null}<button className="rounded-full bg-slate-950 px-6 font-semibold text-white">Search</button></form>
      <nav aria-label="Subjects" className="mt-8 flex flex-wrap justify-center gap-2">{result.subjects.map((x) => <Link key={x} href={x === 'All' ? href() : `/explore?subject=${encodeURIComponent(x)}${search ? `&search=${encodeURIComponent(search)}` : ''}`} className={`rounded-full border px-4 py-2 text-sm font-semibold ${(subject ?? 'All') === x ? 'bg-slate-950 text-white' : 'bg-white'}`}>{x}</Link>)}</nav>
      {result.data.length ? 
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((card) => <Link key={card.id} href={`/explore/${card.slug}`} className="group overflow-hidden rounded-[2rem] border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[16/10] bg-slate-100">
        <Image src={card.coverImage.url} alt={card.coverImage.alt} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
        </div>
        <div className="p-6"><p className="text-xs font-bold uppercase tracking-widest text-orange-600">{card.subject}</p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">{card.title}</h2>
     
  
          </div>
          </Link>)}
          </div> 
          : <div className="mt-14 rounded-3xl border border-dashed bg-white p-14 text-center"><BookOpen className="mx-auto h-8 w-8" /><h2 className="mt-4 text-2xl font-semibold">No matching guides</h2><p className="mt-2 text-slate-600">Try a broader search or another subject.</p></div>}
      {result.hasMore && result.nextCursor ? <div className="mt-10 text-center"><Link href={href(result.nextCursor)} className="inline-flex rounded-full border bg-white px-6 py-3 font-semibold">Load more guides</Link></div> : null}</div><Footer /></main>
}
