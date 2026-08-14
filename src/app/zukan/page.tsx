import { prisma } from '@/lib/prisma'
import { TRADITIONAL_COLORS } from '@/lib/traditional-colors'
import ZukanGrid from '@/components/ZukanGrid'

export const dynamic = 'force-dynamic'

export default async function ZukanPage() {
  const colors = await prisma.collectedColor.findMany({
    orderBy: { capturedAt: 'desc' },
  })

  return (
    <ZukanGrid
      colors={colors.map((c) => ({
        id: c.id,
        sampledHex: c.sampledHex,
        matchedName: c.matchedName,
        matchedReading: c.matchedReading,
        matchedHex: c.matchedHex,
        thumbnail: c.thumbnail,
        latitude: c.latitude,
        longitude: c.longitude,
        locationName: c.locationName,
        capturedAt: c.capturedAt.toISOString(),
      }))}
      totalTraditional={TRADITIONAL_COLORS.length}
    />
  )
}
