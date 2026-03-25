# 🪦 Südwestkirchhof Stahnsdorf — Interaktive Karte

Eine interaktive Kartenanwendung für den [Südwestkirchhof Stahnsdorf](https://www.suedwestkirchhof.de/), einen der größten und landschaftlich eindrucksvollsten Friedhöfe Europas (ca. 206 Hektar).

## ✨ Funktionen

- **Interaktive Leaflet-Karte** mit Deep Zoom (bis Stufe 22) für präzise Grabsuche
- **Automatische Spracherkennung** — die App erkennt die Browsersprache und zeigt Inhalte auf Deutsch, Englisch oder Französisch an
- **Globale Suche** — POIs nach Name oder Schlagwort finden, die Karte springt automatisch zum Ergebnis
- **Sammlungen** — thematisch kuratierte Gruppen (z.B. „Kunst & Kultur", „Kriegsgedenken"), um den Friedhof gezielt zu erkunden
- **GPS-Entfernung** — zeigt die Live-Entfernung zum nächsten Grab (Haversine-Berechnung)
- **Zoom-abhängige Labels** — bei niedriger Zoomstufe werden Beschriftungen ausgeblendet, bei Hover/Klick oder hohem Zoom erscheinen sie automatisch

## 🛠 Technologie

| Komponente | Technologie |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (Static Export) |
| Karte | [Leaflet 1.9](https://leafletjs.com/) |
| Sprache | TypeScript, React 18 |
| Hosting | Statische Dateien (GitHub Pages, Netlify, etc.) |

## 📁 Projektstruktur

```
stahnsdorf/
├── data/
│   ├── pois.json            # Alle POIs (Gräber, Gebäude, Denkmäler, …)
│   └── collections.json     # Thematische Sammlungen
├── input/                   # Quelldaten & Schema-Dokumentation
├── src/
│   ├── app/                 # Next.js App Router (Seiten)
│   ├── components/          # React-Komponenten (Karte, Marker, Suche, …)
│   ├── lib/                 # Datenlogik, i18n, GPS-Berechnung
│   └── styles/              # Globale CSS-Stile
├── out/                     # Fertig gebaute statische Seiten (nach `npm run build`)
└── public/                  # Statische Assets
```

## 📊 Datenmodell

Die POI-Datenbank (`data/pois.json`) enthält Einträge mit:

- **Mehrsprachige Texte** (`name`, `summary`, `description`) in DE/EN/FR
- **Koordinatenstatus** (`exact`, `approximate`, `unknown`) — POIs mit `unknown` werden auf der Karte **nicht** angezeigt, bleiben aber in der Datei erhalten
- **Quellenangaben** (`source_refs`) für Nachvollziehbarkeit
- **Personendaten** (`dates`, `primary_person`) für biografische Informationen

Siehe [`input/schema_erweiterungen_suedwestkirchhof.md`](input/schema_erweiterungen_suedwestkirchhof.md) für die vollständige Schemadokumentation.

## 🚀 Lokale Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (Port 3005)
npm run dev -- -p 3005

# Im Browser öffnen
# http://localhost:3005
```

Änderungen an `data/pois.json` werden per Hot Reload sofort im Browser sichtbar.

## 📦 Build & Deployment

```bash
# Statische Seiten erzeugen
npm run build
```

Der Build erstellt den Ordner `out/` mit allen statischen HTML-, CSS- und JS-Dateien. Dieses Verzeichnis kann direkt auf **GitHub Pages**, **Netlify** oder jeden anderen statischen Webserver hochgeladen werden.

### GitHub Pages

1. Repository auf GitHub erstellen
2. `out/`-Ordner als Inhalt des Repositories hochladen
3. In den Repository-Einstellungen → Pages → Quelle auf den Hauptbranch setzen

### Daten aktualisieren

1. `data/pois.json` bearbeiten (z.B. Koordinaten nachtragen)
2. `npm run build` ausführen
3. Aktualisierten `out/`-Ordner erneut hochladen

## 📝 POIs ergänzen

Um neue Koordinaten für einen bestehenden POI nachzutragen:

1. In `data/pois.json` den Eintrag suchen
2. `"coordinates": null` durch `"coordinates": [52.xxxx, 13.xxxx]` ersetzen
3. `"coordinates_status"` von `"unknown"` auf `"exact"` oder `"approximate"` ändern
4. Der POI erscheint beim nächsten Build automatisch auf der Karte

## 📄 Lizenz

Kartendaten: © [OpenStreetMap](https://www.openstreetmap.org/copyright) Mitwirkende