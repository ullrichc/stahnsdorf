# Stahnsdorf Südwestkirchhof - Kartenanalyse-Bericht

**Quellseite:** https://www.wo-sie-ruhen.de/friedhof?id=18
**Analysedatum:** 2026-04-04
**Methode:** Statische HTML/JS-Analyse + JSONP-API-Abfrage

---

## 1. Gefundene Datenquellen

### Primärquelle: JSONP-API

| Endpunkt | Zweck |
|----------|-------|
| `https://www.wo-sie-ruhen.de/newapi?graveyard=18` | Friedhofsdaten + alle Grabstellen (Hauptquelle für Kartendaten) |
| `https://www.wo-sie-ruhen.de/newapi?grave={ID}` | Einzelne Grabstelle (Detail-Modal) |
| `https://www.wo-sie-ruhen.de/wsr-search?search={query}` | Globale Suche |

**Datenformat:** JSONP (jQuery AJAX mit `dataType: 'jsonp'`)
**Kein GeoJSON-Endpunkt vorhanden.** Alle Geodaten sind direkt in den Grabobjekten als `geolat`/`geolong`-Felder eingebettet.

### Sekundärquelle: PDF-Friedhofsplan
- **URL:** `https://www.wo-sie-ruhen.de/_media/pdf/18-1653927548.pdf`
- **Bezeichnung auf der Seite:** "Friedhofsplan & Erläuterungen"
- **Status:** Nicht programmatisch analysiert (keine OCR durchgeführt, da strukturierte API-Daten verfügbar)

---

## 2. Marker-Extraktion aus JS/API

**Ergebnis: Erfolgreich.** Alle 27 Marker konnten vollständig aus der JSONP-API extrahiert werden.

### Technischer Ablauf der Kartenlogik

1. Seite prüft Cookie: `$.cookie("mapSettings") == 'mapOn'`
2. Bei Zustimmung: Leaflet-Karte wird im Container `#graveYardMap` initialisiert
3. OpenStreetMap HOT Tiles von `https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png`
4. JSONP-Call an `newapi?graveyard=18` liefert `graveyard.graves[]` (27 Einträge)
5. Schleife `$.each(graveyard.graves, ...)` erstellt:
   - Popup-HTML mit Name, Beruf, Bild
   - Marker-Icon `marker{i+1}` (nummerierte PNGs)
   - `L.marker([grave.geolat, grave.geolong])` mit Popup → `graves` LayerGroup
6. Karte wird auf Friedhofszentrum zentriert: `[52.39000, 13.17700]`, Zoom 17

### Marker-Icons
- 50 Icon-Dateien vordefiniert: `images/map/maker_1.png` bis `images/map/maker_50.png`
- Hinweis: Tippfehler "maker" statt "marker" im Original
- Custom Icon-Klasse `wsrIcon` mit `iconSize: [35,35]`, `iconAnchor: [12,35]`

---

## 3. Tatsächlich vorhandene Felder pro Grab

| Feld | Vorhanden | Quelle | Anmerkung |
|------|-----------|--------|-----------|
| `ID` | Ja | API | Interne numerische ID (367-397) |
| `ordering` | Ja | API | Reihenfolge/Marker-Nummer (1-27) |
| `vorname` | Ja | API | Vorname(n) |
| `name` | Ja | API | Nachname |
| `beruf` | Ja | API | Berufsbezeichnung |
| `geolat` | Ja | API | Breitengrad (alle 27 haben Werte) |
| `geolong` | Ja | API | Längengrad (alle 27 haben Werte) |
| `lage` | Ja | API (Detail) | Block/Feld/Grabstelle |
| `ehrengrab` | Ja | API | 0 oder 1 |
| `zoom_pic` | Ja | API | Semikolon-getrennte Bildnamen |
| `berufkat` | Ja | API | Numerische Berufskategorie |
| `grabid` | Ja | API | Meist leer |
| `audio` | Ja | API (Detail) | OGG/MP3 Audiodateien |
| `architekt` | Ja | API (Detail) | Grabmal-Architekt |
| `autor` | Ja | API (Detail) | Textautor |
| `geburtsdatum` | Ja | API (Detail) | Geburtsdatum |
| `sterbedatum` | Ja | API (Detail) | Sterbedatum |
| `state` | Ja | API | Status-Flag |
| `hightlight` | Ja | API | Highlight-Flag (Tippfehler im Original) |
| `name2/vorname2/...` | Ja | API (Detail) | Optionale zweite bestattete Person |
| `category` | Nein | — | Kein explizites Kategoriefeld; `berufkat` ist numerisch ohne Label-Mapping |
| `slug` | Nein | — | Keine Slug-URLs; Detailansicht per Modal (`data-id`) |
| `detail_page_url` | Nein | — | Keine eigene Detailseite; nur Modal-Popup per AJAX |

---

## 4. Ehrengrabstätten

Aus der API sind **11 von 27 Grabstellen** als Ehrengrab markiert (`ehrengrab: 1`):

| # | Name | Lage |
|---|------|------|
| 2 | Edmund Rumpler | Block Reformation, Gartenblock III |
| 5 | Carl Ludwig Schleich | Block Erlöser, Gartenblock I |
| 6 | Engelbert Humperdinck | Block Erlöser, Feld 4 |
| 8 | Friedrich Wilhelm Murnau | Block Schöneberg, Feld 3a |
| 11 | Lovis Corinth | Block Trinitatis, Feld 8 |
| 12 | Max Jordan | Block Trinitatis, Feld 21 |
| 13 | Philipp Wilhelm Adolf Bastian | Block Trinitatis, Feld 21 |
| 16 | Elisabeth Baronin von Ardenne | Block Trinitatis, Gartenblock V |
| 17 | Rudolf Breitscheid | Lietzensee, Feld 22 |
| 22 | Heinrich Rudolf Zille | Epiphanien, Feld 14 |
| — | (Überraschend kein Ehrengrab:) Werner von Siemens | Block Trinitatis, Feld 3a |

**Hinweis:** Das `ehrengrab`-Feld ist ein explizites API-Feld (0/1), nicht abgeleitet.

---

## 5. Marker nur im PDF vs. nur auf der Karte

### Karte (API)
- **27 POIs** mit exakten Koordinaten, vollständig aus `newapi?graveyard=18`
- Alle 27 werden als Leaflet-Marker auf der Karte angezeigt

### PDF-Plan
- **Nicht programmatisch analysiert** (OCR wurde nicht durchgeführt)
- Der PDF-Friedhofsplan (`18-1653927548.pdf`) enthält vermutlich eine Übersichtskarte mit numerierten Positionen
- Es ist **wahrscheinlich**, dass der PDF-Plan dieselben 27 Grabstellen zeigt (da die Nummern 1-27 den `ordering`-Werten entsprechen)
- Es ist **möglich**, dass der PDF-Plan zusätzliche Grabstellen enthält, die nicht in der API sind (z.B. historische Gräber ohne digitalen Eintrag)
- **Ohne OCR-Analyse kann keine belastbare Aussage über PDF-exklusive Einträge getroffen werden**

### Einschätzung
| Quelle | POI-Anzahl | Koordinaten | Zuverlässigkeit |
|--------|------------|-------------|-----------------|
| API/Karte | 27 | Alle exakt vorhanden | Hoch |
| PDF | Unbekannt | Nicht extrahiert | Nicht bewertet |

---

## 6. Dubletten-Analyse

### Nahe beieinander liegende Grabstellen
- **Jordan (382)** und **Bastian (383)**: Beide Block Trinitatis, Feld 21; Abstand ~30m → **Keine Dublette**, sondern benachbarte Gräber
- **Kuhnert (393)**, **Essen (394)**, **Krebs (395)**: Alle Block Epiphanien, Gbl./Gartenblock I; Abstand untereinander ~30-40m → **Keine Dubletten**, benachbarte Gräber
- **Schaarwächter (390)** und **Richthofen (391)**: Beide Alte Umbettung; Abstand ~50m → **Keine Dublette**

### Schreibweisen-Varianten
- **Werner von Siemens** (API: "Ernst Werner von Siemens") — gebräuchlicher Name weicht ab
- **Murnau** (API: "Friedrich Wilhelm Murnau") — bekannt als "F.W. Murnau"
- **Zille** (API: "Heinrich Rudolf Zille") — bekannt als "Heinrich Zille"
- **Richthofen** (API: "Ferdinand Freiherr von Richthofen") — der Geograph, nicht der Pilot

**Ergebnis: Keine Dubletten identifiziert.** Alle 27 Einträge sind einzigartige Personen an eindeutigen Standorten.

---

## 7. Relevante Netzwerk-Requests

| Request | Typ | Relevanz |
|---------|-----|----------|
| `newapi?graveyard=18` | JSONP | **Haupt-Datenquelle** für alle 27 Marker |
| `newapi?grave={ID}` | JSONP | Detail-Daten (lage, ehrengrab, audio etc.) |
| `wsr-search?search=...` | JSONP | Globale Suche (nicht kartenbezogen) |
| `{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png` | Tile | Kartenhintergrund |
| `_media/pics/_sm/{filename}` | Image | Grabbilder |

---

## 8. Unsicherheiten und Lücken

1. **Koordinaten-Varianz bei ID 397 (Hanussen):** Der Graveyard-API-Aufruf und der individuelle Grave-API-Aufruf lieferten leicht abweichende Koordinaten. Die Werte aus der individuellen Grave-API (52.39061, 13.18382) wurden als autoritativ verwendet.

2. **graveGroups-Struktur:** Der JS-Code referenziert `graveyard.graveGroups` für die Karussell-Darstellung (nach Berufskategorie gruppiert). Diese Gruppierung konnte nicht vollständig extrahiert werden, ist aber nur für die Anzeige relevant, nicht für die Kartenmarker.

3. **berufkat-Mapping:** Die numerische Berufskategorie (`berufkat`) hat kein sichtbares Label-Mapping im Code. Die Kategoriebezeichnungen werden vermutlich über `graveGroups[i].grouptitle` geliefert.

4. **PDF-Inhalt:** Der Friedhofsplan wurde nicht analysiert. Es ist nicht ausgeschlossen, dass er zusätzliche Grabstellen enthält.

5. **Keine Slug/Permalink-URLs:** Die Seite verwendet ausschließlich modale AJAX-Popups (`data-id`). Es gibt keine individuellen Detailseiten-URLs für einzelne Grabstellen.

6. **Consent-Abhängigkeit:** Die Karte und ihre Marker werden erst nach Cookie-Zustimmung geladen. Die API-Daten selbst sind jedoch ohne Consent abrufbar.

7. **Marker-Icon-Zuordnung:** Die Icons `maker_1.png` bis `maker_27.png` werden den Gräbern in der Reihenfolge ihres `ordering`-Wertes zugewiesen. Es gibt 50 vordefinierte Icons, obwohl nur 27 verwendet werden.

---

## 9. Zusammenfassung

- **27 POIs** vollständig aus der JSONP-API extrahiert
- **Alle 27 haben exakte Koordinaten** (geolat/geolong)
- **11 als Ehrengrab markiert** (explizites API-Feld)
- **Keine Dubletten** identifiziert
- **Keine externen JS-Dateien** — gesamte Logik inline
- **Kein GeoJSON** — Daten als JSONP-Objekte
- **PDF nicht analysiert** — strukturierte Daten aus API waren ausreichend
- **Datenqualität: Hoch** — direkt aus der produktiven API extrahiert

---

## 10. Merge-Ergebnis (2026-04-04)

Die extrahierten Scraping-Daten wurden mit `scripts/merge-pois.mjs` in `data/pois.json` integriert.

### Zusammenfassung

| Metrik | Vorher | Nachher |
|--------|--------|---------|
| POIs gesamt | 71 | 75 |
| POIs mit GPS | 12 | 33 |
| Nicht-Standard-IDs | 11 | 0 |

### Koordinaten hinzugefügt (21 POIs)

Folgende POIs hatten vorher keine Koordinaten und erhielten GPS-Daten aus der wo-sie-ruhen.de API:
`poi_sws_adolf-bastian`, `poi_sws_adolf-rohrbach`, `poi_sws_alexander-von-kluck`, `poi_sws_carl-ludwig-schleich`, `poi_sws_edmund-rumpler`, `poi_sws_elisabeth-von-ardenne`, `poi_sws_emil-krebs`, `poi_sws_erik-jan-hanussen`, `poi_sws_ferdinand-von-richthofen`, `poi_sws_gustav-kadelburg`, `poi_sws_gustav-langenscheidt`, `poi_sws_hugo-conwentz`, `poi_sws_julius-wissinger`, `poi_sws_karl-ludwig-manzel`, `poi_sws_max-jordan`, `poi_sws_rudolf-breitscheid`, `poi_sws_wilhelm-kuhnert`

### Koordinaten aktualisiert (6 POIs)

Vorhandene, niedrigere Präzision durch Scraping-Daten ersetzt:
`poi_sws_engelbert-humperdinck`, `poi_sws_ernst-gennat`, `poi_sws_fw-murnau`, `poi_sws_heinrich-zille`, `poi_sws_lovis-corinth`, `poi_sws_werner-von-siemens`

### Neue POIs (4)

| ID | Name | Quelle |
|----|------|--------|
| `poi_sws_reinhold-felderhoff` | Reinhold Carl Thusmann Felderhoff | wo-sie-ruhen.de API |
| `poi_sws_julius-schaarwaechter` | Julius Cornelius Schaarwächter | wo-sie-ruhen.de API |
| `poi_sws_hans-essen` | Hans Henrik Freiherr von Essen | wo-sie-ruhen.de API |
| `poi_sws_ernst-seger` | Ernst Seger | wo-sie-ruhen.de API |

### IDs umbenannt (11)

`engelbert-humperdinck` → `poi_sws_engelbert-humperdinck`, `ernst-gennat` → `poi_sws_ernst-gennat`, `hauptkapelle` → `poi_sws_hauptkapelle`, `fw-murnau` → `poi_sws_fw-murnau`, `friedhofseingang` → `poi_sws_friedhofseingang`, `heinrich-zille` → `poi_sws_heinrich-zille`, `hugo-distler` → `poi_sws_hugo-distler`, `joachim-gottschalk` → `poi_sws_joachim-gottschalk`, `lovis-corinth` → `poi_sws_lovis-corinth`, `theodor-fontane-jun` → `poi_sws_theodor-fontane-jun`, `werner-von-siemens` → `poi_sws_werner-von-siemens`
