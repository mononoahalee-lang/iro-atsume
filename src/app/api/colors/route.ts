import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nearestTraditionalColor } from '@/lib/color-match'
import { reverseGeocode } from '@/lib/reverse-geocode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Guard against an accidental full-res image being sent instead of the resized thumbnail.
const MAX_THUMBNAIL_LENGTH = 200_000

export async function GET() {
  const colors = await prisma.collectedColor.findMany({
    orderBy: { capturedAt: 'desc' },
    select: {
      id: true,
      sampledHex: true,
      matchedName: true,
      matchedReading: true,
      matchedHex: true,
      distance: true,
      latitude: true,
      longitude: true,
      locationName: true,
      capturedAt: true,
    },
  })

  return NextResponse.json(
    colors.map((c) => ({
      ...c,
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

  const hasLocation = typeof latitude === 'number' && typeof longitude === 'number'

  const created = await prisma.collectedColor.create({
    data: {
      sampledHex,
      matchedName: match.name,
      matchedReading: match.reading,
      matchedHex: match.hex,
      distance: match.distance,
      thumbnail,
      latitude: hasLocation ? latitude : null,
      longitude: hasLocation ? longitude : null,
      locationName: null,
    },
  })

  // Reverse geocoding is a slow external call — don't make the user wait on it.
  // Fill in the place name in the background after the response is sent.
  if (hasLocation) {
    after(async () => {
      const locationName = await reverseGeocode(latitude, longitude)
      if (locationName) {
        await prisma.collectedColor.update({ where: { id: created.id }, data: { locationName } })
      }
    })
  }

  return NextResponse.json({
    id: created.id,
    sampledHex: created.sampledHex,
    matchedName: created.matchedName,
    matchedReading: created.matchedReading,
    matchedHex: created.matchedHex,
    distance: created.distance,
    latitude: created.latitude,
    longitude: created.longitude,
    locationName: created.locationName,
    capturedAt: created.capturedAt.toISOString(),
  })
}
