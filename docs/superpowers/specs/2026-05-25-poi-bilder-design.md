# POI-Bilder: Design

Datum: 2026-05-25

## Ziel

Die App soll zu jedem POI beliebig viele Bilder verwalten und anzeigen. Bilder werden in der Besucher-App und in der Adminsicht sichtbar. Bestehende Fotos aus `inputdata/bilder` sollen einmalig per Script importiert werden koennen; danach sollen Redakteure Bilder direkt im Adminbereich hochladen koennen.

Die Originaldateien bleiben lokal. In Firebase Storage landen optimierte Fassungen, sofern die Ausgangsbilder nicht bereits eine geeignete Groesse haben.

## Empfohlene Architektur

Firebase Storage wird die zentrale Ablage fuer POI-Bilder. Firestore bleibt die Quelle fuer POI-Inhalte und speichert pro POI nur Bild-Metadaten im bestehenden Feld `bilder`.

Das bestehende Bildmodell bleibt kompatibel:

- `datei`: rendertaugliche URL fuer die optimierte Anzeigeversion
- `nachweis`: Pflichtfeld
- `nachweis_url`: optionale Quelle
- `beschriftung`: optionale mehrsprachige Bildunterschrift

Zusaetzlich sollen optionale Felder eingefuehrt werden:

- `storage_pfad`: interner Firebase-Storage-Pfad, z.B. `poi-images/{poiId}/{dateiname}.jpg`
- `breite`: Breite der optimierten Datei in Pixeln
- `hoehe`: Hoehe der optimierten Datei in Pixeln
- `mime_type`: MIME-Type der optimierten Datei, z.B. `image/jpeg`
- `vorschau_datei`: rendertaugliche URL fuer eine kleine Vorschauversion
- `vorschau_storage_pfad`: interner Storage-Pfad der Vorschauversion
- `vorschau_breite`: Breite der Vorschauversion in Pixeln
- `vorschau_hoehe`: Hoehe der Vorschauversion in Pixeln

Die optionalen Felder erleichtern Loeschen, Ersetzen, Layout und spaetere Datenexporte, ohne bestehende POIs zu brechen.

`storage_pfad` ist die kanonische technische Referenz fuer neue Storage-Bilder. `datei` bleibt die direkt renderbare URL, damit Besucher-App, Static Export und Exportdaten ohne zusaetzliche Aufloesung funktionieren. Fuer alte oder manuell gepflegte Bildpfade wird ein zentraler Helper benoetigt, der absolute URLs, Firebase-Download-URLs und lokale/public-Pfade inklusive GitHub-Pages-`basePath` korrekt behandelt.

## Import-Script

Ein neues Script importiert die vorhandenen Fotos aus `inputdata/bilder`.

Ablauf:

1. Standardmaessig als Dry-Run starten und einen JSON/Markdown-Report erzeugen.
2. Bildliste und POI-Zuordnung aus den bereits erzeugten Bilddaten lesen.
3. Bild-Metadaten lesen, insbesondere XMP/IPTC/EXIF-Urheber-/Copyright-Felder.
4. Nachweis setzen.
5. Bildgroesse pruefen.
6. Bei Bedarf optimierte Anzeige- und Vorschauversion erzeugen.
7. Optimierte Dateien in Firebase Storage hochladen.
8. Das passende POI-Dokument in Firestore um einen `bilder[]`-Eintrag ergaenzen.
9. Einen Report fuer importierte, uebersprungene und nicht zuordenbare Dateien schreiben.

Der Import schreibt erst mit einem expliziten `--apply` in Storage und Firestore. Wiederholte Laeufe muessen idempotent sein: vorhandene Bilder werden anhand stabiler Storage-Pfade, normalisierter Quell-Dateinamen oder eines Inhalts-/Datei-Hashes erkannt und nicht doppelt angehaengt.

Nachweislogik:

1. XMP `dc:creator` / `Creator`
2. IPTC `By-line` / `Credit`
3. EXIF `Artist`
4. Copyright-Felder, wenn sie einen verwertbaren Namen enthalten
5. Fallback: `Förderverein Südwestkirchhof Stahnsdorf e.V.`

Optimierte Dateien sollen keine GPS- oder sonstigen Originalmetadaten behalten, die nicht fuer Anzeige und Nachweis noetig sind. Der Nachweis steht in Firestore, nicht in den ausgelieferten Bilddateien.

Das Script darf Originale nicht veraendern oder verschieben.

## Bildvarianten und Optimierung

Version 1 erzeugt zwei Varianten pro Bild:

- Anzeigeversion: max. 1600 px lange Kante, JPEG, gute Qualitaet
- Vorschauversion: max. 480 px lange Kante, JPEG, fuer Listen, Karten und Admin-Thumbnails

Browser-Uploads optimieren Bilder clientseitig vor dem Upload, weil die App als statischer Export keinen eigenen Server hat. Das Import-Script darf fuer dieselbe Logik eine Node-Bibliothek verwenden.

Die Umsetzung muss festlegen:

- unterstuetzte Eingabeformate, mindestens JPEG und PNG
- Verhalten bei HEIC oder nicht unterstuetzten Formaten
- maximale Upload-Dateigroesse
- korrekte Anwendung der EXIF-Orientierung
- klare Fehlermeldung, wenn ein Bild im Browser nicht verarbeitet werden kann

## Adminbereich

Der POI-Editor bekommt einen Bilderbereich.

Funktionen der ersten Version:

- vorhandene Bilder als Thumbnails anzeigen
- direktes Hochladen aus dem Browser
- Nachweis aus Bild-Metadaten vorbefuellen, sonst Standardnachweis verwenden
- Nachweis, Nachweis-URL und deutsche Beschriftung bearbeiten
- Reihenfolge der Bilder aendern
- Bild aus POI entfernen
- optional beim Entfernen auch die Datei aus Firebase Storage loeschen

Der Upload schreibt zuerst die optimierten Dateien nach Storage und speichert danach den neuen `bilder[]`-Stand sofort am bestehenden POI-Dokument. Bildaenderungen im Admin sind damit unmittelbare Medienaenderungen, auch wenn andere POI-Felder erst ueber den allgemeinen Speichern-Button gesichert werden. Wenn das Firestore-Speichern nach erfolgreichem Storage-Upload fehlschlaegt, versucht die UI, die gerade hochgeladenen Dateien wieder zu loeschen und meldet, falls dieses Aufraeumen ebenfalls fehlschlaegt.

Bei neuen POIs ist der Bilderbereich erst aktiv, nachdem der POI einmal gespeichert wurde und eine stabile `poiId` besitzt. Das vermeidet temporaere Storage-Pfade ohne zugehoeriges POI-Dokument.

Beim Entfernen ist die sichere Standardaktion: Bildreferenz aus dem POI entfernen. Physisches Loeschen aus Storage ist eine ausdrueckliche Zusatzaktion, weil Backups und Exporte sonst auf nicht mehr vorhandene Dateien zeigen koennen.

## Besucher-App

Die Besucher-App zeigt Bilder aus `bilder[]` an.

Erste Ausbaustufe:

- POI-Karten duerfen das erste Bild als Vorschaubild verwenden.
- Die POI-Detailseite zeigt alle Bilder als Galerie.
- Bildnachweis und optionale Beschriftung werden sichtbar angezeigt.

Die Galerie muss auch mit null, einem oder vielen Bildern funktionieren. Ohne Bilder bleibt das bestehende Layout erhalten.

## Firebase und Rechte

Firebase Storage wird in die Projektkonfiguration aufgenommen.

Regelmodell:

- Lesen von POI-Bildern ist oeffentlich erlaubt.
- Schreiben und Loeschen ist nur angemeldeten Editoren erlaubt.
- Editorpruefung folgt dem bestehenden Firestore-Modell ueber `editors/{email}`.
- Schreibzugriff ist auf `poi-images/{poiId}/...` beschraenkt.
- Storage-Uploads akzeptieren fuer die erzeugten Varianten nur `image/jpeg` und eine definierte maximale Dateigroesse.
- Storage-Emulator, `storage.rules` und Firebase-Deploy-Konfiguration werden in `firebase.json` bzw. den npm-Scripts ergaenzt.

Empfohlene Storage-Struktur:

```text
poi-images/{poiId}/display/{normalized-file-name}.jpg
poi-images/{poiId}/thumb/{normalized-file-name}.jpg
```

Die Bilder sind damit nicht geheim. Die Sichtbarkeit in der App wird redaktionell ueber den POI und dessen Publish-Status gesteuert.

## Backup und Restore

Das bestehende Firestore-Backup bleibt ein Inhaltsbackup und enthaelt Bildreferenzen, aber keine binaeren Bilddateien. Restore muss diese Referenzen erhalten und sollte fehlende Storage-Dateien im Adminbereich oder Report sichtbar machen.

Ein vollstaendiger Medienexport kann spaeter ergaenzt werden, ist aber nicht Teil der ersten Version. Bis dahin bleiben die lokalen Originale die separate Medien-Sicherung.

## Tests und Verifikation

Umsetzung sollte mindestens pruefen:

- Schema und TypeScript-Typen bleiben synchron.
- Upload-Hilfsfunktionen normalisieren Dateinamen stabil.
- URL-Helper rendert Storage-URLs, absolute URLs und Legacy-/public-Pfade korrekt.
- Admin-Editor kann Bilder hinzufuegen, bearbeiten, sortieren und entfernen.
- Admin-Upload ist fuer neue, noch nicht gespeicherte POIs deaktiviert oder erklaert.
- Besucher-App rendert POIs mit null, einem und mehreren Bildern.
- Import-Script erzeugt einen nachvollziehbaren Report.
- Import-Script ist im Dry-Run nebenwirkungsfrei und mit `--apply` idempotent.
- Storage Rules pruefen Public Read, Editor Write/Delete, Nicht-Editor-Blockade, falsche Pfade, falsche MIME-Types und zu grosse Dateien.
- `npm run build` bleibt erfolgreich.

Bestehende bekannte Testprobleme werden nicht als Teil dieser Bildfunktion geloest, solange sie nicht direkt blockieren.

## Offene Implementierungsentscheidungen

- Exakte JPEG-Qualitaet fuer Anzeige- und Vorschauversion.
- Konkrete Metadatenbibliothek fuer Browser-Upload und Node-Import.
- Ob der Import zusaetzlich eine lokale Vorschau der optimierten Dateien in einem temporaeren Ordner ablegt.
