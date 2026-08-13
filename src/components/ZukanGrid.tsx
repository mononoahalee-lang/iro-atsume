'use client'

import { useMemo, useState } from 'react'

type Color = {
  id: string
  sampledHex: string
  matchedName: string
  matchedReading: string
  matchedHex: string
  thumbnail: string
  latitude: number | null
  longitude: number | null
  capturedAt: string
}

export default function ZukanGrid({
  colors: initialColors,
  totalTraditional,
}: {
  colors: Color[]
  totalTraditional: number
}) {
  const [colors, setColors] = useState(initialColors)
  const collectedCount = useMemo(() => new Set(colors.map((c) => c.matchedName)).size, [colors])
  const progress = Math.min(1, collectedCount / totalTraditional)

  async function onDelete(id: string) {
    setColors((prev) => prev.filter((c) => c.id !== id))
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
          <div key={c.id} className="flex flex-col gap-2">
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
                {new Date(c.capturedAt).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
              <div className="flex items-center justify-between mt-1">
                {c.latitude != null && c.longitude != null ? (
                  <a
                    href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline"
                    style={{ color: '#7C7A5E' }}
                  >
                    地図で見る
                  </a>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => onDelete(c.id)}
                  className="text-xs underline"
                  style={{ color: '#9C8F7A' }}
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
