import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

type BlogCtaProps = {
  label?: string
  href?: string
  compact?: boolean
}

export function BlogCta({ label = 'Start studying free', href = '/signup', compact = false }: BlogCtaProps) {
  return (
    <section className={`relative overflow-hidden bg-[#12213a] text-white mt-10 ${compact ? 'rounded-[1.75rem] p-7 sm:p-10' : 'rounded-[2.25rem] px-6 py-12 sm:px-10 sm:py-16 lg:px-16'}`}>
      <div className='pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#ff7a3d]/30 blur-3xl' />
      <div className='pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[#81c7a5]/20 blur-3xl' />
      <div className={`relative z-10 ${compact ? '' : 'grid items-end gap-8 lg:grid-cols-[1fr_auto]'}`}>
        <div>
    
          <h2 className={`mt-4 max-w-2xl font-semibold tracking-[-0.045em] ${compact ? 'text-3xl' : 'text-3xl sm:text-5xl'}`}>
            Turn this idea into your next study session.
          </h2>
          
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
