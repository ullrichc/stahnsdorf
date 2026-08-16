# Prüfbericht: Südwestkirchhof-App vor Veröffentlichung

**Stand:** 16.08.2026 · Branch `main` · Build ✅ · 109 Unit-Tests ✅

Gesamtbild: Die App ist in gutem Zustand — Build und Tests laufen fehlerfrei, die Firebase-Security-Rules sind sauber aufgebaut (serverseitige Editor-Whitelist, Audit-Felder, Upload-Beschränkungen), es gibt kein XSS-Risiko und die Leaflet/SSR-Integration ist korrekt gelöst. Vor der Veröffentlichung sollten aber **2 Blocker**, das **Geolocation-Problem** und eine Reihe wichtiger Punkte behoben werden.

---

## 1. Geolocation (dein gemeldeter Punkt): Ursache gefunden

Es gibt **zwei getrennte Ortungs-Pfade** in der App, und beide haben Einstellungen, die auf Firefox/Android systematisch scheitern, während Chrome sie durch den Google-Fused-Location-Provider (schneller Fix aus Cache/WLAN/Play Services) kaschiert. Firefox nutzt diesen Dienst nicht und braucht für einen GPS-Fix oft 10–30 Sekunden.

### a) `src/lib/useGeolocation.ts` (Entfernungsanzeige in Sammlungsliste)

```ts
{ enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
```

- **`timeout: 5000` ist zu kurz.** Mit `enableHighAccuracy: true` muss Firefox einen echten GPS-Fix holen; der dauert beim Kaltstart fast immer länger als 5 s. Jeder Versuch endet mit `TIMEOUT` → es kommt **nie** eine Position an. Genau das erklärt „Chrome funktioniert, Firefox nicht".
- Der `error`-State wird bei einem späteren Erfolg **nie zurückgesetzt**.
- In `CollectionList` wird der Fehler gar nicht angezeigt — der Nutzer sieht einfach keine Entfernungen und weiß nicht warum.

**Empfohlener Fix:**

```ts
const watcher = navigator.geolocation.watchPosition(
  (pos) => {
    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    setError(null)                    // Fehler bei Erfolg zurücksetzen
  },
  (err) => setError(err.message),
  { enableHighAccuracy: true, maximumAge: 30000, timeout: 30000 }
)
```

### b) `LocateButton` in `src/components/MapView.tsx:57-71` (Positionsanzeige auf der Karte)

```ts
map.locate({ setView: true, maxZoom: 17 })
```

Leaflet-Defaults bedeuten hier: `enableHighAccuracy: false`, kein `watch`, `timeout: 10 s`.

- **Ohne `enableHighAccuracy: true`** liefert Firefox/Android oft nur eine sehr grobe Netzwerk-Position oder gar keine — Chrome liefert trotzdem brauchbare Werte. Das ist die Hauptursache für den beobachteten Unterschied auf der Karte.
- **Kein `locationerror`-Handler:** Bei Ablehnung der Berechtigung oder Timeout passiert nach dem Tippen sichtbar *nichts* — keine Meldung, kein Hinweis.
- **Einmal-Ortung statt `watch`:** Der blaue Punkt bleibt stehen, während der Besucher über den Friedhof läuft. Für eine Vor-Ort-App ist kontinuierliches Tracking Standard.
- Kein Genauigkeitskreis (`e.accuracy`), `aria-label="Locate"` hartkodiert englisch.

**Empfohlener Fix (Skizze):**

```ts
map.locate({ setView: true, maxZoom: 17, enableHighAccuracy: true, watch: true, timeout: 15000 })
map.on('locationfound', (e) => { /* Marker + Genauigkeitskreis aktualisieren */ })
map.on('locationerror', (e) => { /* lokalisierte Meldung: Berechtigung/kein Signal */ })
// beim Unmount: map.stopLocate() + Listener entfernen
```

HTTPS (Voraussetzung für Geolocation) ist durch GitHub Pages gegeben. Zum Verifizieren nach dem Fix: auf echten Geräten Chrome **und** Firefox testen, jeweils Erstbesuch (Permission-Prompt), Ablehnung und Flugmodus durchspielen.

---

## 2. Blocker (vor Release zwingend beheben)

### B1 — Statischer Export friert die POI-Seiten zum Build-Zeitpunkt ein

`src/app/poi/[id]/page.tsx:5-9` und `src/app/admin/poi/[id]/page.tsx` generieren die statischen Seiten aus dem eingecheckten Snapshot `data/stahnsdorf-backup-translated.json` (`output: 'export'`, GitHub Pages).

Folge in Produktion:

- Ein **neu angelegter POI** erscheint sofort auf der Karte (Live-Firestore), aber seine Detailseite `/poi/<id>` liefert **404**.
- Im Admin ist es schlimmer: Nach „Speichern" kann der Editor den neuen POI **nicht wieder öffnen** — und da Bild-Uploads erst nach dem ersten Speichern möglich sind (`POIImagesEditor.tsx:156-159`), ist „neuer POI mit Bildern" in Produktion **unmöglich**.
- POIs ohne Koordinaten (aktuell 12) bekommen wegen des Filters in `generateStaticParams` ebenfalls keine Seite.

**Fix-Optionen:** Admin-Editing auf eine statische Seite mit Query-Parameter umstellen (`/admin/poi/edit?id=…` via `useSearchParams`) — für die öffentliche Detailseite entweder ebenso, oder den Prozess „nach Publish: Snapshot aktualisieren + deployen" fest automatisieren (z. B. Workflow-Trigger) und den 404-Fallback (`public/404.html` → `?redirect=`) für unbekannte POI-IDs testen.

### B2 — Leeren der „Nachweis-URL" blockiert das Speichern komplett

`src/components/admin/POIImagesEditor.tsx:202` schreibt `nachweis_url: undefined` ins Bild-Objekt, wenn das Feld geleert wird. Firestore lehnt `undefined` ab („Unsupported field value") — danach scheitert **jedes** Speichern des POI (`updateDoc` in `POIImagesEditor.tsx:34` und `setDoc` in `POIForm.tsx:240`) mit einer für Editoren unverständlichen Meldung.

**Fix:** Bei leerem Wert das Feld löschen (`delete next.nachweis_url`) oder Firestore mit `ignoreUndefinedProperties` initialisieren.

---

## 3. Wichtig (sollte vor Release rein)

**Besucher-App:**

1. **Offline-/Netzwerkfehler wird als „Nicht gefunden" angezeigt** — `POIDetailClient.tsx:18-26`, `SammlungDetailClient.tsx:14-22`: `if (!poi || error)` behandelt einen Firestore-Fehler (kein Empfang — Kernszenario auf einem 206-ha-Friedhof!) wie einen nicht existierenden Eintrag. In `sammlungen/page.tsx` wird der Fehler ganz verschluckt (leere Seite). → `error` getrennt behandeln, Offline-Hinweis + Retry.
2. **Audio-URLs ignorieren den basePath** — `AudioPlayer.tsx:62`: `/media/audio/…` ohne `/stahnsdorf`-Präfix → 404 in Produktion, sobald der erste POI Audio bekommt (aktuell latent). Außerdem **spielt Audio nach Navigation weiter** (kein `pause()`-Cleanup beim Unmount).
3. **Zoom gesperrt (Barrierefreiheit)** — `layout.tsx:29-30`: `maximumScale: 1, userScalable: false` verhindert Textvergrößerung (WCAG 1.4.4). Entfernen; Leaflet regelt Karten-Gesten selbst.
4. **Open-Redirect-Schlupfloch** — `redirect.ts`: `/\evil.com` passiert die `//`-Prüfung; Browser normalisieren `\` zu `/` → externe Weiterleitung. Zusätzlich Backslashes ablehnen.
5. **i18n-Lücken** — hartkodiert deutsch in der 6-sprachigen App: Lade-/Fehlertexte in `POIDetailClient`, `SammlungDetailClient`, `sammlungen/page.tsx`, diverse `aria-label` in `POIDetailContent` und `POICard`, `„Gerade hier"` in `geo.ts:14`, „Karte wird geladen…" in `MapView.tsx:208`. Struktur in `ui-dictionary.ts` ist für alle Sprachen vorhanden — nur Keys ergänzen.
6. **Icons brechen offline** — Material Symbols kommen von fonts.googleapis.com; ohne Netz zeigen BottomNav & Co. Rohtext („map", „arrow_back"). Font self-hosten (wie Manrope/Newsreader bereits via `next/font`).

**Admin:**

7. **POI-Löschung kann Collections inkonsistent hinterlassen** — `POIForm.tsx:256-266`: erst POI löschen, dann Collections bereinigen; das Collection-Update setzt `geaendert_von` nicht neu und scheitert an den Rules, wenn zuletzt ein anderer Editor geändert hat → hängende Referenzen. Reihenfolge umdrehen + Audit-Felder setzen.
8. **Backup-Import nicht atomar** — `BackupRestore.tsx:177-265`: sequenzielle Einzel-Writes; Abbruch hinterlässt halb importierte Datenbank (mit `deleteMode` besonders riskant). `writeBatch` in Chunks verwenden.
9. **ID-Kollision bei gleichem Namen** — `makePOIId` ohne Kollisionsprüfung; zweiter POI mit gleichem Namen scheitert an den Rules mit kryptischem permission-denied. Vorab `getDoc` + Suffix oder klare Meldung.
10. **Ein Firestore-Write pro Tastendruck** — `POIImagesEditor.tsx:102-116` persistiert Bild-Metadaten bei jedem `onChange`. Auf Blur/Debounce oder den Speichern-Button umstellen.
11. **AuthGate sperrt bei Netzwerkfehler fälschlich aus** — `AuthGate.tsx:62-69`: jeder Fehler → „Zugriff verweigert". `err.code` unterscheiden (permission-denied vs. unavailable + Retry).

---

## 4. Optional (nach Release okay)

- `AudioPlayer`: optimistischer `playing`-State (Play-Promise kann rejecten), Seek vor Metadaten wirft `TypeError` (`duration = NaN`), Seek-Bar nicht tastaturbedienbar.
- `useFirestore.ts:27`: `!== null` lässt `undefined`-Koordinaten durch (Crash-Risiko in der Karte) → `!= null`. `t()` in `i18n.ts` wirft bei fehlendem Feld → `if (!str) return ''`.
- `useFirestore`-Hooks ohne Cancelled-Flag (setState nach Unmount).
- Lightbox: iOS-Scroll-Lock unzuverlässig, kein Fokus-Management.
- `info/page.tsx`: Telefonnummern als `tel:`-Links.
- `BottomNav`/Sprachwahl: `aria-current` / `aria-pressed` ergänzen.
- `POIForm.handleCoordChange`: überschreibt `koordinaten_quelle` auch ohne Wertänderung; halb geleerte Koordinatenfelder speichern unbemerkt alte Werte.
- `AdminSidebar`: „Übersicht" und „POIs" zeigen auf dasselbe Ziel.
- Repo-Hygiene: `.tmp-poi-text-translation-cache.json` und `outputs/` in `.gitignore` aufnehmen.

---

## 5. Geprüft und in Ordnung

- **Security-Rules** (Firestore + Storage): Editor-Whitelist serverseitig, Audit-Felder erzwungen, Uploads auf Editoren/JPEG/≤10 MB/`display|thumb` beschränkt; AuthGate ist korrekt nur UX-Schicht.
- **Kein XSS** (`dangerouslySetInnerHTML` nirgends), API-Keys sind Firebase-Web-Keys (öffentlich okay, Schutz liegt in den Rules).
- **SSR/Hydration**: Leaflet via `dynamic(ssr:false)`, LocaleContext ohne Hydration-Mismatch, `useSearchParams` in Suspense.
- **Build & Tests**: `next build` (198 Seiten) und 109 Unit-Tests fehlerfrei; CI mit Emulator-Tests vor Deploy.
- **OSM-Attribution** vorhanden; Tile-Nutzung im Rahmen der OSM-Policy für eine App dieser Größe.

## Empfohlene Reihenfolge

1. B1 + B2 (Blocker) → 2. Geolocation-Fixes (beide Pfade) + Gerätetest Chrome/Firefox → 3. Punkte 1–6 (Besucher) → 4. Punkte 7–11 (Admin) → 5. Optionales nach Release.
