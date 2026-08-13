import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { absoluteUrl } from '@/lib/site-config'

export async function GET(request: NextRequest) {
  const mode = await draftMode()
  mode.disable()
  const redirectTo = request.nextUrl.searchParams.get('slug')
  const safeRedirect = redirectTo && (redirectTo.startsWith('/blog') || redirectTo.startsWith('/explore')) && !redirectTo.startsWith('//') ? redirectTo : '/blog'
  return NextResponse.redirect(absoluteUrl(safeRedirect))
}
