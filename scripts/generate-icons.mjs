// One-time script to generate PWA manifest icons (public/icons/icon-192.png, icon-512.png).
// Run with: npm run icons
// Uses next/og's ImageResponse (bundled with next, no extra dependency) from plain Node.
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const { ImageResponse } = await import('next/og.js')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'icons')
await mkdir(outDir, { recursive: true })

const PAPER = '#F7F3EC'
const CLAY = '#B8714F'
const INK = '#33291F'

async function generate(size) {
  const img = new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: PAPER,
          border: `${Math.max(2, Math.round(size * 0.02))}px solid ${CLAY}`,
        },
        children: {
          type: 'div',
          props: {
            style: {
              fontSize: Math.round(size * 0.5),
              color: INK,
              fontWeight: 500,
              display: 'flex',
            },
            children: '色',
          },
        },
      },
    },
    { width: size, height: size }
  )
  const buf = Buffer.from(await img.arrayBuffer())
  const file = path.join(outDir, `icon-${size}.png`)
  await writeFile(file, buf)
  console.log('wrote', file)
}

await generate(192)
await generate(512)
