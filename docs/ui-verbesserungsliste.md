# UI-Verbesserungsliste

**Stand:** 17.08.2026 (4. Durchgang) · Basis: UI-Review aller Seiten (Screenshots, Code verifiziert) · Gelöste Punkte werden entfernt.

Jeder Punkt: Befund mit Beleg → Begründung → *Vorschlag*. Priorität: **[Hoch]** = beeinträchtigt den Kernzweck (Orientierung vor Ort), **[Mittel]** = stört spürbar, **[Gering]** = Feinschliff.

Grundsatz-Entscheidung 17.08.2026: App-weit werden nur POIs mit GPS-Koordinaten angezeigt.

## Offene Punkte

Nach dem vierten Durchgang sind keine neuen offenen UI-Punkte dokumentiert.

## Umgesetzt am 17.08.2026

- Eine frische Hauptkarten-Sitzung startet an der Friedhofskapelle mit Zoom 19 und sichtbaren POI-Namen. Ein automatischer erster GPS-Fix übernimmt den Fokus nur innerhalb der Friedhofsgrenze.
- Die Besucherkarte besitzt ein eigenes, lokal gebündeltes OSM-Overlay aus Friedhofsfläche und Wegen. Es liegt nicht interaktiv zwischen Kacheln und Markern, wird zoomabhängig dargestellt und funktioniert auf Start- und Sammlungskarten.
- Der Kopf der POI-Detailseite ist auf 56 px verdichtet; der Zurück-Button hat eine 44-px-Antippfläche.
- Lagehinweis und Kartenlink stehen kompakt zusammen. Feedback und sichtbare Quellen werden als zurückhaltende Metabereiche dargestellt.
- Der Haupteingang ist im JSON-Master als `bauwerk` normalisiert. Die zentrale Typanzeige behandelt übergangsweise auch einen Firestore-Wert `entrance` als Bauwerk.
- Die geprüften Schließen- und Standardmarkerflächen erfüllen 44 beziehungsweise 48 px. Die 20-px-Kompaktmarker bei niedrigem Zoom bleiben bewusst klein, damit dichte Bereiche lesbar bleiben; Auswahl und Zoom vergrößern sie.
- Die geprüften SVG-Markerregeln sind aktiv und bleiben erhalten. Der frühere `-webkit-box`-Konflikt ist im aktuellen Stand nicht vorhanden.

## Geprüft, kein Handlungsbedarf

- **Info-Seite** und **Optionen-Seite** (1. Durchgang); **Sammlungen-Liste** nach Umbau (2. Durchgang); **Startkarte**, **POI-Detailseite** und **Sammlungsdetail** nach Overlay-Umsetzung (4. Durchgang).

## Bewusst nicht aufgenommen

- Startausschnitt/Name des Nachbarfriedhofs (verworfen, 17.08.2026)
- Wischgeste für die Detailkarte (verworfen, 17.08.2026 — nur Button)
- Clustering und Marker-Versetzen (verworfen, 17.08.2026 — stattdessen zoomabhängige Markergröße, umgesetzt)
- Datums-Chip mit gemischter Genauigkeit („1873 bis 31.01.1923") — so gewollt (17.08.2026)
- Aufhell-Filter auf die Kacheln als Wege-Sofortmaßnahme (verworfen, 17.08.2026 — direkt das Karten-Overlay)
