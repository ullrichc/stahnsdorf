# Datenmodell-Erweiterungen für den Südwestkirchhof Stahnsdorf

Dieses Dokument beschreibt die eingeführten Erweiterungen der JSON-Datenbasis für die App zum Südwestkirchhof Stahnsdorf.

Es dient als technische Referenz für die Softwareentwicklung und umfasst:
- Ziel und Grundprinzipien
- Struktur von `pois.json`
- Struktur von `collections.json`
- Beschreibung aller ergänzten Felder
- Sprachmodell für anzeigerelevante Texte
- Status- und Koordinatenlogik
- Beispiele aus der tatsächlichen Datenbasis
- Hinweise für Validierung und Weiterentwicklung

---

## 1. Ziel der Erweiterung

Die ursprünglichen JSON-Dateien wurden erweitert, um:
- deutlich mehr POIs (Gräber, Bauwerke, Gedenkorte, Mausoleen, Anlagenpunkte) aufzunehmen
- Quellen und Unsicherheiten nachvollziehbar zu dokumentieren
- fehlende oder nur angenäherte Koordinaten sauber zu kennzeichnen
- Mehrsprachigkeit für app-relevante Anzeigetexte vorzubereiten
- Collections thematisch besser strukturieren zu können
- spätere Medienrecherche von eigentlichen App-Bildern zu trennen

Die Erweiterung ist bewusst **kompatibel mit dem bisherigen Kernschema**, ergänzt aber zusätzliche Felder für redaktionelle und technische Anforderungen.

---

## 2. Grundprinzipien

### 2.1 Objekte
Es gibt zwei zentrale Datentypen:
- **POIs** in `pois.json`
- **Collections** in `collections.json`

### 2.2 Ein POI pro realem Ort/Objekt
Grundsätzlich gilt:
- ein reales Grab / Bauwerk / Denkmal / ortsfester Punkt = ein POI
- Varianten, alternative Schreibweisen und Unsicherheiten werden im selben Datensatz dokumentiert
- nur bei fachlich unauflösbaren Konflikten wäre ein separater Datensatz sinnvoll

### 2.3 Mehrsprachigkeit nur für sichtbare Texte
Mehrsprachig geführt werden nur anzeigerelevante Felder:
- `name`
- `summary`
- `description`
- `location_note`

Aktuell vorgesehen:
- `de`
- `en`
- `fr`

Das Modell ist so angelegt, dass später weitere Sprachschlüssel ergänzt werden können.

### 2.4 Medienlogik
- `images` bleibt für kuratierte oder lokal eingebundene App-Bilder reserviert
- `image_source_urls` enthält lediglich externe Fundstellen für späteren Download / Rechteprüfung
- `audio` bleibt separat

---

## 3. Dateiformat `pois.json`

`pois.json` ist ein JSON-Array von POI-Objekten.

### 3.1 Aktuell verwendete Struktur

```json
[
  {
    "id": "poi_sws_adolf-bastian",
    "type": "grave",
    "name": {
      "de": "Adolf Bastian",
      "en": "Adolf Bastian",
      "fr": "Adolf Bastian"
    },
    "coordinates": null,
    "coordinates_status": "unknown",
    "location_note": {
      "de": "Block Trinitatis",
      "en": "Block Trinitatis",
      "fr": "Bloc Trinitatis"
    },
    "summary": {
      "de": "Grab von Adolf Bastian; Ethnologe und Museumsgründer.",
      "en": "Grave of Adolf Bastian; ethnologist and museum founder.",
      "fr": "Tombe de Adolf Bastian ; ethnologue et fondateur de musée."
    },
    "description": {
      "de": "Adolf Bastian (1826–1905) – Ethnologe und Museumsgründer. Die Grabstätte wird öffentlich dem Block Trinitatis des Südwestkirchhofs zugeordnet.",
      "en": "Adolf Bastian (1826–1905) – ethnologist and museum founder. Public sources place the grave in Block Trinitatis of the South-Western Cemetery.",
      "fr": "Adolf Bastian (1826–1905) – ethnologue et fondateur de musée. Les sources publiques situent la sépulture dans le bloc Trinitatis du Südwestkirchhof."
    },
    "dates": {
      "born": "1826-06-26",
      "died": "1905-02-02"
    },
    "images": [],
    "audio": [],
    "tags": ["science", "ethnology"],
    "categories": ["grave", "science", "anthropology"],
    "source_refs": [
      {
        "title": "Südwestkirchhof Stahnsdorf",
        "type": "wikipedia",
        "publisher": "Wikipedia",
        "url": "https://de.wikipedia.org/wiki/S%C3%BCdwestkirchhof_Stahnsdorf",
        "accessed": "2026-03-25",
        "note": "Aktuelle Übersicht zu Blocks, Grabstätten und Bauwerken."
      }
    ],
    "status": "bestätigt",
    "alt_names": [],
    "last_reviewed": "2026-03-25",
    "image_source_urls": [],
    "primary_person": {
      "name": "Adolf Bastian",
      "role_note": "Ethnologe und Museumsgründer",
      "status": "bestätigt",
      "birth_date": "1826-06-26",
      "death_date": "1905-02-02"
    }
  }
]
```

---

## 4. POI-Schema im Detail

### 4.1 Pflichtfelder
Diese Felder sollten für jeden POI vorhanden sein.

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | `string` | Eindeutige ID. Verwendetes Muster: Präfix + Namensslug, z. B. `poi_sws_adolf-bastian`. |
| `type` | `string` | Objekttyp, z. B. `grave`, `mausoleum`, `memorial`, `building`, `landmark`. |
| `name` | `LocalizedText` | Anzeigename in mehreren Sprachen. |
| `coordinates` | `Coordinates \| null` | GPS-Koordinaten oder `null`, wenn nicht belastbar vorhanden. |
| `coordinates_status` | `string` | Qualitätsstatus der Koordinate. |
| `location_note` | `LocalizedText` | Lagehinweis, z. B. Block, Nähe zu Bauwerk, Feldhinweis. |
| `summary` | `LocalizedText` | Sehr kurzer App-Teaser. |
| `description` | `LocalizedText` | Kurze, app-taugliche Beschreibung. |
| `dates` | `object` | Objekt- oder Personendaten, sofern bekannt. |
| `images` | `string[]` | Für kuratierte interne Bildreferenzen; aktuell oft leer. |
| `audio` | `string[]` | Für kuratierte Audioreferenzen; aktuell oft leer. |
| `tags` | `string[]` | Freiere Schlagworte für Filterung oder Themen. |
| `categories` | `string[]` | Fachlichere Objekt-/Kontextkategorien. |
| `source_refs` | `SourceRef[]` | Dokumentation der verwendeten Quellen. |
| `status` | `string` | Redaktionsstatus. |
| `alt_names` | `string[]` | Namensvarianten, alternative Schreibungen, weitere Bezeichnungen. |
| `last_reviewed` | `string` | Letztes Prüfdatum im Format `YYYY-MM-DD`. |
| `image_source_urls` | `string[]` | Externe Fundstellen für späteren Bilddownload. |

### 4.2 Optionale Felder

| Feld | Typ | Beschreibung |
|---|---|---|
| `primary_person` | `PersonRef` | Hauptperson des Ortes, wenn sinnvoll. |
| `persons` | `PersonRef[]` | Weitere zugeordnete Personen bei Familiengräbern, Mausoleen etc. |
| `uncertainty_note` | `string` oder `LocalizedText` | Freitext für Unsicherheiten; in der ersten Fassung nicht konsistent in jedem POI verwendet. |

---

## 5. Hilfstypen für `pois.json`

### 5.1 `LocalizedText`

Mehrsprachiges Objekt für sichtbare Texte.

```json
{
  "de": "Deutscher Text",
  "en": "English text",
  "fr": "Texte français"
}
```

Empfehlung:
- in der UI immer mit Fallback arbeiten
- Reihenfolge: gewünschte Sprache -> Deutsch -> erste verfügbare Sprache

### 5.2 `Coordinates`

In der aktuellen Datenbasis ist `coordinates` entweder `null` oder ein Objekt mit Längen- und Breitengrad.

Empfohlene Struktur:

```json
{
  "lat": 52.383,
  "lng": 13.123
}
```

### 5.3 `SourceRef`

```json
{
  "title": "Südwestkirchhof Stahnsdorf",
  "type": "wikipedia",
  "publisher": "Wikipedia",
  "url": "https://de.wikipedia.org/wiki/S%C3%BCdwestkirchhof_Stahnsdorf",
  "accessed": "2026-03-25",
  "note": "Aktuelle Übersicht zu Blocks, Grabstätten und Bauwerken."
}
```

Felder:

| Feld | Typ | Beschreibung |
|---|---|---|
| `title` | `string` | Titel der Quelle |
| `type` | `string` | Quelltyp, z. B. `official`, `wikipedia`, `cwgc`, `memorial-site`, `archive`, `press` |
| `publisher` | `string` | Herausgeber / Institution |
| `url` | `string` | URL der Quelle |
| `accessed` | `string` | Abrufdatum im Format `YYYY-MM-DD` |
| `note` | `string` | Kurze Einordnung der Quelle |

### 5.4 `PersonRef`

```json
{
  "name": "Adolf Bastian",
  "role_note": "Ethnologe und Museumsgründer",
  "status": "bestätigt",
  "birth_date": "1826-06-26",
  "death_date": "1905-02-02"
}
```

Felder:

| Feld | Typ | Beschreibung |
|---|---|---|
| `name` | `string` | Personenname |
| `role_note` | `string` | Kurzrolle / Einordnung |
| `status` | `string` | Status der Personenangabe |
| `birth_date` | `string` | Geburtsdatum, wenn bekannt |
| `death_date` | `string` | Sterbedatum, wenn bekannt |

---

## 6. Statuslogik für POIs

Verwendete Werte:
- `bestätigt`
- `unsicher`
- `prüfen`

Empfohlene Semantik:

| Wert | Bedeutung |
|---|---|
| `bestätigt` | Ort, Person oder Objekt ist ausreichend belastbar belegt |
| `unsicher` | Datensatz ist plausibel, aber einzelne Angaben sind nicht vollständig abgesichert |
| `prüfen` | Datensatz bewusst aufgenommen, muss aber redaktionell nachgeprüft werden |

Hinweis:
`status` beschreibt die redaktionelle Belastbarkeit des Eintrags insgesamt, nicht nur die Koordinate.

---

## 7. Koordinatenlogik

Das Feld `coordinates_status` beschreibt die Genauigkeit der Standortangabe.

Verwendete Werte in der ersten Fassung:
- `exact`
- `approximate`
- `unknown`

Empfohlene Semantik:

| Wert | Bedeutung |
|---|---|
| `exact` | Punktlage ist belastbar und direkt dem Objekt zuzuordnen |
| `approximate` | nur Näherung, z. B. Blocklage oder aus Plan abgeleitete Position |
| `unknown` | keine belastbare Koordinate vorhanden |

Logik:
- `coordinates_status = exact` -> `coordinates` sollte gesetzt sein
- `coordinates_status = approximate` -> `coordinates` sollte gesetzt sein, aber UI sollte dies kenntlich machen
- `coordinates_status = unknown` -> `coordinates` kann `null` sein; `location_note` sollte möglichst hilfreich sein

---

## 8. Dateiformat `collections.json`

`collections.json` ist ein JSON-Array von Collection-Objekten.

### 8.1 Aktuell verwendete Struktur

```json
[
  {
    "id": "collection_sws_architektur-und-anlage",
    "name": {
      "de": "Architektur & Anlage",
      "en": "Architecture & site design",
      "fr": "Architecture & composition du site"
    },
    "summary": {
      "de": "Kapelle, Eingänge, Landschaftsgestaltung und herausragende Mausoleen.",
      "en": "Chapel, entrances, landscape design and outstanding mausolea.",
      "fr": "Chapelle, entrées, aménagement paysager et mausolées remarquables."
    },
    "description": {
      "de": "Hier stehen die Raumkomposition des Waldfriedhofs, die Kapelle, markante Mausoleen und die prägenden Gestalterfiguren der Anlage im Mittelpunkt.",
      "en": "This collection focuses on the spatial composition of the forest cemetery, the chapel, major mausolea and the key design figures behind the grounds.",
      "fr": "Cette collection met l’accent sur la composition spatiale du cimetière forestier, la chapelle, les grands mausolées et les principales figures qui ont façonné le site."
    },
    "pois": [
      "hauptkapelle",
      "friedhofseingang",
      "waldcharakter",
      "poi_sws_christusdenkmal"
    ],
    "tags": ["architecture", "landscape", "mausoleum"],
    "status": "bestätigt",
    "last_reviewed": "2026-03-25"
  }
]
```

---

## 9. Collection-Schema im Detail

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | `string` | Eindeutige Collection-ID, z. B. `collection_sws_architektur-und-anlage` |
| `name` | `LocalizedText` | Anzeigename der Collection |
| `summary` | `LocalizedText` | Kurzer App-Teaser |
| `description` | `LocalizedText` | Kurze inhaltliche Beschreibung |
| `pois` | `string[]` | Liste der referenzierten POI-IDs |
| `tags` | `string[]` | Freie Schlagworte für Navigation oder thematische Filter |
| `status` | `string` | Redaktionsstatus der Collection |
| `last_reviewed` | `string` | Letztes Prüfdatum im Format `YYYY-MM-DD` |

Hinweis:
`pois` referenziert ausschließlich IDs aus `pois.json`.

---

## 10. ID-Konventionen

Verwendetes Prinzip:
- Präfix + Namensslug

### 10.1 POI-IDs
Muster:

```text
poi_sws_<slug>
```

Beispiele:
- `poi_sws_adolf-bastian`
- `poi_sws_mausoleum-caspary`
- `poi_sws_christusdenkmal`

### 10.2 Collection-IDs
Muster:

```text
collection_sws_<slug>
```

Beispiele:
- `collection_sws_architektur-und-anlage`
- `collection_sws_gedenkorte`

Empfehlung für Slugs:
- Kleinbuchstaben
- Bindestriche statt Leerzeichen
- Umlaute transliterieren, z. B. `ä -> ae`
- Sonderzeichen entfernen

---

## 11. Empfohlene TypeScript-Interfaces

```ts
export type LocalizedText = {
  de?: string;
  en?: string;
  fr?: string;
  [lang: string]: string | undefined;
};

export type Coordinates = {
  lat: number;
  lng: number;
};

export type SourceRef = {
  title: string;
  type: string;
  publisher?: string;
  url: string;
  accessed?: string;
  note?: string;
};

export type PersonRef = {
  name: string;
  role_note?: string;
  status?: "bestätigt" | "unsicher" | "prüfen";
  birth_date?: string;
  death_date?: string;
};

export type PoiStatus = "bestätigt" | "unsicher" | "prüfen";
export type CoordinateStatus = "exact" | "approximate" | "unknown";

export type Poi = {
  id: string;
  type: string;
  name: LocalizedText;
  coordinates: Coordinates | null;
  coordinates_status: CoordinateStatus;
  location_note: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  dates: Record<string, string>;
  images: string[];
  audio: string[];
  tags: string[];
  categories: string[];
  source_refs: SourceRef[];
  status: PoiStatus;
  alt_names: string[];
  last_reviewed: string;
  image_source_urls: string[];
  primary_person?: PersonRef;
  persons?: PersonRef[];
  uncertainty_note?: string | LocalizedText;
};

export type Collection = {
  id: string;
  name: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  pois: string[];
  tags: string[];
  status: "bestätigt" | "unsicher" | "prüfen";
  last_reviewed: string;
};
```

---

## 12. Validierungsregeln

Empfohlene Mindestvalidierung:

### 12.1 Für POIs
- `id` muss eindeutig sein
- `name.de` sollte immer vorhanden sein
- `summary.de` sollte immer vorhanden sein
- `description.de` sollte immer vorhanden sein
- `coordinates_status` muss einer der erlaubten Werte sein
- `status` muss einer der erlaubten Werte sein
- `source_refs` sollte nicht leer sein
- `images` und `audio` müssen Arrays sein
- `image_source_urls` muss ein Array sein
- wenn `coordinates_status = exact|approximate`, dann sollte `coordinates != null` gelten
- wenn `coordinates = null`, dann sollte `location_note.de` nach Möglichkeit gesetzt sein

### 12.2 Für Collections
- `id` muss eindeutig sein
- `name.de`, `summary.de`, `description.de` sollten vorhanden sein
- jede ID in `pois` muss in `pois.json` existieren
- `status` muss einer der erlaubten Werte sein

---

## 13. Hinweise für die App-Implementierung

### 13.1 Sprach-Fallback
Die App sollte sichtbare Texte mit Fallbacklogik rendern:
1. aktuelle UI-Sprache
2. Deutsch
3. erste vorhandene Sprache

### 13.2 Kartendarstellung
Für Marker und Routing sollte `coordinates_status` berücksichtigt werden:
- `exact`: normal darstellen
- `approximate`: visuell als angenähert markieren
- `unknown`: nicht auf Karte plotten oder separat als unscharf markieren

### 13.3 Redaktionelle Hinweise
`status` sollte intern oder im CMS sichtbar sein, muss aber nicht in der Nutzeroberfläche erscheinen.

### 13.4 Externe Bildquellen
`image_source_urls` sind **keine** App-Bilder, sondern Recherchehinweise. Sie sollten nicht automatisch als Frontend-Medien geladen werden.

---

## 14. Nicht eingeführte oder bewusst ausgeschlossene Felder

Folgende zuvor diskutierte Felder wurden bewusst **nicht** in das Zielschema aufgenommen:
- `period`
- `heritage_status`
- `relations`
- `media_note`
- `sort_order`
- `featured_pois`
- `criteria`
- `source_scope`

Grund:
- aktuell nicht zwingend für die App nötig
- vermeidbare Schemakomplexität
- kann später bei Bedarf ergänzt werden

---

## 15. Zusammenfassung

Die Erweiterung führt zu einem Datenmodell mit folgenden Eigenschaften:
- kompatibel zum bisherigen Grundaufbau
- redaktionell belastbarer durch Quellen- und Statusfelder
- besser für Karten- und Lageinformationen durch `coordinates_status` und `location_note`
- mehrsprachig für sichtbare Inhalte
- vorbereitet für spätere Medienkurierung durch `image_source_urls`
- sauber thematisierbar durch Collections mit Referenzen auf POI-IDs

Die wichtigsten neuen Felder sind:
- in `pois.json`: `coordinates_status`, `location_note`, `categories`, `source_refs`, `status`, `alt_names`, `last_reviewed`, `image_source_urls`, `primary_person`, optional `persons`
- in `collections.json`: `summary`, `tags`, `status`, `last_reviewed`

