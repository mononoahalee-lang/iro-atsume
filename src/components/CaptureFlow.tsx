'use client'

import { useEffect, useRef, useState } from 'react'
import { nearestTraditionalColor, rgbToHex, type ColorMatch } from '@/lib/color-match'

const DISPLAY_MAX_SIDE = 1000
const THUMBNAIL_SIZE = 240

type Picked = {
  hex: string
  match: ColorMatch
  xCss: number
  yCss: number
}

type Stage = 'idle' | 'streaming' | 'captured'

export default function CaptureFlow() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const geoRef = useRef<{ latitude: number; longitude: number } | null>(null)

  const [stage, setStage] = useState<Stage>('idle')
  const [picked, setPicked] = useState<Picked | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

  useEffect(() => {
    if (stage === 'streaming' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [stage])

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function requestLocation() {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        geoRef.current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
      },
      () => {
        geoRef.current = null
      },
      { timeout: 5000 }
    )
  }

  async function startCamera() {
    setError(null)
    setPicked(null)
    setSaved(false)
    requestLocation()

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('このブラウザはカメラ機能に対応していません。')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setStage('streaming')
    } catch {
      setError('カメラを起動できませんでした。カメラへのアクセスを許可してください。')
    }
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return

    const scale = Math.min(1, DISPLAY_MAX_SIDE / Math.max(vw, vh))
    const w = Math.round(vw * scale)
    const h = Math.round(vh * scale)
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)

    stopStream()
    setStage('captured')
  }

  function onCanvasTap(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
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

    setPicked({ hex, match, xCss: e.clientX - rect.left, yCss: e.clientY - rect.top })
    setSaved(false)
  }

  async function onSave() {
    const canvas = canvasRef.current
    if (!picked || !canvas) return
    setSaving(true)
    setError(null)

    const side = Math.min(canvas.width, canvas.height)
    const sx = (canvas.width - side) / 2
    const sy = (canvas.height - side) / 2

    const thumbCanvas = document.createElement('canvas')
    thumbCanvas.width = THUMBNAIL_SIZE
    thumbCanvas.height = THUMBNAIL_SIZE
    const ctx = thumbCanvas.getContext('2d')
    if (!ctx) {
      setSaving(false)
      return
    }
    ctx.drawImage(canvas, sx, sy, side, side, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE)
    const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.6)

    try {
      const res = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampledHex: picked.hex,
          thumbnail,
          latitude: geoRef.current?.latitude ?? null,
          longitude: geoRef.current?.longitude ?? null,
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setSaved(true)
    } catch {
      setError('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    stopStream()
    setStage('idle')
    setPicked(null)
    setSaved(false)
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10 flex flex-col items-center gap-8">
      {stage === 'idle' && (
        <>
          <button
            onClick={startCamera}
            className="w-full py-24 text-sm tracking-widest transition-colors"
            style={{
              border: '1px solid #DED4BF',
              color: '#6B5F4F',
              background: '#F0EAD9',
            }}
          >
            撮影して色をさがす
          </button>
          {error && (
            <div className="text-xs text-center" style={{ color: '#a9432f' }}>
              {error}
            </div>
          )}
        </>
      )}

      {stage === 'streaming' && (
        <>
          <p className="text-xs tracking-widest" style={{ color: '#6B5F4F' }}>
            色を見つけたらシャッターを押してください
          </p>
          <div className="relative w-full">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-auto"
              style={{ border: '1px solid #DED4BF' }}
            />
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={reset}
              className="text-xs tracking-wide underline"
              style={{ color: '#6B5F4F' }}
            >
              キャンセル
            </button>
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full"
              style={{ background: '#B8714F', border: '3px solid #F7F3EC', boxShadow: '0 0 0 1px #DED4BF' }}
              aria-label="シャッター"
            />
          </div>
        </>
      )}

      {stage === 'captured' && (
        <>
          <p className="text-xs tracking-widest" style={{ color: '#6B5F4F' }}>
            気になる色をタップしてください
          </p>
          <div className="relative w-full">
            <canvas
              ref={canvasRef}
              onClick={onCanvasTap}
              className="w-full h-auto cursor-crosshair"
              style={{ border: '1px solid #DED4BF' }}
            />
            {picked && (
              <div
                className="absolute w-5 h-5 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{ left: picked.xCss, top: picked.yCss, border: '2px solid #F7F3EC', boxShadow: '0 0 0 1px #33291F' }}
              />
            )}
          </div>

          {picked && (
            <div className="w-full flex flex-col items-center gap-4 py-6" style={{ borderTop: '1px solid #DED4BF' }}>
              <div className="w-16 h-16 rounded-full" style={{ background: picked.match.hex, border: '1px solid #DED4BF' }} />
              <div className="text-center">
                <div className="text-xl tracking-wide" style={{ color: '#33291F' }}>
                  {picked.match.name}
                </div>
                <div className="text-xs mt-1 tracking-wide" style={{ color: '#6B5F4F' }}>
                  {picked.match.reading} · {picked.match.hex}
                </div>
              </div>
              {saved ? (
                <div className="text-xs tracking-widest" style={{ color: '#7C7A5E' }}>
                  図鑑に追加しました
                </div>
              ) : (
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="px-8 py-2.5 text-xs tracking-widest disabled:opacity-50"
                  style={{ background: '#B8714F', color: '#F7F3EC' }}
                >
                  {saving ? '保存中…' : '図鑑に追加'}
                </button>
              )}
              {error && (
                <div className="text-xs" style={{ color: '#a9432f' }}>
                  {error}
                </div>
              )}
            </div>
          )}

          <button
            onClick={reset}
            className="text-xs tracking-wide underline"
            style={{ color: '#6B5F4F' }}
          >
            別の写真を撮る
          </button>
        </>
      )}
    </div>
  )
}
