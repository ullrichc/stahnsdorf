# 🪦 Südwestkirchhof Stahnsdorf — Web App & Redaktionswerkzeug

Eine interaktive Kartenanwendung und POI-Datenbank für den [Südwestkirchhof Stahnsdorf](https://www.suedwestkirchhof.de/), einen der größten und landschaftlich eindrucksvollsten Friedhöfe Europas (ca. 206 Hektar). Das System besteht aus einer dynamischen Visitor-App und einem integrierten Redaktionswerkzeug für die Verwaltung der Daten.

## ✨ Funktionen - Visitor App
- **Interaktive Leaflet-Karte** mit CARTO Dark Matter, lokalem OSM-Overlay für Friedhofsfläche und Wege, kompakten SVG-Markern und Deep Zoom bis Stufe 22; eine frische Sitzung startet an der Friedhofskapelle auf der beschrifteten Zoomstufe 19
- **Live-Daten aus Firestore** — POIs und Sammlungen werden in Echtzeit geladen
- **Offline-Unterstützung** — Daten werden via IndexedDB zwischengespeichert
- **Automatische Spracherkennung** — Anzeige auf Deutsch, Englisch, Französisch, Polnisch, Russisch oder Schwedisch
- **Globale Suche** — einklappbare Namenssuche mit direktem Kartenfokus
- **Sammlungen** — thematisch kuratierte Gruppen mit Beschreibung, GPS-Ortsliste und Karte
- **POI-Bilder** — Detailseiten zeigen Bilder mit Lightbox, Zoom und Verschieben
- **Vor-Ort-Ortung** — kontinuierliche hochgenaue Position mit Genauigkeitskreis; ein beim Start verfügbarer GPS-Fix innerhalb der Friedhofsgrenze ersetzt automatisch den Kapellenfokus
- **Offline-taugliche Oberfläche** — Firestore-Cache, Retry-Zustände und lokal gebündelte SVG-Icons

## 🔒 Redaktionswerkzeug (`/admin`)
- **Sicherer Zugang** — Google-Login gekoppelt mit Editor-Whitelist (Firestore `editors`)
- **POI-Management** — Tabelle mit Filterung (Typ, Status, Publish, Koordinaten) und Sortierung
- **Zwei-Spalten-Editor** — Intuitive Eingabe von mehrsprachigen Texten, Geodaten, Koordinaten-Herkunft, Lagehinweisen und Referenzen
- **Publish-Workflow** — `Entwurf` → `Zur Prüfung` → `Veröffentlicht` (nur veröffentlichte Daten sind öffentlich sichtbar)
- **Sammlungen-Editor** — Einfache Zuordnung von POIs zu thematischen Sammlungen
- **Bilderverwaltung** — POI-Bilder direkt hochladen, nachweisen und in der App anzeigen
- **Backup & Restore** — JSON-Export der Inhaltsdaten und vollständige Roundtrip-Backups; Bilddateien bleiben separat in Storage bzw. lokal gesichert
- **Sichere Schreibvorgänge** — POI-Löschung bereinigt Collection-Referenzen atomar; Restore schreibt bis maximal 500 Operationen vollständig oder gar nicht

## 🛠 Technologie
| Komponente | Technologie |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (Static Export) |
| Karte | [Leaflet 1.9](https://leafletjs.com/) |
| Sprache | TypeScript, React 18 |
| Backend | Firebase (Firestore, Auth, Storage) |
| Tests | Playwright (E2E), Vitest (Unit), Firebase Rules Sandbox |
| Automatisierung | GitHub Actions für CI (Tests) und Deploy auf GitHub Pages |

## 🚀 Lokale Entwicklung

### Setup
1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Umgebungsvariablen einrichten:**
   Erstelle eine `.env.local` im Stammverzeichnis basierend auf `.env.example`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
   # ...weitere Felder
   ```

### Starten (Normal / Production-Daten)
```bash
npm run dev
# App: http://localhost:3000
# Admin: http://localhost:3000/admin
```

### Starten (Test-Datenbank / Emulator)
Um bei der lokalen Entwicklung nicht die echte Datenbank zu verändern, nutzt das Projekt die Firebase Local Emulator Suite. *(Hinweis: Setzt voraus, dass Java installiert ist).*
1. In der `.env.local` sicherstellen, dass `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` gesetzt ist.
2. In einem separaten Terminal die Emulator Suite starten:
   ```bash
   npm run emulators
   ```
3. Testdaten (aktueller JSON-Stand) in den Emulator laden (optional, da der Emulator anfangs leer ist):
   ```bash
   npm run emulators:seed
   ```
4. Die App starten (`npm run dev`). Alles läuft nun sicher in der lokalen Sandbox.

### Tests ausführen
Das Projekt verfügt über eine umfassende Test-Suite (`Unit`, `E2E`, `Rules`), die komplett automatisiert und in CI (GitHub Actions) eingebunden ist. Die Integrationstests (`E2E` & `Rules`) laufen per CLI isoliert gegen die **Firebase Emulator Suite**.

```bash
npm run test         # Unit Tests (via Vitest)
npm run typecheck    # TypeScript prüfen
npm run test:e2e     # E2E Playwright Tests (startet den Emulator automatisch)
npm run test:rules   # Firestore Security Rules Tests (startet Emulator automatisch)
npm run build        # Production Static Export
npm run verify:export # Export-Routen, 404-Fallback, Icons und Browser-Zoom prüfen
npm run map:overlay  # Statisches OSM-Karten-Overlay bewusst aktualisieren
```

## 📦 Build & Deployment

Das Deployment erfolgt automatisiert via **GitHub Actions** (`.github/workflows/deploy.yml`) nach einem erfolgreichen Lauf des Workflows `test.yml` auf `main`. Der Test-Workflow führt Unit-, TypeScript-, Rules- und E2E-Tests sowie den Production-Build und eine Prüfung des Export-Artefakts aus.

Die Installation unter `https://www.suedwestkirchhof.de/stahnsdorf/` und ein mögliches automatisches Deployment auf den Webserver sind in [`docs/deployment-suedwestkirchhof.md`](docs/deployment-suedwestkirchhof.md) beschrieben.

### Statisches Karten-Overlay

`public/map-overlay.geojson` enthält die Friedhofsfläche aus [OSM-Way 25029213](https://www.openstreetmap.org/way/25029213) sowie die darin verlaufenden Wege. Die Datei wird mit `npm run map:overlay` über Overpass neu erzeugt, an der Friedhofsgrenze abgeschnitten, auf sechs Nachkommastellen gerundet und stabil sortiert. Dieser Befehl ist nur nötig, wenn sich das OSM-Wegenetz geändert hat; Entwicklung, Build und App laden keine Daten von Overpass.

Die Fläche ist in allen Zoomstufen sichtbar. Hauptwege (`service`, `pedestrian`) erscheinen ab Zoom 15, kleinere Wege ab Zoom 17. Die Exportprüfung begrenzt das Overlay auf 350 KB. OSM-Quelle, Datenstand und Erzeugungszeit bleiben als Metadaten in der Datei erhalten; die Attribution wird in der Karte angezeigt.

**Voraussetzung:** Die Firebase Environment-Variablen müssen als **Repository Secrets** in GitHub hinterlegt sein.

Manuelles Build:
```bash
npm run build
```

## 📊 Datenmodell & Firebase Setup

Die zentrale Quelle der Wahrheit für das Datenmodell ist `docs/schema.md`.
Die zentrale Quelle der Wahrheit für die Inhalte ist `data/stahnsdorf-backup-translated.json`. Firestore ist die Laufzeitkopie für App und Admin, darf aber nicht der einzige Ort für redaktionelle Daten sein.
Die TypeScript-Typen in `src/lib/types.ts` müssen **immer** mit dem Schema synchron gehalten werden (`POI`, `Collection`, `FirestorePOI`).
Redaktionelle Regeln für POI-Texte, Quellen und Sammlungsbeschreibungen stehen in `docs/redaktionelle-leitlinien.md`.

POI- und Sammlungsdetails verwenden statische Query-Routen (`/poi?id=…`, `/sammlung?id=…`, `/admin/poi/edit?id=…`). So sind neue Firestore-Dokumente im statischen GitHub-Pages-Export sofort erreichbar. Alte Pfad-Links werden vom exportierten 404-Fallback auf die kanonischen Query-Routen umgeleitet.

### OSM-Kandidaten exportieren
OpenStreetMap kann als vertrauenswürdige Quelle für zusätzliche Gräber, Denkmäler, Mausoleen und Anlagen ausgewertet werden. Der Audit-Export liest alle OSM-Kandidaten innerhalb der OSM-Friedhofsfläche, gleicht sie mit dem vollständigen lokalen POI-Backup ab und schreibt eine Kandidatenliste mit importfähigen neuen POI-Vorschlägen:

```bash
npm run osm:candidates
```

Ausgaben:
- `inputdata/osm-poi-candidates.json` — vollständiger Audit mit OSM-Kandidaten, Match-Status, Vorschlägen und Quellen
- `inputdata/osm-poi-candidates.md` — lesbarer Kurzbericht für die Redaktion

Die geprüften OSM-Kandidaten können anschließend in den lokalen Backup-Snapshot übernommen werden:

```bash
npm run osm:apply
```

Dabei werden bestehende POIs mit OSM-Koordinaten und strukturierter Koordinatenherkunft aktualisiert und neue POIs mit mehrsprachigen Grundtexten ergänzt.

OSM-Belege erscheinen nicht in der öffentlichen Quellenliste. Der vollständige technische Beleg wird intern im `notiz`-Quellenarchiv gesichert; Node, Way oder Relation und das Übernahmedatum bleiben strukturiert in `koordinaten_quelle` gespeichert.

### Koordinaten-Herkunft strukturieren
Der lokale Backup-Snapshot kann aus bestehenden Quellen und Notizen strukturierte Felder für GPS-Herkunft und Lagehinweise ableiten:

```bash
npm run coordinates:metadata
```

Der Befehl ergänzt `koordinaten_quelle`, `lagehinweis` und `lagehinweis_quelle`, ohne bestehende Freitext-Quellen oder Notizen zu entfernen.

### Manuelle OsmAnd-Koordinaten einspielen
Manuell vor Ort erfasste Geo-Links aus `inputdata/neue_Koordinaten_über_OSM.txt` können in den lokalen Backup-Snapshot übernommen werden:

```bash
npm run coordinates:manual-osmand
```

Der Import überschreibt keine Koordinaten mit `koordinaten_quelle.typ` `osm` oder `wo-sie-ruhen`. Neue manuelle Einträge werden mit `koordinaten_quelle.typ` `manuell-osmand` dokumentiert.

### Redaktionelle Daten bereinigen

Die abgestimmten Quellenregeln und mehrsprachigen Sammlungsbeschreibungen können reproduzierbar auf den JSON-Master angewendet werden:

```bash
npm run editorial:cleanup
```

Der idempotente Lauf entfernt Grabstättenplan-, OpenStreetMap- und manuelle OsmAnd-Verweise aus der öffentlichen Quellenliste, archiviert entfernte Angaben in `notiz`, formatiert Quellen-Datumsangaben deutsch und setzt die Beschreibungen aller zwölf Sammlungen in den sechs Zielsprachen.

### Security Rules Deploy
Wenn sich die Firebase Security Rules (`firestore.rules`, `storage.rules`) oder Indexe (`firestore.indexes.json`) ändern:
```bash
npm run deploy:firestore
npm run deploy:storage
npm run deploy:firebase   # Firestore + Storage zusammen
```

### POI-Bilder importieren
Der Erstimport liest lokale Originale aus einem Fotoordner, erzeugt optimierte Anzeige- und Vorschauversionen und ergänzt die POI-Bildreferenzen zuerst im JSON-Master. Ohne `--apply` laufen die Schreibschritte als Dry-Run:

```bash
npm run images:manifest
npm run images:prepare
npm run images:apply
npm run images:apply -- --apply
npm run import:images
npm run import:images -- --apply
```

Weitere Aufnahme-Batches werden auf Basis des bestehenden Gesamtmanifests ergänzt. Die führenden Plan-Nummern müssen nur innerhalb eines Fotoordners eindeutig sein; ein bereits verarbeiteter Quellordner wird abgelehnt:

```bash
npm run images:manifest -- \
  --old-manifest inputdata/bilder-import-manifest.json \
  --input inputdata/0816bilder \
  --output inputdata/bilder-import-manifest.json
```

`images:prepare` wendet EXIF-Orientierung an und schreibt daraus neue JPEGs. Ein im Importmanifest ausdrücklich gesetzter `nachweis` hat Vorrang vor dem Urheber aus den Bildmetadaten und dem Standardnachweis. `images:apply` schreibt die Bildreferenzen aus `inputdata/firebase-bilder-manifest.json` nach `data/stahnsdorf-backup-translated.json`. Die App kann Bilder nur anzeigen, wenn die POI-Daten explizite `bilder`-Einträge enthalten; aus der POI-ID wird keine Bildliste automatisch abgeleitet. Die Originaldateien bleiben lokal unverändert. Das JSON-Backup enthält Bildreferenzen und Nachweise, aber keine Binärdateien aus Firebase Storage. Bereits importierte Storage-Dateien können mit `npm run import:images -- --apply --force` gezielt überschrieben werden. Für alle Schritte muss derselbe Firebase-Bucket verwendet werden; bei CLI-Aufrufen kann er mit `--bucket <bucket-name>` explizit gesetzt werden.

## 📄 Lizenz
Kartendaten: © [OpenStreetMap](https://www.openstreetmap.org/copyright) Mitwirkende, © [CARTO](https://carto.com/attributions)
