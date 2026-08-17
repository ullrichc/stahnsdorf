# Quellen, Datumsanzeige und Sammlungen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quellen verlustfrei bereinigen, sichtbare und editierbare Datumsangaben deutsch formatieren und alle Sammlungsbeschreibungen in sechs Sprachen redaktionell überarbeiten.

**Architecture:** ISO-Datumswerte bleiben das interne Austauschformat. Gemeinsame Anzeige- und Eingabehelfer übernehmen die deutsche Darstellung; ein idempotentes Datenskript bereinigt den JSON-Master und archiviert entfernte Angaben in `notiz`. Quellenlinks verwenden eine explizite, generische Markdown-Linknotation, die der bestehende POI-Renderer sicher in Text- und Linksegmente zerlegt.

**Tech Stack:** TypeScript, React, Vitest, Playwright, Node.js ESM, JSON

---

### Task 1: Datums- und Quellenhelfer

**Files:**
- Modify: `src/lib/poi-display.ts`
- Modify: `src/lib/poi-display.test.ts`

- [ ] Tests für deutsche Datumsanzeige, deutsche Eingabe und Markdown-Links ergänzen.
- [ ] Tests ausführen und das erwartete Fehlschlagen prüfen.
- [ ] Minimale Parser- und Formatierungslogik implementieren.
- [ ] Tests erneut ausführen.

### Task 2: Admin-Datumsfelder

**Files:**
- Modify: `src/components/admin/POIForm.tsx`
- Modify: `tests/e2e/poi-editor.spec.ts`

- [ ] E2E-Erwartungen auf `TT.MM.JJJJ` umstellen.
- [ ] Admin-Felder deutsch anzeigen und beim Speichern nach ISO zurückwandeln.
- [ ] Geburts-, Sterbe- und Koordinaten-Erfassungsdatum abdecken.

### Task 3: Reproduzierbare Datenbereinigung

**Files:**
- Create: `scripts/cleanup-editorial-data.mjs`
- Create: `tests/cleanup-editorial-data.test.mjs`
- Modify: `package.json`
- Modify: `data/stahnsdorf-backup-translated.json`

- [ ] Failing Tests für Quellenentfernung, Abrufdatenarchiv, Wikipedia-Markdown und Idempotenz schreiben.
- [ ] Bereinigungsfunktionen implementieren.
- [ ] Alle zwölf Sammlungsbeschreibungen auf Deutsch, Englisch, Französisch, Polnisch, Russisch und Schwedisch hinterlegen.
- [ ] Skript auf den Masterbestand anwenden und einen zweiten idempotenten Lauf prüfen.

### Task 4: Künftige Importe konsistent halten

**Files:**
- Modify: `scripts/apply-osm-candidates.mjs`
- Modify: `scripts/osm-candidates.mjs`
- Modify: `scripts/manual-osmand-coordinates.mjs`
- Modify: `scripts/migrate.ts`
- Modify: zugehörige Tests

- [ ] Tests so ändern, dass neue Quellen keine Abrufangabe enthalten.
- [ ] OsmAnd nur noch in `koordinaten_quelle` und `notiz`, nicht in `quellen`, dokumentieren.
- [ ] Importimplementierungen entsprechend anpassen.

### Task 5: Dokumentation und Verifikation

**Files:**
- Modify: `docs/schema.md`
- Modify: `docs/redaktionelle-leitlinien.md`
- Modify: `README.md`
- Modify: `AGENTS.md`, falls die Projektregeln betroffen sind

- [ ] Darstellungsformat, Markdown-Quellenlinks und Sammlungsregel dokumentieren.
- [ ] Unit Tests und Typecheck ausführen.
- [ ] Production-Build und Exportprüfung ausführen.
- [ ] Diff und Daten-Audit auf unerwünschte Restmuster prüfen.
