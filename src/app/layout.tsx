import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import './globals.css'

export const metadata: Metadata = {
  title: '色集め',
  description: '街で見つけた色を撮って、日本の伝統色として集める図鑑アプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '色集め',
  },
}

export const viewport: Viewport = {
  themeColor: '#F7F3EC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full" style={{ backgroundColor: '#F7F3EC' }}>
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: '#F7F3EC', color: '#33291F', fontFamily: 'var(--font-heading)' }}
      >
        <header
          className="sticky top-0 z-50 border-b"
          style={{
            backgroundColor: 'rgba(247,243,236,0.92)',
            borderColor: '#DED4BF',
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
            <Link href="/" className="flex items-center gap-2">
              <span
                className="text-base tracking-widest"
                style={{ color: '#33291F', fontWeight: 500 }}
              >
                色 集 め
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="transition-colors" style={{ color: '#6B5F4F' }}>
                撮影
              </Link>
              <Link href="/zukan" className="transition-colors" style={{ color: '#6B5F4F' }}>
                図鑑
              </Link>
            </nav>
          </div>
        </header>
        <ServiceWorkerRegister />
        <main className="flex-1" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
