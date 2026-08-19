import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GENRES } from '@/lib/genres'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_NOTE_LENGTH = 200

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { note, genre } = body

  if (note !== undefined && note !== null && (typeof note !== 'string' || note.length > MAX_NOTE_LENGTH)) {
    return NextResponse.json({ error: 'Invalid note' }, { status: 400 })
  }
  if (genre !== undefined && genre !== null && !GENRES.includes(genre)) {
    return NextResponse.json({ error: 'Invalid genre' }, { status: 400 })
  }

  const data: { note?: string | null; genre?: string | null } = {}
  if (note !== undefined) data.note = note || null
  if (genre !== undefined) data.genre = genre || null

  const updated = await prisma.collectedColor.update({ where: { id }, data })

  return NextResponse.json({
    id: updated.id,
    note: updated.note,
    genre: updated.genre,
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
