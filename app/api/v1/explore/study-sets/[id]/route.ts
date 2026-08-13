import { NextResponse } from 'next/server'
import { getPublicExploreGuide } from '@/lib/explore/service'
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const guide = await getPublicExploreGuide(id); return guide ? NextResponse.json(guide) : NextResponse.json({ message: 'Explore guide not found.' }, { status: 404 }) }
