import 'leaflet/dist/leaflet.css'
import '@/styles/globals.css'
import { Metadata, Viewport } from 'next'
import BottomNav from '@/components/BottomNav'
import { LocaleProvider } from '@/lib/LocaleContext'
import { ActiveDialogProvider } from '@/lib/ActiveDialogContext'
import BookmarkHint from '@/components/BookmarkHint'

export const metadata: Metadata = {
  title: 'Südwestkirchhof Stahnsdorf',
  description: 'Besucherführer für den Südwestkirchhof Stahnsdorf',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <LocaleProvider>
          <ActiveDialogProvider>
            <main className="app-main">{children}</main>
            <BookmarkHint />
            <BottomNav />
          </ActiveDialogProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
