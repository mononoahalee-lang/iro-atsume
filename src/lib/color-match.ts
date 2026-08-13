import { TRADITIONAL_COLORS, type TraditionalColor } from './traditional-colors'

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// "redmean" weighted Euclidean distance — https://www.compuphase.com/cmetric.htm
// A cheap, dependency-free approximation of perceptual color difference.
export function colorDistance(hexA: string, hexB: string): number {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  const rMean = (r1 + r2) / 2
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db)
}

export type ColorMatch = TraditionalColor & { distance: number }

export function nearestTraditionalColor(hex: string): ColorMatch {
  let best: ColorMatch | undefined
  for (const c of TRADITIONAL_COLORS) {
    const d = colorDistance(hex, c.hex)
    if (!best || d < best.distance) best = { ...c, distance: d }
  }
  return best!
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}
