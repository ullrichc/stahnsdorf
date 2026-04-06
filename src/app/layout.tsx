import 'leaflet/dist/leaflet.css'
import '@/styles/globals.css'
import { Metadata, Viewport } from 'next'
import BottomNav from '@/components/BottomNav'
import { LocaleProvider } from '@/lib/LocaleContext'
import { Manrope, Newsreader } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Südwestkirchhof Stahnsdorf',
  description: 'Besucherführer für den Südwestkirchhof Stahnsdorf',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className={`${manrope.variable} ${newsreader.variable}`}>
      <head>
        {/* Material Symbols Outlined — thin weight for aesthetic */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          <main style={{ paddingBottom: 'var(--nav-height)' }}>{children}</main>
          <BottomNav />
        </LocaleProvider>
      </body>
    </html>
  )
}
