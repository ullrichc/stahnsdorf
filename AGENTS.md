# Projektbeschreibung für Agenten

## Was ist das hier?

Eine Web-App für Besucher des **Südwestkirchhof Stahnsdorf** — einen der größten Waldfriedhöfe Europas (206 Hektar, südwestlich von Berlin). Die App zeigt eine interaktive Karte mit Gräbern, Denkmälern, Bauwerken und Gedenkanlagen. POIs (Points of Interest) sind die zentrale Datenbasis und werden auch außerhalb der Karte genutzt — z.B. für Social-Media-Posts an Jahrestagen, Faltblätter, Führungen.

Der Auftraggeber ist der **Förderverein Südwestkirchhof Stahnsdorf e.V.**

## Übergeordnetes Ziel

Der eigentliche Kern dieses Projekts ist die **POI-Datenbank** — eine strukturierte, mehrsprachige Wissensbasis über Gräber, Denkmäler, Bauwerke und Gedenkanlagen des Friedhofs. Die interaktive Karte ist nur eine von mehreren Nutzungen dieser Datenbank.

Geplante und mögliche Anwendungen:

- **Karten-App** (aktuell) — interaktive Karte für Besucher vor Ort
- **Redaktionswerkzeug** (aktuell) — Admin-UI für POI-CRUD mit Publish-Workflow
- **Social Media** — automatische Vorschläge für Posts an Geburts-/Todestagen prominenter Personen
- **Faltblätter & Druckmaterial** — generierte Inhalte für Führungen und Veranstaltungen
- **Webseite des Vereins** — POI-Daten als Inhaltsquelle
- **Forschung & Dokumentation** — Quellenangaben und Redaktionsstatus sichern die Nachvollziehbarkeit

Design-Entscheidungen am Schema sollten immer mit Blick auf diese Mehrfachnutzung getroffen werden. Die Datenbank gehört dem Verein, nicht der App.

## Aktueller Stand

Die App funktioniert: Leaflet-Karte mit Markern, Sammlungsansicht, POI-Detailkarten, Sprachumschaltung. Daten kommen live aus **Firestore** mit IndexedDB-Offline-Cache. Ein **Redaktionswerkzeug** (`/admin`) ist implementiert mit Google-Login, Editor-Whitelist, POI-Tabelle mit Filtern, Zwei-Spalten-Editor, Sammlungen-Editor und Backup/Restore.

## Techstack

| Was | Womit |
|---|---|
| Framework | Next.js 16 (Static Export via `output: 'export'`) |
| Karte | Leaflet 1.9, react-leaflet 4 |
| Sprache | TypeScript 6, React 18 |
| Backend | Firebase (Firestore + Auth — aktiv) |
| Tests | Playwright (67 E2E Tests), Vitest (Unit), Firebase Rules Sandbox |
| CI/CD | GitHub Actions (Tests bei PR/Push, Deploy auf Pages) |
| Hosting | GitHub Pages (Pfad `/stahnsdorf`) |
| Firebase CLI | `firebase-tools` (devDependency, `npm run deploy:firestore`) |

## Projektstruktur

```
stahnsdorf/
├── AGENTS.md                # ⭐ Dieses Dokument — Projektkontext für Agenten
├── firebase.json            # Firebase CLI Config
├── .firebaserc              # Firebase Projekt-Binding
├── firestore.rules          # Firestore Security Rules
├── firestore.indexes.json   # Firestore Composite Indexes
├── data/
│   └── stahnsdorf-backup-translated.json # Unified Build-Time Snapshot for generateStaticParams
├── docs/
│   └── schema.md            # ⭐ Verbindliches Datenmodell — IMMER zuerst lesen
├── scripts/
│   ├── migrate.ts           # Migrationsscript altes → neues Schema
│   ├── migrate-to-firestore.ts  # Einmalige Migration JSON → Firestore
│   └── setup-editors.ts     # Editor-Dokumente in Firestore anlegen
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Startseite (Karte)
│   │   ├── info/            # Infoseite
│   │   ├── poi/[id]/        # POI-Detailseite (Server+Client Split)
│   │   ├── sammlung/[id]/   # Einzelne Sammlung (Server+Client Split)
│   │   ├── sammlungen/      # Sammlungsübersicht
│   │   └── admin/           # 🔒 Redaktionswerkzeug
│   │       ├── layout.tsx   # AuthGate Wrapper
│   │       ├── admin.css    # Admin Design System (Light Theme)
│   │       ├── page.tsx     # POI-Tabelle mit Filtern
│   │       ├── poi/         # POI-Editor (Neu + Bearbeiten)
│   │       ├── collections/ # Sammlungen-Editor
│   │       └── backup/      # Backup & Restore
│   ├── components/
│   │   ├── ClientMap.tsx     # Leaflet-Container (Raw Leaflet, nicht react-leaflet)
│   │   ├── MapView.tsx       # Kartenansicht mit Firestore-Daten
│   │   ├── MapMarker.tsx     # Marker-Icons (Emoji-basiert)
│   │   ├── POICard.tsx       # POI-Detailkarte
│   │   ├── CollectionList.tsx
│   │   ├── BottomNav.tsx     # Navigation unten
│   │   ├── AudioPlayer.tsx
│   │   └── admin/           # Admin-Komponenten
│   │       ├── AuthGate.tsx  # Google-Login + Editor-Whitelist
│   │       ├── POIForm.tsx   # Zwei-Spalten-Editor
│   │       └── BackupRestore.tsx
│   ├── lib/
│   │   ├── firebase.ts       # Firebase App + Firestore + Auth + Offline
│   │   ├── useFirestore.ts   # Hooks: usePOIs, usePOI, useCollections, useCollection
│   │   ├── content.ts        # Alte JSON-basierte Loader (nur noch für Tests)
│   │   ├── types.ts          # TypeScript-Typen — entspricht docs/schema.md ✅
│   │   ├── i18n.ts           # Sprachunterstützung (LocalizedText → String)
│   │   ├── LocaleContext.tsx  # React Context für Sprache
│   │   ├── geo.ts            # GPS-Entfernungsberechnung
│   │   └── useGeolocation.ts
│   └── styles/               # CSS Module
├── public/
│   └── 404.html              # SPA-Fallback für GitHub Pages
├── .env.local                # Firebase-Credentials (nicht im Repo)
├── .env.example              # Vorlage für .env.local
└── next.config.js            # Static Export, basePath=/stahnsdorf
```

## Datenmodell (Kurzfassung)

**Vollständig definiert in `docs/schema.md` — dort immer zuerst nachschlagen.**

Alle Felder verwenden **deutsche Namen**:

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string | `poi_sws_<kennung>` |
| `typ` | string | `grab`, `mausoleum`, `denkmal`, `gedenkanlage`, `bauwerk`, `bereich` |
| `name` | LocalizedText | Anzeigename |
| `koordinaten` | `{ lat, lng } \| null` | GPS-Position oder `null` |
| `kurztext` | LocalizedText | Einzeiler für die App |
| `beschreibung` | LocalizedText | Inhaltliche Beschreibung |
| `datum_von` / `datum_bis` | string \| null | Geburts-/Sterbedatum, YYYY-MM-DD |
| `wikipedia_url` | string \| null | Link zur Wikipedia |
| `bilder` | Bild[] | Mit `nachweis` (Pflicht) und `nachweis_url` |
| `audio` | `{ [sprache]: url }` | Audio-URLs pro Sprache |
| `quellen` | string[] | Freitext-Quellenangaben |
| `status` | string | `bestätigt` oder `prüfen` |
| `notiz` | string | Intern — Lagehinweise, Unsicherheiten |

**Firestore-Erweiterungen** (nicht im lokalen JSON):

| Feld | Typ | Beschreibung |
|---|---|---|
| `publish_status` | string | `entwurf`, `zur_prüfung`, `veröffentlicht` |
| `erstellt_von` / `geaendert_von` | string | Email des Editors |
| `erstellt_am` / `geaendert_am` | Timestamp | Firestore Timestamps |

**LocalizedText**: `{ de: "..." }` ist Pflicht, andere Sprachen optional. Fallback: gewünschte Sprache → `de` → erste verfügbare.

## Wichtige Regeln

### ⚠️ Dokumentation aktuell halten

**Bei jeder Änderung am Projekt müssen alle betroffenen Dokumente aktualisiert werden:**

- `AGENTS.md` — wenn sich Projektstruktur, Techstack, Regeln oder Stand ändern
- `docs/schema.md` — wenn sich das Datenmodell ändert
- `src/lib/types.ts` — muss immer mit `docs/schema.md` übereinstimmen
- `README.md` — wenn sich Setup, Entwicklung oder Architektur ändern

**Keine Änderung ist fertig, solange die Dokumentation veraltet ist.**

### Datenmodell
- **`docs/schema.md` ist die Wahrheit.** Alle POI-Felder sind dort definiert.
- Deutsch ist die Quellsprache. Andere Sprachen (en, fr, pl, ru, sv) werden per KI generiert.
- Nur POIs mit `koordinaten != null` erscheinen auf der Karte.
- POIs ohne Koordinaten bleiben in der Datenbank bis sie vor Ort ermittelt werden.

### Code
- `src/lib/types.ts` definiert die TypeScript-Typen — **muss mit `docs/schema.md` übereinstimmen.**
- `src/lib/useFirestore.ts` enthält die Hooks für Firestore-Zugriff (visitor + admin).
- `src/lib/content.ts` existiert noch für Tests, wird nicht mehr von der App genutzt.
- Die Karte nutzt **Raw Leaflet** (nicht react-leaflet), obwohl react-leaflet installiert ist.
- Static Export: kein Server, kein SSR — alles client-seitig.
- `basePath: '/stahnsdorf'` in Production (GitHub Pages).
- Dynamic Routes nutzen **Server+Client Split**: Server-Component exportiert `generateStaticParams` (aus lokalem JSON), rendert Client-Component (lädt Daten aus Firestore).

### Sprachen
- Unterstützt: `de`, `en`, `fr`, `pl`, `ru`, `sv`
- Fallback: gewünschte Sprache → `de` → erste verfügbare
- `LocaleContext` liefert die aktuelle Sprache im gesamten Component-Tree

### Firebase
- Project-ID: `stahnsdorf-90e03`
- Konfiguration über `NEXT_PUBLIC_FIREBASE_*` Umgebungsvariablen (7 Werte)
- `src/lib/firebase.ts` initialisiert App + Firestore (mit Offline Persistence) + Auth
- **Test-Datenbank / Emulator:** Um lokal zu testen, ohne die echte Datenbank zu beeinflussen, nutzen wir die [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite).
  - Aktiviert in `.env.local` über `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`.
  - Starten mit `npm run emulators`.
- Editor-Whitelist: Collection `editors/{email}` — nur über Firebase Console verwaltbar
- Security Rules: öffentliches Lesen nur für `publish_status == "veröffentlicht"`, Schreiben nur für Editoren
- CLI: `npm run deploy:firestore` deployed Rules + Indexes

### Admin (`/admin`)
- Google-Login mit Editor-Whitelist (`editors/{email}` Dokumente in Firestore)
- Drei-Stufen Publish-Workflow: `entwurf` → `zur_prüfung` → `veröffentlicht`
- POI-Tabelle mit Filter (Typ, Status, Publish-Status, Koordinaten) und Sortierung
- Zwei-Spalten-Editor mit GPS-Koordinaten-Eingabe und Quellen-Liste
- Sammlungen-Editor mit POI-Multi-Select
- Backup/Restore mit Inhalts-Export und vollständigem Backup (roundtrip-fähig)

## Bekannte Probleme

1. **Leaflet-Init-Bug** — React 18 Strict Mode kann Leaflet doppelt initialisieren. Siehe `HANDOVER.md` für Details.

## Entwicklung

```bash
npm install
npm run dev              # Startet Entwicklungsserver
npm run test             # Unit Tests (Vitest)
npm run test:e2e         # E2E Tests (Playwright + Emulator)
npm run test:rules       # Security Rules (Vitest + Emulator)
npm run build            # Static Export nach out/
npm run deploy:firestore # Firestore Rules + Indexes deployen
```
