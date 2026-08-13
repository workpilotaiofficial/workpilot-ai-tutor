import { NextRequest, NextResponse } from 'next/server'

import { listExploreStudySets } from '@/lib/explore-study-sets'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subject = searchParams.get('subject')
  const search = searchParams.get('search')
  const cursor = searchParams.get('cursor')
  const limitValue = searchParams.get('limit')
  const limit = limitValue ? Number.parseInt(limitValue, 10) : undefined

  const response = listExploreStudySets({
    subject,
    search,
    cursor,
    limit,
  })

  return NextResponse.json(response)
}
