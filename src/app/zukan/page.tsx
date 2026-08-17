import { prisma } from '@/lib/prisma'
import { TRADITIONAL_COLORS } from '@/lib/traditional-colors'
import ZukanGrid from '@/components/ZukanGrid'

export const dynamic = 'force-dynamic'

export default async function ZukanPage() {
  const colors = await prisma.collectedColor.findMany({
    orderBy: { capturedAt: 'desc' },
    select: {
      id: true,
      sampledHex: true,
      matchedName: true,
      matchedReading: true,
      matchedHex: true,
      latitude: true,
      longitude: true,
      locationName: true,
      elevation: true,
      note: true,
      genre: true,
      capturedAt: true,
    },
  })

  return (
    <ZukanGrid
      colors={colors.map((c) => ({
        id: c.id,
        sampledHex: c.sampledHex,
        matchedName: c.matchedName,
        matchedReading: c.matchedReading,
        matchedHex: c.matchedHex,
        latitude: c.latitude,
        longitude: c.longitude,
        locationName: c.locationName,
        elevation: c.elevation,
        note: c.note,
        genre: c.genre,
        capturedAt: c.capturedAt.toISOString(),
      }))}
      totalTraditional={TRADITIONAL_COLORS.length}
    />
  )
}
