import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'
import { sanityExploreWebhookSecret } from '@/lib/sanity/env'

export async function POST(request: Request) { if (!sanityExploreWebhookSecret) return NextResponse.json({ message: 'Webhook is not configured.' }, { status: 503 }); const body = await request.text(); const supplied = request.headers.get('sanity-webhook-signature') ?? request.headers.get('x-sanity-signature') ?? ''; const expected = createHmac('sha256', sanityExploreWebhookSecret).update(body).digest('hex'); const a = Buffer.from(supplied.replace(/^sha256=/, ''), 'hex'); const b = Buffer.from(expected, 'hex'); if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ message: 'Invalid signature.' }, { status: 401 }); let slug: string | undefined; try { const parsed = JSON.parse(body); slug = parsed?.slug?.current ?? parsed?.slug } catch {} revalidateTag('explore', 'max'); revalidatePath('/explore'); if (slug && /^[a-z0-9-]+$/i.test(slug)) revalidatePath(`/explore/${slug}`); return NextResponse.json({ revalidated: true }) }
