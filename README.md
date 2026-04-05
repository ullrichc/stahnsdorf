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
- **Zwei-Spalten-Editor** — Intuitive Eingabe von mehrsprachigen Texten, Geodaten und Referenzen
- **Publish-Workflow** — `Entwurf` → `Zur Prüfung` → `Veröffentlicht` (nur veröffentlichte Daten sind öffentlich sichtbar)
- **Sammlungen-Editor** — Einfache Zuordnung von POIs zu thematischen Sammlungen
- **Backup & Restore** — JSON-Export der Inhaltsdaten und vollständige Roundtrip-Backups

## 🛠 Technologie
| Komponente | Technologie |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (Static Export) |
| Karte | [Leaflet 1.9](https://leafletjs.com/) |
| Sprache | TypeScript, React 18 |
| Backend | Firebase (Firestore, Auth) |
| Tests | Vitest (48 Unit- und Integrationstests) |
| Automatisierung | GitHub Actions für automatisiertes Deploy auf GitHub Pages |

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
   # ...weitere Felder
   ```

3. **Entwicklungsserver starten:**
   ```bash
   npm run dev
   # App: http://localhost:3000
   # Admin: http://localhost:3000/admin
   ```

### Tests ausführen
Das Projekt verfügt über umfassende Unit/Integration-Tests.
```bash
npm run test
```

## 📦 Build & Deployment

Das Deployment erfolgt automatisiert via **GitHub Actions** (`.github/workflows/deploy.yml`) bei jedem Push auf den `main`-Branch. Der Workflow baut den Static Export (`npm run build`) und lädt ihn auf GitHub Pages hoch. 

**Voraussetzung:** Die Firebase Environment-Variablen müssen als **Repository Secrets** in GitHub hinterlegt sein.

Manuelles Build:
```bash
npm run build
```

## 📊 Datenmodell & Firebase Setup

Die zentrale Quelle der Wahrheit für das Datenmodell ist `docs/schema.md`.
Die TypeScript-Typen in `src/lib/types.ts` müssen **immer** mit dem Schema synchron gehalten werden (`POI`, `Collection`, `FirestorePOI`).

### Security Rules Deploy
Wenn sich die Firebase Security Rules (`firestore.rules`) oder Indexe (`firestore.indexes.json`) ändern:
```bash
npm run deploy:firestore
```

## 📄 Lizenz
Kartendaten: © [OpenStreetMap](https://www.openstreetmap.org/copyright) Mitwirkende