import { Suspense } from 'react'
import SyllabusIntelligenceContent from './content'

export default function SyllabusIntelligencePage() {
  return (
    <Suspense fallback={<SyllabusIntelligenceLoading />}>
      <SyllabusIntelligenceContent />
    </Suspense>
  )
}

function SyllabusIntelligenceLoading() {
  return (
    <div className="min-h-full w-full bg-background">
      <div className="mx-auto w-full px-4 pb-10 pt-12 sm:px-8 sm:pb-12 sm:pt-20 lg:px-10 lg:pt-24">
        <div className="mx-auto mb-28 max-w-4xl animate-pulse text-center">
          <div className="mx-auto h-10 w-full max-w-xl rounded-xl bg-secondary" />
          <div className="mx-auto mt-4 h-5 w-full max-w-2xl rounded-lg bg-secondary" />
          <div className="mx-auto mt-8 grid max-w-[560px] grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2">
            <div className="h-36 rounded-[28px] bg-secondary" />
            <div className="h-36 rounded-[28px] bg-secondary" />
          </div>
        </div>
      </div>
    </div>
  )
}
