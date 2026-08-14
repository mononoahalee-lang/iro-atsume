'use client'

import { useMemo, useState } from 'react'
import { TRADITIONAL_COLORS } from '@/lib/traditional-colors'

type Color = {
  id: string
  sampledHex: string
  matchedName: string
  matchedReading: string
  matchedHex: string
  thumbnail: string
  latitude: number | null
  longitude: number | null
  locationName: string | null
  capturedAt: string
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
  const collectedCount = useMemo(() => new Set(colors.map((c) => c.matchedName)).size, [colors])
  const progress = Math.min(1, collectedCount / totalTraditional)
  const selected = colors.find((c) => c.id === selectedId) ?? null

  async function onDelete(id: string) {
    setColors((prev) => prev.filter((c) => c.id !== id))
    setSelectedId(null)
    await fetch(`/api/colors/${id}`, { method: 'DELETE' }).catch(() => {})
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
            onClick={() => setSelectedId(c.id)}
            className="flex flex-col gap-2 text-left"
          >
            <div className="relative">
              <img src={c.thumbnail} alt={c.matchedName} className="w-full aspect-square object-cover" />
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
              <div className="text-xs" style={{ color: '#9C8F7A' }}>
                {new Date(c.capturedAt).toLocaleDateString('ja-JP', { dateStyle: 'medium' })}
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
            <img
              src={selected.thumbnail}
              alt={selected.matchedName}
              className="w-full aspect-square object-cover"
            />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full shrink-0" style={{ background: selected.matchedHex, border: '1px solid #DED4BF' }} />
              <div>
                <div className="text-xl tracking-wide" style={{ color: '#33291F' }}>
                  {selected.matchedName}
                </div>
                <div className="text-xs tracking-wide" style={{ color: '#6B5F4F' }}>
                  {selected.matchedReading} · {selected.matchedHex}
                </div>
              </div>
            </div>

            {TRIVIA_BY_NAME.get(selected.matchedName) && (
              <p className="text-sm leading-relaxed" style={{ color: '#33291F', borderTop: '1px solid #DED4BF', paddingTop: '1rem' }}>
                {TRIVIA_BY_NAME.get(selected.matchedName)}
              </p>
            )}

            <div className="flex flex-col gap-1 text-xs" style={{ color: '#6B5F4F', borderTop: '1px solid #DED4BF', paddingTop: '1rem' }}>
              <div>
                {new Date(selected.capturedAt).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
              {(selected.locationName || (selected.latitude != null && selected.longitude != null)) && (
                <div className="flex items-center gap-2">
                  {selected.locationName && <span>{selected.locationName}</span>}
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

            <div className="flex items-center justify-between mt-2">
              <button
                onClick={() => setSelectedId(null)}
                className="text-xs tracking-widest underline"
                style={{ color: '#6B5F4F' }}
              >
                閉じる
              </button>
              <button
                onClick={() => onDelete(selected.id)}
                className="text-xs tracking-widest underline"
                style={{ color: '#9C8F7A' }}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
