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
      <div className="mx-auto w-full px-6 pb-12 pt-24 sm:px-8 lg:px-10">
        <div className="mx-auto mb-28 max-w-4xl animate-pulse text-center">
          <div className="mx-auto h-10 w-full max-w-xl rounded-xl bg-secondary" />
          <div className="mx-auto mt-4 h-5 w-full max-w-2xl rounded-lg bg-secondary" />
          <div className="mx-auto mt-10 grid max-w-[560px] grid-cols-2 gap-3">
            <div className="h-36 rounded-[28px] bg-secondary" />
            <div className="h-36 rounded-[28px] bg-secondary" />
          </div>
        </div>
      </div>
    </div>
  )
}
