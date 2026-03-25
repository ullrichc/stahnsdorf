import 'leaflet/dist/leaflet.css'
import '@/styles/globals.css'
import { Metadata, Viewport } from 'next'
import BottomNav from '@/components/BottomNav'

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
    <html lang="de" suppressHydrationWarning>
      <body>
        <main style={{ paddingBottom: 'var(--nav-height)' }}>{children}</main>
        <BottomNav />
      </body>
    </html>
  )
}
