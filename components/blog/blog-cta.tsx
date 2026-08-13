import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

type BlogCtaProps = {
  label?: string
  href?: string
  compact?: boolean
}

export function BlogCta({ label = 'Start studying free', href = '/signup', compact = false }: BlogCtaProps) {
  return (
    <section className={`relative overflow-hidden bg-[#12213a] text-white ${compact ? 'rounded-[1.75rem] p-7 sm:p-10' : 'rounded-[2.25rem] px-6 py-12 sm:px-10 sm:py-16 lg:px-16'}`}>
      <div className='pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#ff7a3d]/30 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#81c7a5]/20 blur-3xl' />
      <div className={`relative z-10 ${compact ? '' : 'grid items-end gap-8 lg:grid-cols-[1fr_auto]'}`}>
        <div>
          <p className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffab7c]'>
            <Sparkles className='h-4 w-4' aria-hidden='true' />
            Study smarter with Neurova
          </p>
          <h2 className={`mt-4 max-w-2xl font-semibold tracking-[-0.045em] ${compact ? 'text-3xl' : 'text-3xl sm:text-5xl'}`}>
            Turn this idea into your next study session.
          </h2>
          {!compact ? (
            <div className='mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300'>
              <span className='inline-flex items-center gap-2'><CheckCircle2 className='h-4 w-4 text-[#9be0bd]' />No credit card</span>
              <span className='inline-flex items-center gap-2'><CheckCircle2 className='h-4 w-4 text-[#9be0bd]' />Create notes and quizzes</span>
              <span className='inline-flex items-center gap-2'><CheckCircle2 className='h-4 w-4 text-[#9be0bd]' />Get instant feedback</span>
            </div>
          ) : null}
        </div>
        <Link
          href={href}
          className={`${compact ? 'mt-7' : ''} inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#ff7438] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(255,116,56,0.28)] transition hover:-translate-y-0.5 hover:bg-[#f26629]`}
        >
          {label}
          <ArrowRight className='h-4 w-4' aria-hidden='true' />
        </Link>
      </div>
    </section>
  )
}
