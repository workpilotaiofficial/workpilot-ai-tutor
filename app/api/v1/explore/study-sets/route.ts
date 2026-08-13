import { NextRequest, NextResponse } from 'next/server'
import { listPublicExplore } from '@/lib/explore/service'
export async function GET(request: NextRequest) { const p = request.nextUrl.searchParams; const response = await listPublicExplore({ subject: p.get('subject') ?? undefined, search: p.get('search') ?? undefined, cursor: p.get('cursor') ?? undefined, limit: p.get('limit') ? Number(p.get('limit')) : undefined }); return NextResponse.json(response) }
