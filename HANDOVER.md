# Handover: Südwestkirchhof Stahnsdorf Map App

## Project Overview

A Next.js 16 app for visitors of the Südwestkirchhof Stahnsdorf cemetery. Uses Leaflet for an interactive map with POI markers (graves of famous people, chapel, entrance, nature spots). Three pages: Map, Tours, Info.

**Stack:** Next.js 16.2.1, React 18.3, Leaflet 1.9.4, TypeScript 6, static export

## Current State

The app runs (`npm run dev` on port 3000) but has two unresolved issues that need fixing before the app is usable.

---

## Bug 1: "Map container is already initialized" (Critical)

**Symptom:** Browser console shows `Uncaught Error: Map container is already initialized` from `ClientMap.tsx:23`. Sometimes the map renders but then crashes on HMR/navigation. Sometimes the page becomes unresponsive.

**Root Cause:** React 18 strict mode double-mounts components in development. Leaflet attaches internal state (`_leaflet_id`) to the DOM container div. When React unmounts and remounts the component, the cleanup (`instance.remove()`) runs, but the DOM element may retain Leaflet's internal properties. On the second mount, `L.map(el, ...)` sees the existing `_leaflet_id` and throws.

**Current state of the fix (incomplete):** In `src/components/ClientMap.tsx`, a guard was added to delete `_leaflet_id` before calling `L.map()`. This is insufficient — `instance.remove()` in the cleanup does more than just clear `_leaflet_id`; it also detaches event listeners and child elements. The timing between React's unmount cleanup and remount may cause a race.

**File:** `src/components/ClientMap.tsx` (lines 33-60)

**Suggested approach:**
- Option A: Use a separate inner div for the Leaflet container. The outer ref div stays stable; create/destroy an inner div on each effect cycle. This guarantees a fresh DOM element every time.
- Option B: Use `react-leaflet` v4 which already handles this correctly (it's in `package.json` but currently unused — the app uses raw Leaflet imperatively).
- Option C: Guard with a ref flag (`mapRef.current`) and skip re-init if the map is already alive.

---

## Bug 2: POI Markers Not Visible on Map

**Symptom:** The map renders (tiles load, panning works) but no POI markers appear. No info card is shown at the bottom. See screenshot — the map shows the cemetery area but zero custom markers.

**Possible causes (not yet diagnosed):**

1. **Map crash prevents marker rendering:** If Bug 1 causes the map instance to be in a broken state, the `POIMarkers` child component (which uses `useMapInstance()` context) may silently fail when calling `marker.addTo(map)`.

2. **Coordinates off-screen:** The POI coordinates were recently changed (see below). If the map center and zoom don't encompass the new coordinates, markers exist but aren't visible. Current map center: `[52.3935, 13.1985]`, zoom 16. POI range: lat 52.3895–52.3963, lng 13.1920–13.2077. At zoom 16, the viewport is roughly 0.01 degrees — the Haupteingang at `13.2077` may be outside the visible area.

3. **Marker icon CSS missing:** `MapMarker.tsx` creates `L.divIcon` with `className: 'custom-marker'`. If there's a default Leaflet CSS rule that hides or collapses elements with this class (e.g., `background: none; border: none;` on `.leaflet-div-icon`), the emoji markers may render as invisible/zero-size elements. Check if Leaflet's default CSS is imported and whether `.custom-marker` needs explicit styling.

4. **`getAllPOIs()` may return empty:** The data comes from `data/pois.json` via `src/lib/content.ts`. Verify the import path resolves correctly at runtime.

**Files:**
- `src/components/MapView.tsx` — `POIMarkers` component (lines 41-59) creates markers
- `src/components/MapMarker.tsx` — `createMarkerIcon()` creates emoji-based `L.divIcon`
- `data/pois.json` — POI data with coordinates

---

## Recent Coordinate Changes (Uncommitted)

The POI coordinates in `data/pois.json` were updated to better match real-world locations. The original values placed everything in the residential area east of the cemetery. New values are based on OpenStreetMap Overpass API data.

| POI | Old Coordinates | New Coordinates | Source |
|-----|----------------|-----------------|--------|
| Heinrich Zille | 52.3912, 13.2054 | 52.3940, 13.1980 | Estimated (inside cemetery) |
| Lovis Corinth | 52.3918, 13.2048 | 52.3925, 13.1955 | Estimated (inside cemetery) |
| Engelbert Humperdinck | 52.3908, 13.2062 | 52.3920, 13.1940 | Estimated (inside cemetery) |
| Hauptkapelle | 52.3915, 13.2040 | 52.3930, 13.1965 | Estimated (central cemetery) |
| Haupteingang | 52.3920, 13.2030 | 52.3963, 13.2077 | OSM gate data (verified) |

**Important:** Only the Haupteingang coordinate (52.3963, 13.2077) is verified from OSM. The others are rough estimates placed within the cemetery grounds. They should be validated against actual grave locations, ideally using the cemetery's official Grabstättenplan (burial site map) available at: https://www.suedwestkirchhof.de/files/suedwestkirchhof/content/pdf/SWK-Grabstaettenplan.pdf

The map center was also moved: `[52.3915, 13.2050]` -> `[52.3935, 13.1985]` in both `MapView.tsx` and `TourPlayer.tsx`.

---

## Uncommitted File Changes

Run `git diff HEAD` to see all changes. Summary:

| File | Change |
|------|--------|
| `data/pois.json` | Updated all 6 POI coordinates (see table above) |
| `src/components/ClientMap.tsx` | Added `_leaflet_id` cleanup guard (incomplete fix) |
| `src/components/MapView.tsx` | Updated map CENTER constant |
| `src/components/TourPlayer.tsx` | Updated fallback center constant |
| `package.json` | Minor dependency change |
| `package-lock.json` | Lock file update |
| `tsconfig.json` | Config adjustments |

---

## Recommended Next Steps

1. **Fix the Leaflet init bug first** — this likely blocks everything else. The cleanest approach is Option A (inner div) or Option B (switch to react-leaflet which is already a dependency).
2. **Once the map renders without errors**, check if markers appear. If not, debug `POIMarkers` with `console.log(pois)` and inspect the DOM for `.custom-marker` elements.
3. **Validate POI coordinates** — zoom the map out to see if markers are placed off-screen, then adjust center/zoom or coordinates.
4. **Test the Tours page** (`/touren`) — `TourPlayer.tsx` uses the same `ClientMap` component and will have the same init bug.
