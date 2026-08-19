'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { TRADITIONAL_COLORS } from '@/lib/traditional-colors'
import { GENRES } from '@/lib/genres'
import { nearestTraditionalColor, rgbToHex, type ColorMatch } from '@/lib/color-match'

type Color = {
  id: string
  sampledHex: string
  matchedName: string
  matchedReading: string
  matchedHex: string
  latitude: number | null
  longitude: number | null
  locationName: string | null
  elevation: number | null
  note: string | null
  genre: string | null
  markerX: number | null
  markerY: number | null
  capturedAt: string
}

type Repick = {
  hex: string
  match: ColorMatch
  xRel: number
  yRel: number
}

function thumbnailUrl(id: string) {
  return `/api/colors/${id}/thumbnail`
}

function ColorMarker({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute w-4 h-4 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        border: '2px solid #F7F3EC',
        boxShadow: '0 0 0 1px #33291F',
      }}
    />
  )
}

const TRIVIA_BY_NAME = new Map(TRADITIONAL_COLORS.map((c) => [c.name, c.trivia]))

export default function ZukanGrid({
  colors: initialColors,
  totalTraditional,
}: {
  colors: Color[]
  totalTraditional: number
}) {
  const [colors, setColors] = useState(initialColors)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editNote, setEditNote] = useState('')
  const [editGenre, setEditGenre] = useState<string | null>(null)
  const [repick, setRepick] = useState<Repick | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const repickCanvasRef = useRef<HTMLCanvasElement>(null)

  const collectedCount = useMemo(() => new Set(colors.map((c) => c.matchedName)).size, [colors])
  const progress = Math.min(1, collectedCount / totalTraditional)
  const selected = colors.find((c) => c.id === selectedId) ?? null

  // Load the saved thumbnail into the (always-mounted, initially hidden) canvas
  // whenever a different entry is opened, so it's ready to sample from the
  // instant edit mode is entered.
  useEffect(() => {
    if (!selectedId) return
    const canvas = repickCanvasRef.current
    if (!canvas) return
    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (cancelled) return
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')?.drawImage(img, 0, 0)
    }
    img.src = thumbnailUrl(selectedId)
    return () => {
      cancelled = true
    }
  }, [selectedId])

  function openDetail(id: string) {
    setSelectedId(id)
    setIsEditing(false)
    setRepick(null)
  }

  function startEdit(c: Color) {
    setEditNote(c.note ?? '')
    setEditGenre(c.genre)
    setRepick(null)
    setIsEditing(true)
  }

  async function onDelete(id: string) {
    setColors((prev) => prev.filter((c) => c.id !== id))
    setSelectedId(null)
    await fetch(`/api/colors/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  function onRepickTap(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = repickCanvasRef.current
    if (!canvas || !canvas.width) return
    const rect = canvas.getBoundingClientRect()
    const ratioX = canvas.width / rect.width
    const ratioY = canvas.height / rect.height
    const x = Math.round((e.clientX - rect.left) * ratioX)
    const y = Math.round((e.clientY - rect.top) * ratioY)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const sampleSize = 3
    const half = Math.floor(sampleSize / 2)
    const sx = Math.max(0, Math.min(canvas.width - sampleSize, x - half))
    const sy = Math.max(0, Math.min(canvas.height - sampleSize, y - half))
    const data = ctx.getImageData(sx, sy, sampleSize, sampleSize).data

    let r = 0, g = 0, b = 0
    const count = data.length / 4
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
    }
    const hex = rgbToHex(r / count, g / count, b / count)
    const match = nearestTraditionalColor(hex)
    setRepick({ hex, match, xRel: x / canvas.width, yRel: y / canvas.height })
  }

  async function onSaveEdit() {
    if (!selected) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/colors/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: editNote.trim() || null,
          genre: editGenre,
          ...(repick ? { sampledHex: repick.hex, markerX: repick.xRel, markerY: repick.yRel } : {}),
        }),
      })
      if (!res.ok) throw new Error('update failed')
      const updated = await res.json()
      setColors((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? {
                ...c,
                note: editNote.trim() || null,
                genre: editGenre,
                ...(repick
                  ? {
                      sampledHex: updated.sampledHex,
                      matchedName: updated.matchedName,
                      matchedReading: updated.matchedReading,
                      matchedHex: updated.matchedHex,
                      markerX: updated.markerX,
                      markerY: updated.markerY,
                    }
                  : {}),
              }
            : c
        )
      )
      setIsEditing(false)
      setRepick(null)
    } catch {
      // Leave edit mode open so the user can retry.
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 flex flex-col gap-10">
      <div className="flex flex-col items-center gap-3">
        <div className="text-xs tracking-widest" style={{ color: '#6B5F4F' }}>
          {collectedCount} / {totalTraditional} 集めました
        </div>
        <div className="w-full max-w-xs h-px" style={{ background: '#DED4BF' }}>
          <div className="h-px" style={{ width: `${progress * 100}%`, background: '#B8714F' }} />
        </div>
      </div>

      {colors.length === 0 && (
        <p className="text-center text-sm py-12" style={{ color: '#6B5F4F' }}>
          まだ色が集まっていません。撮影して見つけましょう。
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
        {colors.map((c) => (
          <button
            key={c.id}
            onClick={() => openDetail(c.id)}
            className="flex flex-col gap-2 text-left"
          >
            <div className="relative">
              <img
                src={thumbnailUrl(c.id)}
                alt={c.matchedName}
                loading="lazy"
                className="w-full aspect-square object-cover"
              />
              {c.markerX != null && c.markerY != null && <ColorMarker x={c.markerX} y={c.markerY} />}
              <div
                className="absolute bottom-2 right-2 w-5 h-5 rounded-full"
                style={{ background: c.matchedHex, border: '1px solid #F7F3EC' }}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="text-sm tracking-wide" style={{ color: '#33291F' }}>{c.matchedName}</div>
              <div className="text-xs" style={{ color: '#6B5F4F' }}>
                {c.matchedReading}
              </div>
              <div className="text-xs flex items-center gap-1" style={{ color: '#9C8F7A' }}>
                <span>{new Date(c.capturedAt).toLocaleDateString('ja-JP', { dateStyle: 'medium' })}</span>
                {c.genre && <span>· {c.genre}</span>}
                {(c.locationName || (c.latitude != null && c.longitude != null)) && <span>📍</span>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(51,41,31,0.4)' }}
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full sm:max-w-sm max-h-[85vh] overflow-y-auto flex flex-col gap-4 p-6"
            style={{ background: '#F7F3EC', border: '1px solid #DED4BF' }}
            onClick={(e) => e.stopPropagation()}
          >
            {!isEditing && (
              <div className="relative">
                <img
                  src={thumbnailUrl(selected.id)}
                  alt={selected.matchedName}
                  className="w-full aspect-square object-cover"
                />
                {selected.markerX != null && selected.markerY != null && (
                  <ColorMarker x={selected.markerX} y={selected.markerY} />
                )}
              </div>
            )}

            {/* Always mounted (see the loading effect above) so it's pre-drawn the
                moment edit mode opens; hidden via CSS rather than unmounted. */}
            <div className="relative" style={{ display: isEditing ? 'block' : 'none' }}>
              <canvas
                ref={repickCanvasRef}
                onClick={onRepickTap}
                className="w-full h-auto cursor-crosshair"
                style={{ border: '1px solid #DED4BF' }}
              />
              {repick ? (
                <ColorMarker x={repick.xRel} y={repick.yRel} />
              ) : (
                selected.markerX != null &&
                selected.markerY != null && <ColorMarker x={selected.markerX} y={selected.markerY} />
              )}
            </div>
            {isEditing && (
              <p className="text-xs tracking-wide text-center" style={{ color: '#9C8F7A' }}>
                写真をタップすると採取する色を変更できます
              </p>
            )}

            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full shrink-0"
                style={{ background: repick ? repick.match.hex : selected.matchedHex, border: '1px solid #DED4BF' }}
              />
              <div>
                <div className="text-xl tracking-wide" style={{ color: '#33291F' }}>
                  {repick ? repick.match.name : selected.matchedName}
                </div>
                <div className="text-xs tracking-wide" style={{ color: '#6B5F4F' }}>
                  {repick ? repick.match.reading : selected.matchedReading} ·{' '}
                  {repick ? repick.match.hex : selected.matchedHex}
                </div>
              </div>
            </div>

            {!isEditing && TRIVIA_BY_NAME.get(selected.matchedName) && (
              <p className="text-sm leading-relaxed" style={{ color: '#33291F', borderTop: '1px solid #DED4BF', paddingTop: '1rem' }}>
                {TRIVIA_BY_NAME.get(selected.matchedName)}
              </p>
            )}

            {!isEditing && selected.note && (
              <p className="text-sm leading-relaxed" style={{ color: '#33291F', borderTop: '1px solid #DED4BF', paddingTop: '1rem' }}>
                {selected.note}
              </p>
            )}

            {!isEditing && (
              <div className="flex flex-col gap-1 text-xs" style={{ color: '#6B5F4F', borderTop: '1px solid #DED4BF', paddingTop: '1rem' }}>
                <div>
                  {new Date(selected.capturedAt).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })}
                  {selected.genre && ` · ${selected.genre}`}
                </div>
                {(selected.locationName || (selected.latitude != null && selected.longitude != null) || selected.elevation != null) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {selected.locationName && <span>{selected.locationName}</span>}
                    {selected.elevation != null && <span>標高 {Math.round(selected.elevation)}m</span>}
                    {selected.latitude != null && selected.longitude != null && (
                      <a
                        href={`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        style={{ color: '#7C7A5E' }}
                      >
                        地図で見る
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {isEditing && (
              <div
                className="w-full flex flex-col gap-3"
                style={{ borderTop: '1px solid #DED4BF', paddingTop: '1rem' }}
              >
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setEditGenre(editGenre === g ? null : g)}
                      className="px-3 py-1 text-xs tracking-wide"
                      style={{
                        border: '1px solid #DED4BF',
                        background: editGenre === g ? '#B8714F' : 'transparent',
                        color: editGenre === g ? '#F7F3EC' : '#6B5F4F',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="メモ(任意)"
                  maxLength={200}
                  className="w-full px-3 py-2 text-sm"
                  style={{ border: '1px solid #DED4BF', background: '#FFFFFF', color: '#33291F' }}
                />
              </div>
            )}

            <div className="flex items-center justify-between mt-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setRepick(null)
                    }}
                    className="text-xs tracking-widest underline"
                    style={{ color: '#6B5F4F' }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={onSaveEdit}
                    disabled={savingEdit}
                    className="px-6 py-2 text-xs tracking-widest disabled:opacity-50"
                    style={{ background: '#B8714F', color: '#F7F3EC' }}
                  >
                    {savingEdit ? '保存中…' : '保存'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-xs tracking-widest underline"
                    style={{ color: '#6B5F4F' }}
                  >
                    閉じる
                  </button>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => startEdit(selected)}
                      className="text-xs tracking-widest underline"
                      style={{ color: '#7C7A5E' }}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => onDelete(selected.id)}
                      className="text-xs tracking-widest underline"
                      style={{ color: '#9C8F7A' }}
                    >
                      削除
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
