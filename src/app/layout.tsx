import '@/styles/globals.css'
import { Metadata, Viewport } from 'next'

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
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
