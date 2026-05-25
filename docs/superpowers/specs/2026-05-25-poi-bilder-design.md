# POI-Bilder: Design

Datum: 2026-05-25

## Ziel

Die App soll zu jedem POI beliebig viele Bilder verwalten und anzeigen. Bilder werden in der Besucher-App und in der Adminsicht sichtbar. Bestehende Fotos aus `inputdata/bilder` sollen einmalig per Script importiert werden koennen; danach sollen Redakteure Bilder direkt im Adminbereich hochladen koennen.

Die Originaldateien bleiben lokal. In Firebase Storage landen optimierte Fassungen, sofern die Ausgangsbilder nicht bereits eine geeignete Groesse haben.

## Empfohlene Architektur

Firebase Storage wird die zentrale Ablage fuer POI-Bilder. Firestore bleibt die Quelle fuer POI-Inhalte und speichert pro POI nur Bild-Metadaten im bestehenden Feld `bilder`.

Das bestehende Bildmodell bleibt kompatibel:

- `datei`: oeffentlich nutzbare URL oder relativer Storage-URL-Pfad
- `nachweis`: Pflichtfeld
- `nachweis_url`: optionale Quelle
- `beschriftung`: optionale mehrsprachige Bildunterschrift

Zusaetzlich sollen optionale Felder eingefuehrt werden:

- `storage_pfad`: interner Firebase-Storage-Pfad, z.B. `poi-images/{poiId}/{dateiname}.jpg`
- `breite`: Breite der optimierten Datei in Pixeln
- `hoehe`: Hoehe der optimierten Datei in Pixeln

Die optionalen Felder erleichtern Loeschen, Ersetzen, Layout und spaetere Datenexporte, ohne bestehende POIs zu brechen.

## Import-Script

Ein neues Script importiert die vorhandenen Fotos aus `inputdata/bilder`.

Ablauf:

1. Bildliste und POI-Zuordnung aus den bereits erzeugten Bilddaten lesen.
2. Bild-Metadaten lesen, insbesondere Urheber-/Copyright-Felder.
3. Nachweis setzen:
   - wenn in den Bilddaten ein Name steht: diesen uebernehmen
   - sonst: `Förderverein Südwestkirchhof Stahnsdorf e.V.`
4. Bildgroesse pruefen.
5. Bei Bedarf optimierte JPEG/WebP-Fassung erzeugen.
6. Optimierte Datei in Firebase Storage hochladen.
7. Das passende POI-Dokument in Firestore um einen `bilder[]`-Eintrag ergaenzen.
8. Einen Report fuer importierte, uebersprungene und nicht zuordenbare Dateien schreiben.

Das Script darf Originale nicht veraendern oder verschieben.

## Adminbereich

Der POI-Editor bekommt einen Bilderbereich.

Funktionen der ersten Version:

- vorhandene Bilder als Thumbnails anzeigen
- direktes Hochladen aus dem Browser
- Bildoptimierung im Browser vor dem Upload, weil die App als statischer Export keinen eigenen Server hat
- Nachweis aus Bild-Metadaten vorbefuellen, sonst Standardnachweis verwenden
- Nachweis, Nachweis-URL und deutsche Beschriftung bearbeiten
- Reihenfolge der Bilder aendern
- Bild aus POI entfernen
- optional beim Entfernen auch die Datei aus Firebase Storage loeschen

Der Upload schreibt zuerst die optimierte Datei nach Storage und danach den neuen Eintrag in `bilder[]`. Wenn ein Schritt fehlschlaegt, soll die Admin-UI klar melden, ob der Upload oder das Speichern der POI-Daten fehlgeschlagen ist.

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

Empfohlene Storage-Struktur:

```text
poi-images/{poiId}/{normalized-file-name}
```

Die Bilder sind damit nicht geheim. Die Sichtbarkeit in der App wird redaktionell ueber den POI und dessen Publish-Status gesteuert.

## Tests und Verifikation

Umsetzung sollte mindestens pruefen:

- Schema und TypeScript-Typen bleiben synchron.
- Upload-Hilfsfunktionen normalisieren Dateinamen stabil.
- Admin-Editor kann Bilder hinzufuegen, bearbeiten, sortieren und entfernen.
- Besucher-App rendert POIs mit null, einem und mehreren Bildern.
- Import-Script erzeugt einen nachvollziehbaren Report.
- `npm run build` bleibt erfolgreich.

Bestehende bekannte Testprobleme werden nicht als Teil dieser Bildfunktion geloest, solange sie nicht direkt blockieren.

## Offene Implementierungsentscheidungen

- Exakte Zielgroesse der optimierten Bilder, vorgeschlagen: max. 1600 px lange Kante.
- Ausgabeformat, vorgeschlagen: JPEG mit guter Qualitaet fuer Fotos; WebP kann spaeter ergaenzt werden.
- Ob das Import-Script direkt gegen Firestore schreibt oder zunaechst eine JSON-Vorschau erzeugt, sollte im Umsetzungsplan festgelegt werden.
