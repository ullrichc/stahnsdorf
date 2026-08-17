# Karten-Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein statisches OSM-Overlay macht Friedhofsfläche und Wege in allen Besucherkarten sichtbar und bereinigt die verbliebenen gültigen Punkte der UI-Verbesserungsliste.

**Architecture:** Ein Node-Skript konvertiert eine gezielte Overpass-Antwort in kompaktes GeoJSON. Eine eigenständige Leaflet-Komponente lädt die Datei basePath-korrekt, zeichnet sie nicht interaktiv in eigenen Panes und passt die Wegsichtbarkeit an feste Zoomschwellen an. Typanzeige und Detailseiten-Metabereiche werden mit kleinen, zentralen Helfern bereinigt.

**Tech Stack:** Node.js, GeoJSON, Leaflet, React, TypeScript, Vitest, Playwright.

---

### Task 1: GeoJSON-Generator

**Files:** `scripts/build-map-overlay.mjs`, `tests/build-map-overlay.test.mjs`, `package.json`, `public/map-overlay.geojson`

- [x] Konvertierungs- und Filtertests schreiben und rot ausführen.
- [x] Deterministischen Overpass-Generator mit Begrenzung auf die Friedhofsfläche implementieren.
- [x] GeoJSON aus OSM erzeugen und Größe/Inhalt prüfen.
- [x] Tests grün ausführen.

### Task 2: Leaflet-Ebene

**Files:** `src/components/MapOverlay.tsx`, `src/components/ClientMap.tsx`, `src/lib/map-overlay.ts`, zugehörige Tests und CSS

- [x] Tests für URL, Stil und Zoomsichtbarkeit schreiben und rot ausführen.
- [x] Eigene Panes, Canvas-Rendering und nicht interaktive GeoJSON-Ebene implementieren.
- [x] Fehler-Fallback und Aufräumen beim Unmount sicherstellen.
- [x] Tests grün ausführen.

### Task 3: Detailseiten und Typen

**Files:** `src/lib/poi-display.ts`, Detail- und Sammlungsansichten, CSS, JSON-Master, Tests

- [x] Zentrale Typanzeige testgetrieben ergänzen.
- [x] `entrance` im Master auf `bauwerk` normalisieren und kompatibel rendern.
- [x] Lage, Feedback und Quellen kompakt und responsiv gestalten.

### Task 4: Dokumentation und Verifikation

**Files:** `docs/ui-verbesserungsliste.md`, `README.md`, `AGENTS.md`

- [x] Erledigte und unzutreffende UI-Punkte entfernen oder dokumentieren.
- [x] Overlay-Erzeugung, Aktualisierung und OSM-Attribution dokumentieren.
- [x] Unit-Tests, Typecheck, Build, Exportprüfung und E2E ausführen.
- [x] Mobile und Desktop-Screenshots visuell prüfen.
