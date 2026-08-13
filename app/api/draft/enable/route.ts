import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { sanityPreviewSecret } from '@/lib/sanity/env'
import { absoluteUrl } from '@/lib/site-config'

function getSafeRedirect(value: string | null) {
  if (!value || (!value.startsWith('/blog') && !value.startsWith('/explore')) || value.startsWith('//')) return '/blog'
  return value
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')
  const canPreviewWithoutSecret = process.env.NODE_ENV !== 'production' && !sanityPreviewSecret

  if (!canPreviewWithoutSecret && (!sanityPreviewSecret || secret !== sanityPreviewSecret)) {
    return NextResponse.json({ message: 'Invalid preview secret.' }, { status: 401 })
  }

  const redirectTo = getSafeRedirect(request.nextUrl.searchParams.get('slug'))
  const mode = await draftMode()
  mode.enable()

  return NextResponse.redirect(absoluteUrl(redirectTo))
}
