# Cemetery Visitor App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile web app that helps visitors explore the Südwestkirchhof Stahnsdorf with an interactive map, curated walking tours, and multimedia POI content.

**Architecture:** Next.js App Router with static export. Leaflet + OpenStreetMap for the map. Content stored in JSON files, structured for i18n (German at launch). Components are client-side React with dynamic imports for Leaflet (no SSR for map).

**Tech Stack:** Next.js 14, TypeScript, Leaflet, react-leaflet, CSS Modules

**Spec:** `docs/superpowers/specs/2026-03-24-cemetery-visitor-app-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `data/pois.json` | POI content data |
| `data/tours.json` | Tour content data |
| `src/lib/types.ts` | TypeScript types for POI, Tour, LocalizedString |
| `src/lib/content.ts` | Functions to load and query POIs and tours from JSON |
| `src/lib/i18n.ts` | Locale helper — returns string for current locale from `{ de: "..." }` objects |
| `src/lib/geo.ts` | Distance calculation between two coordinates (Haversine) |
| `src/components/BottomNav.tsx` | Bottom tab bar (Map / Tours / Info) |
| `src/components/MapView.tsx` | Leaflet map with markers, GPS locate, click handlers |
| `src/components/MapMarker.tsx` | Custom marker icons per POI type |
| `src/components/POICard.tsx` | Slide-up summary card when marker is tapped |
| `src/components/AudioPlayer.tsx` | Play/pause/seek for audio narration |
| `src/components/TourList.tsx` | Tour cards with name, duration, distance |
| `src/components/TourPlayer.tsx` | Active tour panel: current stop, transition, next/prev |
| `src/app/layout.tsx` | Root layout with BottomNav, viewport meta, global styles |
| `src/app/page.tsx` | Map view (landing page) |
| `src/app/tours/page.tsx` | Tours listing page |
| `src/app/tour/[id]/page.tsx` | Active tour page |
| `src/app/poi/[id]/page.tsx` | POI detail page |
| `src/app/info/page.tsx` | Info page (hours, directions, about) |
| `src/styles/globals.css` | Global styles, CSS variables for color palette |

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `.gitignore` (update), `src/app/layout.tsx`, `src/app/page.tsx`, `src/styles/globals.css`

- [ ] **Step 1: Initialize Next.js project**
```bash
npx create-next-app@latest . --typescript --app --src-dir --no-tailwind --no-eslint --import-alias "@/*"
```
Accept overwriting existing files. This creates the Next.js boilerplate.

- [ ] **Step 2: Configure next.config.js for static export**
Set `output: 'export'` in `next.config.js`. This lets us deploy as static files.

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
}
module.exports = nextConfig
```

- [ ] **Step 3: Set up global CSS with cemetery color palette**
Replace `src/styles/globals.css` with:
```css
:root {
  --color-bg: #f5f0eb;
  --color-surface: #ffffff;
  --color-text: #2c2c2c;
  --color-text-muted: #6b6b6b;
  --color-primary: #5a7247;
  --color-primary-dark: #3d5230;
  --color-accent: #8b7355;
  --color-border: #d4cdc4;
  --color-shadow: rgba(0, 0, 0, 0.1);
  --nav-height: 56px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: Set up root layout**
Replace `src/app/layout.tsx`:
```tsx
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
```

- [ ] **Step 5: Create placeholder landing page**
Replace `src/app/page.tsx`:
```tsx
export default function MapPage() {
  return <div>Südwestkirchhof Stahnsdorf — Karte</div>
}
```

- [ ] **Step 6: Verify the app runs**
```bash
npm run dev
```
Expected: App starts on localhost:3000, shows the placeholder text.

- [ ] **Step 7: Commit**
```bash
git add -A
git commit -m "feat: scaffold Next.js project with static export config"
```

---

## Task 2: TypeScript Types & Content Layer

**Files:**
- Create: `src/lib/types.ts`, `src/lib/content.ts`, `src/lib/i18n.ts`, `src/lib/geo.ts`
- Create: `data/pois.json`, `data/tours.json`

- [ ] **Step 1: Define TypeScript types**
Create `src/lib/types.ts`:
```ts
export type LocalizedString = {
  de: string
  en?: string
}

export type POIType = 'grave' | 'building' | 'landmark' | 'nature'

export type POI = {
  id: string
  type: POIType
  name: LocalizedString
  coordinates: [number, number] // [lat, lng]
  summary: LocalizedString
  description: LocalizedString
  dates?: { born?: string; died?: string }
  images: string[]
  audio?: LocalizedString
  tags: string[]
}

export type TourStop = {
  poiId: string
  order: number
  transition: LocalizedString
}

export type Tour = {
  id: string
  name: LocalizedString
  description: LocalizedString
  duration: string
  distance: string
  stops: TourStop[]
}
```

- [ ] **Step 2: Create i18n helper**
Create `src/lib/i18n.ts`:
```ts
import { LocalizedString } from './types'

const DEFAULT_LOCALE = 'de'

export function t(str: LocalizedString, locale: string = DEFAULT_LOCALE): string {
  return str[locale as keyof LocalizedString] || str.de
}
```

- [ ] **Step 3: Create geo helper**
Create `src/lib/geo.ts`:
```ts
/** Haversine distance between two [lat, lng] points in meters */
export function distanceMeters(
  a: [number, number],
  b: [number, number]
): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Format distance for display: "120 m" or "1,2 km" */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}
```

- [ ] **Step 4: Create content loading functions**
Create `src/lib/content.ts`:
```ts
import { POI, Tour } from './types'
import poisData from '../../data/pois.json'
import toursData from '../../data/tours.json'

const pois: POI[] = poisData as POI[]
const tours: Tour[] = toursData as Tour[]

export function getAllPOIs(): POI[] {
  return pois
}

export function getPOIById(id: string): POI | undefined {
  return pois.find((p) => p.id === id)
}

export function getAllTours(): Tour[] {
  return tours
}

export function getTourById(id: string): Tour | undefined {
  return tours.find((t) => t.id === id)
}
```

- [ ] **Step 5: Create sample POI data**
Create `data/pois.json` with 6 sample POIs:
- Heinrich Zille (grave, artist)
- Lovis Corinth (grave, artist)
- Engelbert Humperdinck (grave, composer)
- Hauptkapelle (building)
- Friedhofseingang / cemetery entrance (landmark)
- Waldcharakter / woodland area (nature)

Use realistic coordinates within the Südwestkirchhof area (~52.391, ~13.205). Write German summaries and descriptions (3-5 sentences each). Use placeholder image filenames.

- [ ] **Step 6: Create sample tour data**
Create `data/tours.json` with 2 tours:
- "Highlights-Tour": 4 stops, ~30 min, ~1.2 km
- "Berühmte Künstler": 3 stops (the artists/composers), ~45 min, ~0.8 km

Each stop references a POI id from pois.json and includes German transition text.

- [ ] **Step 7: Verify TypeScript compiles**
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 8: Commit**
```bash
git add data/ src/lib/
git commit -m "feat: add types, content layer, i18n helper, and sample data"
```

---

## Task 3: Bottom Navigation

**Files:**
- Create: `src/components/BottomNav.tsx`, `src/components/BottomNav.module.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create BottomNav component**
Create `src/components/BottomNav.tsx`:
```tsx
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './BottomNav.module.css'

const tabs = [
  { href: '/', label: 'Karte', icon: '📍' },
  { href: '/tours', label: 'Touren', icon: '🚶' },
  { href: '/info', label: 'Info', icon: 'ℹ️' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`${styles.tab} ${pathname === tab.href ? styles.active : ''}`}
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Style BottomNav**
Create `src/components/BottomNav.module.css`:
```css
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: var(--color-text-muted);
  font-size: 0.7rem;
  gap: 2px;
  padding: 4px 16px;
}

.tab.active {
  color: var(--color-primary);
}

.icon {
  font-size: 1.25rem;
}

.label {
  font-weight: 500;
}
```

- [ ] **Step 3: Add BottomNav to root layout**
Update `src/app/layout.tsx` to import and render `<BottomNav />` inside `<body>`, after `{children}`. Wrap children in a `<main>` with `padding-bottom: var(--nav-height)`.

- [ ] **Step 4: Verify navigation renders**
```bash
npm run dev
```
Expected: Bottom tab bar visible at the bottom of the page with three tabs.

- [ ] **Step 5: Commit**
```bash
git add src/components/BottomNav* src/app/layout.tsx
git commit -m "feat: add bottom navigation bar"
```

---

## Task 4: Interactive Map with POI Markers

**Files:**
- Create: `src/components/MapView.tsx`, `src/components/MapView.module.css`
- Create: `src/components/MapMarker.tsx`
- Create: `src/components/POICard.tsx`, `src/components/POICard.module.css`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Install Leaflet dependencies**
```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

- [ ] **Step 2: Create MapMarker utility**
Create `src/components/MapMarker.tsx`:
```tsx
import L from 'leaflet'
import { POIType } from '@/lib/types'

const markerIcons: Record<POIType, string> = {
  grave: '🪦',
  building: '⛪',
  landmark: '📌',
  nature: '🌳',
}

export function createMarkerIcon(type: POIType): L.DivIcon {
  return L.divIcon({
    html: `<span style="font-size:1.5rem">${markerIcons[type]}</span>`,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}
```

- [ ] **Step 3: Create POICard component**
Create `src/components/POICard.tsx` — a slide-up bottom sheet showing POI summary. Props: `poi: POI | null`, `onClose`, `onDetail`. Shows name, type badge, summary text, and a "Mehr erfahren" button. Slides up from bottom with CSS transform transition.

Create `src/components/POICard.module.css` with styles for the card: fixed to bottom, white background, rounded top corners, shadow, padding, slide animation.

- [ ] **Step 4: Create MapView component**
Create `src/components/MapView.tsx` — a `'use client'` component that:
1. Renders a full-screen Leaflet map centered on the cemetery (~52.3915, ~13.2050, zoom 16)
2. Loads all POIs via `getAllPOIs()` and renders markers using `createMarkerIcon()`
3. On marker click, sets the selected POI to show `POICard`
4. Includes a "locate me" button that calls `map.locate()` and adds a blue circle marker
5. Handles geolocation errors gracefully (shows nothing if denied)

Create `src/components/MapView.module.css` with styles: map fills viewport minus nav height, locate button positioned top-right.

Important: Use `dynamic(() => import(...)`, { ssr: false })` in the page to avoid SSR issues with Leaflet. Or use a pattern where the MapView itself checks `typeof window !== 'undefined'`.

- [ ] **Step 5: Wire up the landing page**
Update `src/app/page.tsx` to dynamically import and render `MapView`:
```tsx
'use client'
import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

export default function MapPage() {
  return <MapView />
}
```

- [ ] **Step 6: Add Leaflet CSS**
Import Leaflet CSS in `src/app/layout.tsx`:
```tsx
import 'leaflet/dist/leaflet.css'
```

- [ ] **Step 7: Verify map renders with markers**
```bash
npm run dev
```
Expected: Full-screen map centered on Stahnsdorf cemetery. Emoji markers visible for each POI. Tapping a marker shows the POICard. Locate button works (may prompt for permission).

- [ ] **Step 8: Commit**
```bash
git add src/components/Map* src/components/POICard* src/app/page.tsx src/app/layout.tsx package*.json
git commit -m "feat: add interactive map with POI markers and GPS locate"
```

---

## Task 5: POI Detail Page

**Files:**
- Create: `src/components/AudioPlayer.tsx`, `src/components/AudioPlayer.module.css`
- Create: `src/app/poi/[id]/page.tsx`, `src/app/poi/[id]/page.module.css`

- [ ] **Step 1: Create AudioPlayer component**
Create `src/components/AudioPlayer.tsx` — a `'use client'` component with:
- Props: `src: string | undefined`
- If no `src`, show "Audio kommt bald" placeholder
- If `src` exists, render an `<audio>` element with custom play/pause button, progress bar, and time display
- Style with muted earth tones to match the theme

Create `src/components/AudioPlayer.module.css`.

- [ ] **Step 2: Create POI detail page**
Create `src/app/poi/[id]/page.tsx`:
- Server component that reads the POI ID from params
- Calls `getPOIById(id)` — shows 404 message if not found
- Renders: back button, image carousel (or single placeholder image), name, dates, description text, tags, AudioPlayer
- Uses `t()` helper for all localized strings

Create `src/app/poi/[id]/page.module.css` with styles: scrollable page, image area at top, content below with padding.

- [ ] **Step 3: Add `generateStaticParams` for static export**
In the POI detail page, export:
```tsx
export function generateStaticParams() {
  return getAllPOIs().map((poi) => ({ id: poi.id }))
}
```
This is required for `output: 'export'` to work with dynamic routes.

- [ ] **Step 4: Wire POICard to navigate to detail**
Update `POICard` so the "Mehr erfahren" button uses `next/link` to navigate to `/poi/[id]`.

- [ ] **Step 5: Verify POI detail page**
```bash
npm run dev
```
Navigate to `/poi/heinrich-zille`. Expected: Detail page with name, dates, description, audio player placeholder, back button.

- [ ] **Step 6: Commit**
```bash
git add src/components/AudioPlayer* src/app/poi/
git commit -m "feat: add POI detail page with audio player"
```

---

## Task 6: Tours List Page

**Files:**
- Create: `src/components/TourList.tsx`, `src/components/TourList.module.css`
- Create: `src/app/tours/page.tsx`

- [ ] **Step 1: Create TourList component**
Create `src/components/TourList.tsx`:
- Renders a list of tour cards
- Each card shows: tour name, description, duration, distance, number of stops
- Card links to `/tour/[id]`
- Uses `t()` for localized strings

Create `src/components/TourList.module.css`: card grid/list, white card backgrounds, subtle shadow, padding.

- [ ] **Step 2: Create tours page**
Create `src/app/tours/page.tsx`:
```tsx
import { getAllTours } from '@/lib/content'
import TourList from '@/components/TourList'

export default function ToursPage() {
  const tours = getAllTours()
  return <TourList tours={tours} />
}
```

- [ ] **Step 3: Verify tours list**
```bash
npm run dev
```
Navigate to `/tours`. Expected: List of 2 tour cards with names, durations, distances.

- [ ] **Step 4: Commit**
```bash
git add src/components/TourList* src/app/tours/
git commit -m "feat: add tours listing page"
```

---

## Task 7: Active Tour Page (TourPlayer)

**Files:**
- Create: `src/components/TourPlayer.tsx`, `src/components/TourPlayer.module.css`
- Create: `src/app/tour/[id]/page.tsx`

- [ ] **Step 1: Create TourPlayer component**
Create `src/components/TourPlayer.tsx` — a `'use client'` component that:
- Props: `tour: Tour`
- Tracks `currentStopIndex` in state
- Renders a Leaflet map (dynamically imported) showing:
  - Numbered markers for each stop
  - Polyline connecting stops in order
  - Highlights the current stop
- Below the map, a panel shows:
  - Current stop name (resolved from POI data) and order (e.g., "Halt 2 von 4")
  - Transition text to the next stop
  - If GPS is available, distance from user's position to current stop
  - Previous / Next buttons
- "Zur Detailseite" link to the POI detail page for the current stop

Create `src/components/TourPlayer.module.css`.

- [ ] **Step 2: Create active tour page**
Create `src/app/tour/[id]/page.tsx`:
- Loads tour by ID
- Renders TourPlayer with the tour data
- Exports `generateStaticParams` for static export

- [ ] **Step 3: Verify tour player**
```bash
npm run dev
```
Navigate to `/tour/highlights`. Expected: Map with numbered stops connected by a line. Bottom panel with stop info and next/prev buttons.

- [ ] **Step 4: Commit**
```bash
git add src/components/TourPlayer* src/app/tour/
git commit -m "feat: add active tour page with step-by-step navigation"
```

---

## Task 8: Info Page

**Files:**
- Create: `src/app/info/page.tsx`, `src/app/info/page.module.css`

- [ ] **Step 1: Create info page**
Create `src/app/info/page.tsx` with static German content:
- **Öffnungszeiten** (opening hours): Daily, sunrise to sunset
- **Anfahrt** (directions): Address, S-Bahn, bus routes, parking
- **Barrierefreiheit** (accessibility): Info about path conditions
- **Über den Friedhof** (about): Brief history paragraph (founded 1909, notable features)
- **Kontakt** (contact): Placeholder contact info

Create `src/app/info/page.module.css`: scrollable page, section headings, clean typography.

- [ ] **Step 2: Verify info page**
```bash
npm run dev
```
Navigate to `/info`. Expected: Readable info page with all sections.

- [ ] **Step 3: Commit**
```bash
git add src/app/info/
git commit -m "feat: add info page with hours, directions, and about"
```

---

## Task 9: Static Export & Final Polish

**Files:**
- Modify: various (minor fixes)
- Create: `public/media/images/.gitkeep`, `public/media/audio/.gitkeep`

- [ ] **Step 1: Create media directories**
```bash
mkdir -p public/media/images public/media/audio
touch public/media/images/.gitkeep public/media/audio/.gitkeep
```

- [ ] **Step 2: Test static export**
```bash
npm run build
```
Expected: Successful build with static HTML files in `out/` directory. No errors.

- [ ] **Step 3: Fix any build errors**
Address any SSR/static export issues (most likely Leaflet-related — ensure all map components are dynamically imported with `ssr: false`).

- [ ] **Step 4: Test the static export locally**
```bash
npx serve out
```
Navigate through all pages: Map, tap markers, open POI detail, Tours list, start a tour, Info page. Verify everything works.

- [ ] **Step 5: Final commit and push**
```bash
git add -A
git commit -m "feat: complete MVP — static export, media dirs, polish"
git push -u origin claude/cemetery-visitor-app-oErqq
```
