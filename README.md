# 🪦 Südwestkirchhof Stahnsdorf — Web App & Redaktionswerkzeug

Eine interaktive Kartenanwendung und POI-Datenbank für den [Südwestkirchhof Stahnsdorf](https://www.suedwestkirchhof.de/), einen der größten und landschaftlich eindrucksvollsten Friedhöfe Europas (ca. 206 Hektar). Das System besteht aus einer dynamischen Visitor-App und einem integrierten Redaktionswerkzeug für die Verwaltung der Daten.

## ✨ Funktionen - Visitor App
- **Interaktive Leaflet-Karte** mit Deep Zoom (bis Stufe 22) für präzise Grabsuche
- **Live-Daten aus Firestore** — POIs und Sammlungen werden in Echtzeit geladen
- **Offline-Unterstützung** — Daten werden via IndexedDB zwischengespeichert
- **Automatische Spracherkennung** — Anzeige auf Deutsch, Englisch oder Französisch
- **Globale Suche** — POIs nach Name finden
- **Sammlungen** — thematisch kuratierte Gruppen (z.B. „Kunst & Kultur")
- **GPS-Entfernung** — zeigt die Live-Entfernung zum nächsten Ziel

## 🔒 Redaktionswerkzeug (`/admin`)
- **Sicherer Zugang** — Google-Login gekoppelt mit Editor-Whitelist (Firestore `editors`)
- **POI-Management** — Tabelle mit Filterung (Typ, Status, Publish, Koordinaten) und Sortierung
- **Zwei-Spalten-Editor** — Intuitive Eingabe von mehrsprachigen Texten, Geodaten, Koordinaten-Herkunft, Lagehinweisen und Referenzen
- **Publish-Workflow** — `Entwurf` → `Zur Prüfung` → `Veröffentlicht` (nur veröffentlichte Daten sind öffentlich sichtbar)
- **Sammlungen-Editor** — Einfache Zuordnung von POIs zu thematischen Sammlungen
- **Bilderverwaltung** — POI-Bilder direkt hochladen, nachweisen und in der App anzeigen
- **Backup & Restore** — JSON-Export der Inhaltsdaten und vollständige Roundtrip-Backups; Bilddateien bleiben separat in Storage bzw. lokal gesichert

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
npm run test:e2e     # E2E Playwright Tests (startet den Emulator automatisch)
npm run test:rules   # Firestore Security Rules Tests (startet Emulator automatisch)
```

## 📦 Build & Deployment

Das Deployment erfolgt automatisiert via **GitHub Actions** (`.github/workflows/deploy.yml`) bei jedem Push auf den `main`-Branch, *nachdem* alle Tests im PR/Push-Workflow (`test.yml`) erfolgreich den Local Emulator passiert haben. 

**Voraussetzung:** Die Firebase Environment-Variablen müssen als **Repository Secrets** in GitHub hinterlegt sein.

Manuelles Build:
```bash
npm run build
```

## 📊 Datenmodell & Firebase Setup

Die zentrale Quelle der Wahrheit für das Datenmodell ist `docs/schema.md`.
Die TypeScript-Typen in `src/lib/types.ts` müssen **immer** mit dem Schema synchron gehalten werden (`POI`, `Collection`, `FirestorePOI`).
Redaktionelle Regeln für POI-Informationstexte stehen in `docs/redaktionelle-leitlinien.md`.

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

Dabei werden bestehende POIs mit OSM-Koordinaten und Quellen aktualisiert und neue POIs mit mehrsprachigen Grundtexten ergänzt.

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

### Security Rules Deploy
Wenn sich die Firebase Security Rules (`firestore.rules`, `storage.rules`) oder Indexe (`firestore.indexes.json`) ändern:
```bash
npm run deploy:firestore
npm run deploy:storage
npm run deploy:firebase   # Firestore + Storage zusammen
```

### POI-Bilder importieren
Der Erstimport liest die lokalen Originale aus `inputdata/bilder`, erzeugt optimierte Anzeige- und Vorschauversionen und ergänzt die POI-Bildreferenzen. Ohne `--apply` läuft der Import als Dry-Run und schreibt nur Reports:

```bash
npm run import:images
npm run import:images -- --apply
```

Die Originaldateien bleiben lokal unverändert. Das JSON-Backup enthält Bildreferenzen und Nachweise, aber keine Binärdateien aus Firebase Storage.

## 📄 Lizenz
Kartendaten: © [OpenStreetMap](https://www.openstreetmap.org/copyright) Mitwirkende
