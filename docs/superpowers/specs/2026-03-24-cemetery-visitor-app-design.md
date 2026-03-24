# Stahnsdorf Cemetery Visitor App — MVP Design Spec

## Purpose

A mobile web app that helps visitors explore the Südwestkirchhof Stahnsdorf, one of the largest woodland cemeteries in the world near Berlin. Serves both casual tourists and history/culture enthusiasts with an interactive map, curated walking tours, and multimedia content about notable graves, buildings, and landmarks.

## Stack

- **Next.js** (React, App Router) with static export
- **TypeScript**
- **Leaflet + OpenStreetMap** for the interactive map
- **JSON files** for content (points of interest, tours)
- **next-intl** or **i18next** for internationalization
- No backend for MVP — all content is static

## Architecture

### Views

| View | Route | Description |
|------|-------|-------------|
| Map | `/` | Landing page. Full-screen Leaflet map with POI markers and GPS locate button. |
| Tours | `/tours` | List of curated walking tours with name, duration, distance. |
| Active Tour | `/tour/[id]` | Tour mode: route on map, numbered stops, next/prev navigation, distance to next stop. |
| POI Detail | `/poi/[id]` | Full detail page: photo carousel, biographical/historical text, audio player. |
| Info | `/info` | Opening hours, directions, accessibility, about the cemetery. |

### Navigation

Bottom tab bar with three tabs: Map, Tours, Info. Standard mobile web pattern.

### Map Interaction

1. Visitor opens the app and sees the cemetery map (landing page).
2. POI markers are displayed with icons by type (grave, building, landmark, nature).
3. Tapping a marker slides up a `POICard` with a summary.
4. Tapping the card navigates to the full `POIDetail` page.
5. A "locate me" button triggers the browser Geolocation API, showing a blue dot for the visitor's position.

### Tour Interaction

1. Visitor browses the tour list and taps one to start.
2. The map zooms to the tour route with numbered stop markers.
3. A bottom panel shows the current stop with transition text to the next stop and distance.
4. Next/prev controls advance through the tour.

## Data Model

### Points of Interest (`data/pois.json`)

```json
[
  {
    "id": "heinrich-zille",
    "type": "grave",
    "name": { "de": "Heinrich Zille" },
    "coordinates": [52.3912, 13.2054],
    "summary": { "de": "Berliner Zeichner und Fotograf, bekannt für seine Milieustudien." },
    "description": { "de": "Longer biographical and historical text..." },
    "dates": { "born": "1858-01-10", "died": "1929-08-09" },
    "images": ["zille-01.jpg", "zille-02.jpg"],
    "audio": { "de": "zille-de.mp3" },
    "tags": ["artist", "famous"]
  }
]
```

**POI types:** `grave`, `building`, `landmark`, `nature`

### Tours (`data/tours.json`)

```json
[
  {
    "id": "highlights",
    "name": { "de": "Highlights-Tour" },
    "description": { "de": "Die wichtigsten Sehenswürdigkeiten des Friedhofs." },
    "duration": "30min",
    "distance": "1.2km",
    "stops": [
      {
        "poiId": "hauptkapelle",
        "order": 1,
        "transition": { "de": "Vom Eingang gehen Sie 100m geradeaus zur Hauptkapelle." }
      }
    ]
  }
]
```

### Internationalization

All user-facing strings are keyed by locale: `{ "de": "..." }`. Adding English or other languages means adding keys (e.g., `"en": "..."`). German is the only language at launch.

### Media

Static files stored in `public/media/images/` and `public/media/audio/`, referenced by filename in the JSON data.

## Components

| Component | Purpose |
|-----------|---------|
| `MapView` | Full-screen Leaflet map, renders POI markers, handles tap events, GPS locate button |
| `MapMarker` | Marker icon per POI type (grave, building, landmark, nature) |
| `POICard` | Bottom sheet showing POI summary on marker tap |
| `POIDetail` | Full-page detail: photo carousel, text, audio player |
| `AudioPlayer` | Play/pause/seek for narration clips. Auto-pauses on navigation. |
| `TourList` | Cards showing available tours with name, duration, distance |
| `TourPlayer` | Active tour mode: highlights route on map, current stop panel, next/prev, distance to next stop |
| `BottomNav` | Tab bar: Map / Tours / Info |
| `InfoPage` | Static content: opening hours, directions, accessibility, about |

## GPS / Geolocation

- "Locate me" button on the map triggers `map.locate()` via the browser Geolocation API
- Displays a blue dot for the visitor's current position
- Shows distance to the next tour stop when a tour is active
- Browser handles the permission prompt; graceful fallback if denied

## Project Structure

```
stahnsdorf/
├── data/
│   ├── pois.json
│   └── tours.json
├── public/
│   └── media/
│       ├── images/
│       └── audio/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── tours/
│   │   │   └── page.tsx
│   │   ├── tour/
│   │   │   └── [id]/page.tsx
│   │   ├── poi/
│   │   │   └── [id]/page.tsx
│   │   └── info/
│   │       └── page.tsx
│   ├── components/
│   │   ├── MapView.tsx
│   │   ├── MapMarker.tsx
│   │   ├── POICard.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── TourList.tsx
│   │   ├── TourPlayer.tsx
│   │   └── BottomNav.tsx
│   ├── lib/
│   │   ├── content.ts
│   │   └── i18n.ts
│   └── styles/
│       └── globals.css
├── next.config.js
├── package.json
└── tsconfig.json
```

## Visual Style

Clean, minimal, respectful — muted earth tones appropriate for a cemetery context. Large tap targets for outdoor mobile use on potentially bright screens.

## Sample Content (MVP)

**POIs (5-8):**
- Notable graves: Heinrich Zille, Lovis Corinth, Engelbert Humperdinck
- Building: Hauptkapelle (main chapel)
- Landmarks: Cemetery entrance, old railway station (Friedhofsbahn)
- Nature: Woodland character of the grounds

**Tours (1-2):**
- "Highlights-Tour" — most notable spots, ~30 min
- "Berühmte Künstler" — artists and musicians, ~45 min

**Audio:** Placeholder with "coming soon" indicator. Audio player component is functional, ready for real recordings.

## Explicitly Out of MVP Scope

- CMS / admin interface (Phase 2)
- Offline support / PWA
- User accounts, favorites, bookmarks
- Custom map tiles (planned for later)
- Search functionality
- Multiple languages (German only at launch)
- Push notifications

## Future Phases

1. **Phase 2 — CMS:** Admin interface for non-technical content contributors to manage POIs, tours, images, and audio.
2. **Phase 3 — Custom Map:** Replace OpenStreetMap tiles with a custom-designed cemetery map.
3. **Phase 4 — Multilingual:** Add English and potentially other languages.
4. **Phase 5 — Offline/PWA:** Service worker for offline map tiles and content caching.
