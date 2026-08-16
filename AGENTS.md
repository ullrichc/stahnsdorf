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

Die App funktioniert: Leaflet-Karte mit Markern, kontinuierlicher GPS-Ortung samt Genauigkeitskreis, Sammlungsansicht, POI-Detailkarten mit zugänglicher Bild-Lightbox/Zoom, Sprachumschaltung und lokal gebündelten SVG-Icons. Die redaktionelle Quelle der Wahrheit ist `data/stahnsdorf-backup-translated.json`; **Firestore** ist die Laufzeitkopie für App und Admin und wird clientseitig mit IndexedDB-Offline-Cache gelesen. Ein **Redaktionswerkzeug** (`/admin`) ist implementiert mit Google-Login, Editor-Whitelist, POI-Tabelle mit Filtern, Zwei-Spalten-Editor, Bilderverwaltung, Sammlungen-Editor und atomarem Backup/Restore bis zur Firestore-Batchgrenze.

## Techstack

| Was | Womit |
|---|---|
| Framework | Next.js 16 (Static Export via `output: 'export'`) |
| Karte | Leaflet 1.9, react-leaflet 4 |
| Sprache | TypeScript 6, React 18 |
| Bild-Zoom | react-zoom-pan-pinch |
| Icons | lucide-react (gebündelte SVGs, offline-fähig) |
| Backend | Firebase (Firestore + Auth + Storage — aktiv) |
| Tests | Playwright (77 E2E Tests), Vitest (Unit), Firebase Rules Sandbox |
| CI/CD | GitHub Actions (Tests bei PR/Push, Deploy auf Pages) |
| Hosting | GitHub Pages (Pfad `/stahnsdorf`) |
| Firebase CLI | `firebase-tools` (devDependency, `npm run deploy:firestore`, `npm run deploy:storage`) |

## Projektstruktur

```
stahnsdorf/
├── AGENTS.md                # ⭐ Dieses Dokument — Projektkontext für Agenten
├── firebase.json            # Firebase CLI Config
├── .firebaserc              # Firebase Projekt-Binding
├── firestore.rules          # Firestore Security Rules
├── storage.rules            # Firebase Storage Security Rules für POI-Bilder
├── firestore.indexes.json   # Firestore Composite Indexes
├── data/
│   └── stahnsdorf-backup-translated.json # Redaktioneller Master-Snapshot für POIs, Sammlungen und Bildreferenzen
├── docs/
│   ├── schema.md            # ⭐ Verbindliches Datenmodell — IMMER zuerst lesen
│   └── redaktionelle-leitlinien.md # Regeln für POI-Informationstexte
├── scripts/
│   ├── apply-osm-candidates.mjs # OSM-Kandidaten in Backup-Snapshot übernehmen
│   ├── build-image-import-manifest.mjs # Bilddateien den bestehenden POIs zuordnen
│   ├── prepare-firebase-images.mjs # Optimierte Firebase-Bilddateien lokal vorbereiten
│   ├── apply-image-manifest-to-backup.mjs # Bildreferenzen in den JSON-Master übernehmen
│   ├── import-poi-images.mjs # Lokaler Erstimport optimierter POI-Bilder nach Firebase Storage
│   ├── migrate.ts           # Migrationsscript altes → neues Schema
│   ├── migrate-to-firestore.ts  # Einmalige Migration JSON → Firestore
│   ├── osm-candidates.mjs   # OSM-Audit: Kandidaten exportieren und mit POIs abgleichen
│   └── setup-editors.ts     # Editor-Dokumente in Firestore anlegen
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # Startseite (Karte)
│   │   ├── info/            # Infoseite
│   │   ├── poi/             # Statische Query-Detailseite (`/poi?id=...`) + Legacy-[id]
│   │   ├── sammlung/        # Statische Query-Detailseite (`/sammlung?id=...`) + Legacy-[id]
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
│   │   ├── firebase.ts       # Firebase App + Firestore + Auth + Storage + Offline
│   │   ├── useFirestore.ts   # Hooks: usePOIs, usePOI, useCollections, useCollection
│   │   ├── content.ts        # Alte JSON-basierte Loader (nur noch für Tests)
│   │   ├── types.ts          # TypeScript-Typen — entspricht docs/schema.md ✅
│   │   ├── i18n.ts           # Sprachunterstützung (LocalizedText → String)
│   │   ├── LocaleContext.tsx  # React Context für Sprache
│   │   ├── geo.ts            # GPS-Entfernungsberechnung
│   │   └── useGeolocation.ts
│   └── styles/               # CSS Module
├── public/
│   └──                       # `404.html` wird aus `src/app/not-found.tsx` exportiert
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
| `koordinaten_quelle` | object \| null | Herkunft der aktuell gespeicherten GPS-Koordinate |
| `lagehinweis` / `lagehinweis_quelle` | string | Grabstellenangabe ohne GPS und deren Quelle |
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
- **`data/stahnsdorf-backup-translated.json` ist die redaktionelle Quelle der Wahrheit für Inhalte.** Alle relevanten POI-Daten inklusive `bilder`-Referenzen müssen dort abgelegt sein. Firestore darf keine exklusiven Inhaltsdaten enthalten.
- **`docs/redaktionelle-leitlinien.md` gilt für POI-Texte.** Kurztexte verwenden kein „Grab von“. Beschreibungen sollen 1-2 prägnante Sätze sein und keine UI-Felder wie Name, Lebensdaten oder Lage wiederholen.
- Deutsch ist die Quellsprache. Andere Sprachen (en, fr, pl, ru, sv) werden per KI generiert.
- Nur POIs mit `koordinaten != null` erscheinen auf der Karte.
- POIs ohne Koordinaten bleiben in der Datenbank bis sie vor Ort ermittelt werden.

### Code
- `src/lib/types.ts` definiert die TypeScript-Typen — **muss mit `docs/schema.md` übereinstimmen.**
- `src/lib/useFirestore.ts` enthält die Hooks für Firestore-Zugriff (visitor + admin).
- `src/lib/content.ts` liest den JSON-Master für Tests und statische Parameter; die App lädt zur Laufzeit die daraus abgeleitete Firestore-Kopie.
- Die Karte nutzt **Raw Leaflet** (nicht react-leaflet), obwohl react-leaflet installiert ist.
- Static Export: kein Server, kein SSR — alles client-seitig.
- `basePath: '/stahnsdorf'` in Production (GitHub Pages).
- Laufzeit-IDs nutzen statische Query-Routen: `/poi?id=<id>`, `/sammlung?id=<id>` und `/admin/poi/edit?id=<id>`. Dadurch funktionieren neu in Firestore angelegte Inhalte ohne neuen Build. Die alten `[id]`-Routen bleiben als Legacy-Export bestehen; `src/app/not-found.tsx` konvertiert unbekannte alte Pfade.
- Firestore-Hooks unterscheiden Netzwerkfehler von „nicht gefunden“, bieten Retry und ignorieren Ergebnisse nach dem Unmount.

### Sprachen
- Unterstützt: `de`, `en`, `fr`, `pl`, `ru`, `sv`
- Fallback: gewünschte Sprache → `de` → erste verfügbare
- `LocaleContext` liefert die aktuelle Sprache im gesamten Component-Tree

### Firebase
- Project-ID: `stahnsdorf-90e03`
- Konfiguration über `NEXT_PUBLIC_FIREBASE_*` Umgebungsvariablen inkl. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `src/lib/firebase.ts` initialisiert App + Firestore (mit Offline Persistence) + Auth + Storage
- **Test-Datenbank / Emulator:** Um lokal zu testen, ohne die echte Datenbank zu beeinflussen, nutzen wir die [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite).
  - Aktiviert in `.env.local` über `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`.
  - Starten mit `npm run emulators`.
- Editor-Whitelist: Collection `editors/{email}` — nur über Firebase Console verwaltbar
- Firestore Rules: öffentliches Lesen nur für `publish_status == "veröffentlicht"`, Schreiben nur für Editoren
- Storage Rules: POI-Bilder öffentlich lesbar, Schreiben/Löschen nur für Editoren unter `poi-images/{poiId}/...`
- CLI: `npm run deploy:firestore` deployed Firestore Rules + Indexes, `npm run deploy:storage` deployed Storage Rules

### Admin (`/admin`)
- Google-Login mit Editor-Whitelist (`editors/{email}` Dokumente in Firestore)
- Drei-Stufen Publish-Workflow: `entwurf` → `zur_prüfung` → `veröffentlicht`
- POI-Tabelle mit Filter (Typ, Status, Publish-Status, Koordinaten) und Sortierung
- Zwei-Spalten-Editor mit GPS-Koordinaten-Eingabe, Koordinaten-Herkunft, Lagehinweisen, Bilderverwaltung und Quellen-Liste
- Sammlungen-Editor mit POI-Multi-Select
- Backup/Restore mit Inhalts-Export und vollständigem Firestore-Backup; Bilddateien aus Storage bleiben separate Medienobjekte
- Restore und POI-Löschung verwenden atomare Firestore-Batches. Restore wird vor dem Schreiben abgelehnt, wenn mehr als 500 Operationen nötig wären.
- Bild-Metadaten werden im Formular gesammelt und mit „Speichern“ geschrieben; Upload, Reihenfolge und Entfernen bleiben unmittelbare Aktionen.

## Bekannte Probleme

1. **Leaflet-Init-Bug** — React 18 Strict Mode kann Leaflet doppelt initialisieren. Siehe `HANDOVER.md` für Details.

## Entwicklung

```bash
npm install
npm run dev              # Startet Entwicklungsserver
npm run coordinates:metadata # Koordinaten-Herkunft und Lagehinweise aus Bestand ableiten
npm run coordinates:manual-osmand # Manuell per OsmAnd erfasste GPS-Daten einspielen
npm run osm:candidates   # OSM-Kandidaten-Audit nach inputdata/
npm run osm:apply        # OSM-Kandidaten in data/stahnsdorf-backup-translated.json übernehmen
npm run images:manifest  # Bilddateien den bestehenden POIs zuordnen
npm run images:prepare   # Optimierte Anzeige-/Vorschaubilder lokal vorbereiten
npm run images:apply     # Dry-Run: Bildreferenzen in JSON-Master übernehmen
npm run import:images    # Dry-Run für POI-Bildimport nach Firebase Storage/Firestore
npm run test             # Unit Tests (Vitest)
npm run typecheck        # TypeScript ohne Ausgabe prüfen
npm run test:e2e         # E2E Tests (Playwright + Emulator)
npm run test:rules       # Security Rules (Vitest + Emulator)
npm run build            # Static Export nach out/
npm run verify:export    # Query-Routen, 404, Offline-Fonts und Zoom im Export prüfen
npm run deploy:firestore # Firestore Rules + Indexes deployen
npm run deploy:storage   # Storage Rules deployen
```

Der GitHub-Pages-Deploy läuft über `workflow_run` erst nach erfolgreicher vollständiger Test-Suite inklusive Production-Build und Exportprüfung.
