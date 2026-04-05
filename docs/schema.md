# Datenmodell — Südwestkirchhof Stahnsdorf

Dieses Dokument beschreibt das verbindliche Schema für POIs und Collections.

**Grundprinzipien:**

- Deutsch ist die Quellsprache. Alle anderen Sprachen werden per KI generiert.
- Nur POIs mit Koordinaten erscheinen in der App.
- POIs ohne Koordinaten werden in der Datenbank geführt, bis Koordinaten ermittelt sind.
- Familiengräber sind normale POIs vom Typ `grab` — keine Sonderbehandlung.
- Collections gruppieren POIs thematisch zur gemeinsamen Anzeige auf der Karte.

---

## `LocalizedText`

Mehrsprachiges Textobjekt. `de` ist Pflicht, weitere Sprachen werden generiert.

```json
{
  "de": "Deutscher Text",
  "en": "English text",
  "fr": "Texte français",
  "pl": "Tekst polski",
  "ru": "Русский текст",
  "sv": "Svensk text"
}
```

Fallback-Reihenfolge in der App: gewünschte Sprache → Deutsch → erste verfügbare.

---

## POI-Schema

### Felder

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | ja | Eindeutige Kennung, z.B. `poi_sws_adolf-bastian` |
| `typ` | `string` | ja | Kategorie des POI — siehe Werteliste |
| `name` | `LocalizedText` | ja | Anzeigename |
| `koordinaten` | `{ lat, lng } \| null` | nein | GPS-Position oder `null`. Nur POIs mit Koordinaten erscheinen in der App |
| `kurztext` | `LocalizedText` | ja | Eine Zeile, erscheint beim Antippen in der App |
| `beschreibung` | `LocalizedText` | ja | Reine inhaltliche Beschreibung — kein Status, keine Redaktionshinweise |
| `datum_von` | `string \| null` | nein | Geburtsdatum (Person) oder Baudatum (Bauwerk). Format: `YYYY-MM-DD` |
| `datum_bis` | `string \| null` | nein | Sterbedatum (Person) oder Ende/Abriss (Bauwerk). Format: `YYYY-MM-DD` |
| `wikipedia_url` | `string \| null` | nein | Direktlink zur Wikipedia-Seite |
| `bilder` | `Bild[]` | nein | Bilder mit Pflicht-Nachweis — siehe Bild-Objekt |
| `audio` | `{ [sprache]: string }` | nein | URLs zu Audiodateien, eine pro Sprache. Leeres Objekt `{}` wenn keine vorhanden |
| `quellen` | `string[]` | nein | Quellenangaben als Freitext, intern |
| `status` | `string` | ja | `bestätigt` oder `prüfen` |
| `notiz` | `string` | nein | Interne Notiz — Koordinatenhinweise, Unsicherheiten, Redaktionelles. Erscheint nicht in der App |

### `typ`-Werte

| Wert | Bedeutung |
|---|---|
| `grab` | Einzelgrab oder Familiengrab |
| `mausoleum` | Mausoleum |
| `denkmal` | Denkmal, Gedenkstein, Kreuz |
| `gedenkanlage` | Anlage für mehrere Opfer/Personen |
| `bauwerk` | Kapelle, Eingang, Gebäude |
| `bereich` | Benannter Abschnitt des Friedhofs |

### `status`-Werte

| Wert | Bedeutung |
|---|---|
| `bestätigt` | Eintrag ist redaktionell geprüft und belastbar |
| `prüfen` | Eintrag muss noch redaktionell nachgeprüft werden |

### ID-Konvention

```
poi_sws_<kennung>
```

Kennungen: Kleinbuchstaben, Bindestriche, Umlaute transliteriert (`ä` → `ae`).

---

## Bild-Objekt

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `datei` | `string` | ja | Dateiname oder URL |
| `nachweis` | `string` | ja | Urheber und Lizenz, z.B. `"Max Müller, CC BY-SA 4.0"` |
| `nachweis_url` | `string` | nein | Link zur Quelle oder zum Urheber |
| `beschriftung` | `LocalizedText` | nein | Bildunterschrift |

---

## Collection-Schema

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `id` | `string` | ja | Eindeutige Kennung, z.B. `collection_sws_architektur` |
| `name` | `LocalizedText` | ja | Anzeigename |
| `kurztext` | `LocalizedText` | ja | Kurzbeschreibung |
| `beschreibung` | `LocalizedText` | ja | Längere Beschreibung |
| `pois` | `string[]` | ja | Liste von POI-IDs |
| `status` | `string` | ja | `bestätigt` oder `prüfen` |
| `notiz` | `string` | nein | Interne Notiz |

### ID-Konvention

```
collection_sws_<kennung>
```

---

## Beispiel POI

```json
{
  "id": "poi_sws_adolf-bastian",
  "typ": "grab",
  "name": {
    "de": "Adolf Bastian"
  },
  "koordinaten": null,
  "kurztext": {
    "de": "Ethnologe und Museumsgründer (1826–1905)"
  },
  "beschreibung": {
    "de": "Adolf Bastian (1826–1905) war ein deutscher Ethnologe und Gründer des Museums für Völkerkunde in Berlin. Seine Grabstätte befindet sich im Block Trinitatis des Südwestkirchhofs."
  },
  "datum_von": "1826-06-26",
  "datum_bis": "1905-02-02",
  "wikipedia_url": "https://de.wikipedia.org/wiki/Adolf_Bastian",
  "bilder": [],
  "audio": {},
  "quellen": [
    "Wikipedia: Südwestkirchhof Stahnsdorf, abgerufen 2026-03-25",
    "Wikipedia: Adolf Bastian, abgerufen 2026-03-25"
  ],
  "status": "prüfen",
  "notiz": "Block Trinitatis. Koordinaten vor Ort ermitteln."
}
```

## Beispiel Collection

```json
{
  "id": "collection_sws_architektur-und-anlage",
  "name": {
    "de": "Architektur & Anlage",
    "en": "Architecture & site design",
    "fr": "Architecture & composition du site"
  },
  "kurztext": {
    "de": "Kapelle, Eingänge, Landschaftsgestaltung und herausragende Mausoleen."
  },
  "beschreibung": {
    "de": "Hier stehen die Raumkomposition des Waldfriedhofs, die Kapelle, markante Mausoleen und die prägenden Gestalterfiguren der Anlage im Mittelpunkt."
  },
  "pois": [
    "poi_sws_hauptkapelle",
    "poi_sws_friedhofseingang",
    "poi_sws_christusdenkmal"
  ],
  "status": "bestätigt",
  "notiz": ""
}
```
