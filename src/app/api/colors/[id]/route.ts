import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GENRES } from '@/lib/genres'
import { nearestTraditionalColor } from '@/lib/color-match'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_NOTE_LENGTH = 200

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { note, genre, sampledHex, markerX, markerY } = body

  if (note !== undefined && note !== null && (typeof note !== 'string' || note.length > MAX_NOTE_LENGTH)) {
    return NextResponse.json({ error: 'Invalid note' }, { status: 400 })
  }
  if (genre !== undefined && genre !== null && !GENRES.includes(genre)) {
    return NextResponse.json({ error: 'Invalid genre' }, { status: 400 })
  }
  if (sampledHex !== undefined && !/^#[0-9a-fA-F]{6}$/.test(sampledHex)) {
    return NextResponse.json({ error: 'Invalid sampledHex' }, { status: 400 })
  }

  const data: {
    note?: string | null
    genre?: string | null
    sampledHex?: string
    matchedName?: string
    matchedReading?: string
    matchedHex?: string
    distance?: number
    markerX?: number | null
    markerY?: number | null
  } = {}
  if (note !== undefined) data.note = note || null
  if (genre !== undefined) data.genre = genre || null

  if (sampledHex !== undefined) {
    const match = nearestTraditionalColor(sampledHex)
    data.sampledHex = sampledHex
    data.matchedName = match.name
    data.matchedReading = match.reading
    data.matchedHex = match.hex
    data.distance = match.distance
  }
  if (typeof markerX === 'number' && typeof markerY === 'number') {
    data.markerX = markerX
    data.markerY = markerY
  }

  const updated = await prisma.collectedColor.update({ where: { id }, data })

  return NextResponse.json({
    id: updated.id,
    sampledHex: updated.sampledHex,
    matchedName: updated.matchedName,
    matchedReading: updated.matchedReading,
    matchedHex: updated.matchedHex,
    distance: updated.distance,
    note: updated.note,
    genre: updated.genre,
    markerX: updated.markerX,
    markerY: updated.markerY,
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.collectedColor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
