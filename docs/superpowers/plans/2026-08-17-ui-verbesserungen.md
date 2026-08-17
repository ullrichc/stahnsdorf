# UI-Verbesserungen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die geprüften Punkte aus `docs/ui-verbesserungsliste.md` für Orientierung, Lesbarkeit, Sammlungen und Touch-Bedienung vollständig umsetzen.

**Architecture:** Die bestehende Leaflet-/Firestore-Struktur bleibt erhalten. Kleine pure Helfer decken Karten-Deep-Links, lokalisierte Datumssemantik und Markerzustände ab; die Sammlung-Detailseite lädt veröffentlichte POIs optional ohne Koordinatenfilter und zeigt Liste und Karte gemeinsam.

**Tech Stack:** Next.js 16, React 18, TypeScript, Leaflet, lucide-react, Vitest, Playwright

---

### Task 1: Pure UI behavior

**Files:**
- Modify: `src/lib/poi-display.ts`
- Modify: `src/lib/poi-display.test.ts`
- Modify: `src/lib/redirect.ts`
- Modify: `src/lib/redirect.test.ts`
- Modify: `src/components/BottomNav.tsx`

- [ ] Failing Tests für semantische Datumsangaben und Karten-Deep-Links schreiben.
- [ ] Pure Helfer implementieren und Tests grün machen.
- [ ] Detailrouten den passenden Navigationstabs zuordnen.

### Task 2: Karte und POI-Sheet

**Files:**
- Modify: `src/components/AppIcon.tsx`
- Modify: `src/components/MapMarker.tsx`
- Modify: `src/components/MapView.tsx`
- Modify: `src/components/MapView.module.css`
- Modify: `src/components/POICard.tsx`
- Modify: `src/components/POICard.module.css`
- Modify: `src/components/ClientMap.tsx`
- Modify: `src/styles/globals.css`
- Modify: `src/app/page.tsx`

- [ ] Marker auf Lucide-SVG, kompakte Übersichtspunkte und Auswahlzustand umstellen.
- [ ] Auswahl in den sichtbaren Kartenausschnitt verschieben.
- [ ] Suche einklappbar machen und Ortung nach oben verlegen.
- [ ] Sheet ohne Ziehgriff und Abschneiden gestalten.
- [ ] CARTO Dark Matter samt vollständiger Attribution verwenden.

### Task 3: POI-Detailseite

**Files:**
- Modify: `src/app/poi/[id]/POIDetailContent.tsx`
- Modify: `src/app/poi/[id]/page.module.css`
- Modify: `src/lib/ui-dictionary.ts`

- [ ] Browser-Zurück mit Kartenfallback implementieren.
- [ ] Lage und Kartenaktion vor Galerie und Audio platzieren.
- [ ] Lokalisierte semantische Datumsangabe und ruhigere Chipfarbe einsetzen.

### Task 4: Sammlungen

**Files:**
- Modify: `src/lib/useFirestore.ts`
- Modify: `src/components/CollectionList.tsx`
- Modify: `src/components/CollectionList.module.css`
- Modify: `src/app/sammlung/[id]/SammlungContent.tsx`
- Modify: `src/app/sammlung/[id]/page.module.css`

- [ ] Geolocation aus der Sammlungsliste entfernen und Teaser auf drei Zeilen erweitern.
- [ ] Vollständige Beschreibung und antippbare Liste aller veröffentlichten POIs ergänzen.
- [ ] POIs ohne Koordinaten kennzeichnen und Sammlungskarte enger einpassen.
- [ ] Lange Kopfzeilen robust und touchgerecht gestalten.

### Task 5: Cross-cutting polish and verification

**Files:**
- Modify: `src/components/BottomNav.module.css`
- Modify: `docs/ui-verbesserungsliste.md`
- Modify: `docs/redaktionelle-leitlinien.md`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Add/modify: relevant Vitest and Playwright tests

- [ ] Kleine Schriftgrade, Kontraste und Touchflächen korrigieren.
- [ ] Liste und Dokumentation aktualisieren.
- [ ] Unit-, E2E-, Typecheck-, Build- und Exportprüfungen ausführen.
- [ ] Mobile und Desktop visuell auf Überlappungen und leere Karten prüfen.
