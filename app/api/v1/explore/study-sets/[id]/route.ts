import { NextResponse } from 'next/server'

import {
  getExploreStudySetById,
} from '@/lib/explore-study-sets'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params
  const response = getExploreStudySetById(id)

  if (!response) {
    return NextResponse.json(
      {
        message: 'Explore study set not found.',
      },
      { status: 404 },
    )
  }

  return NextResponse.json(response)
}
