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
    <div className="w-full bg-linear-to-br from-white via-blue-50/30 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <div className="mb-10 relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-[#3825b4]/90 to-primary p-8 sm:p-10">
          <div className="relative">
            <div className="mb-7 max-w-2xl">
              <div className="mb-4 h-6 w-48 bg-white/20 rounded-full animate-pulse"></div>
              <div className="h-10 w-full max-w-md bg-white/20 rounded-lg animate-pulse mb-3"></div>
              <div className="h-5 w-full max-w-2xl bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="h-20 w-64 bg-white/20 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
