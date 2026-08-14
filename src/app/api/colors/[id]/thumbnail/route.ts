import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = await prisma.collectedColor.findUnique({
    where: { id },
    select: { thumbnail: true },
  })
  if (!record) return new NextResponse(null, { status: 404 })

  const match = record.thumbnail.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
  if (!match) return new NextResponse(null, { status: 404 })
  const [, contentType, base64] = match
  const buffer = Buffer.from(base64, 'base64')

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      // Thumbnails never change once saved — cache aggressively.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
