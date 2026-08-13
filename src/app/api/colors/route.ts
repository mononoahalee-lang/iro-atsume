import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nearestTraditionalColor } from '@/lib/color-match'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Guard against an accidental full-res image being sent instead of the resized thumbnail.
const MAX_THUMBNAIL_LENGTH = 200_000

export async function GET() {
  const colors = await prisma.collectedColor.findMany({
    orderBy: { capturedAt: 'desc' },
  })

  return NextResponse.json(
    colors.map((c) => ({
      id: c.id,
      sampledHex: c.sampledHex,
      matchedName: c.matchedName,
      matchedReading: c.matchedReading,
      matchedHex: c.matchedHex,
      distance: c.distance,
      thumbnail: c.thumbnail,
      latitude: c.latitude,
      longitude: c.longitude,
      capturedAt: c.capturedAt.toISOString(),
    }))
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sampledHex, thumbnail, latitude, longitude } = body

  if (typeof sampledHex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(sampledHex)) {
    return NextResponse.json({ error: 'Invalid sampledHex' }, { status: 400 })
  }
  if (typeof thumbnail !== 'string' || thumbnail.length === 0) {
    return NextResponse.json({ error: 'Missing thumbnail' }, { status: 400 })
  }
  if (thumbnail.length > MAX_THUMBNAIL_LENGTH) {
    return NextResponse.json({ error: 'Thumbnail too large' }, { status: 400 })
  }

  const match = nearestTraditionalColor(sampledHex)

  const created = await prisma.collectedColor.create({
    data: {
      sampledHex,
      matchedName: match.name,
      matchedReading: match.reading,
      matchedHex: match.hex,
      distance: match.distance,
      thumbnail,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
    },
  })

  return NextResponse.json({
    id: created.id,
    sampledHex: created.sampledHex,
    matchedName: created.matchedName,
    matchedReading: created.matchedReading,
    matchedHex: created.matchedHex,
    distance: created.distance,
    thumbnail: created.thumbnail,
    latitude: created.latitude,
    longitude: created.longitude,
    capturedAt: created.capturedAt.toISOString(),
  })
}
