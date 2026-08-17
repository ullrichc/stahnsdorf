# Karten-Overlay: Design

## Ziel

Die Besucherkarte hebt den Südwestkirchhof als zusammenhängende Fläche hervor und zeigt sein Wegenetz unabhängig vom Detailgrad der CARTO-Kacheln. Das Overlay wird reproduzierbar aus OpenStreetMap erzeugt und lokal ausgeliefert.

## Daten

- Ausgangsfläche ist OpenStreetMap `way 25029213`.
- Ein Generatorskript fragt die Fläche und Wege innerhalb der Fläche über Overpass ab.
- Berücksichtigt werden `footway`, `path`, `service`, `track`, `pedestrian` und `steps`.
- Das GeoJSON behält nur Geometrietyp, `highway`, optional `service` und technische Metadaten zu Quelle und Erzeugung.
- Wege werden geometrisch an der Friedhofsgrenze abgeschnitten. Die Ausgabe enthält damit keine Wegsegmente außerhalb des Geländes.
- Koordinaten werden auf sechs Nachkommastellen gerundet, OSM-Elemente stabil nach ID sortiert. Bei identischer Eingabe und identischem `generatedAt` entsteht bytegleiches GeoJSON.
- Die Ausgabe liegt unter `public/map-overlay.geojson` und darf höchstens 350 KB groß sein.

## Darstellung

- Eine nicht interaktive Leaflet-Ebene zeichnet Fläche und Wege unterhalb der POI-Marker.
- Die Friedhofsfläche erhält eine dezente dunkelgrüne Füllung und einen zurückhaltenden warmen Umriss.
- Die Fläche ist in allen Zoomstufen sichtbar. `service` und `pedestrian` erscheinen ab Zoom 15; `footway`, `path`, `track` und `steps` ab Zoom 17. Marker bleiben visuell dominant.
- Ein Ladefehler des Overlays beeinträchtigt die normale Karte nicht.
- Das Overlay gilt für Start- und Sammlungskarten. Der Produktionspfad wird über den vorhandenen Base-Path-Helfer aufgelöst.
- Das Overlay ist nicht interaktiv und liegt in eigenen Leaflet-Panes unterhalb der Marker. Es darf Klicks und Antippgesten auf Marker oder Karte nicht abfangen.

## Begleitende UI-Bereinigung

- Der Haupteingang wird im JSON-Master vom schemafremden Typ `entrance` auf `bauwerk` normalisiert. Eine kompatible Zuordnung zeigt auch einen noch nicht synchronisierten Firestore-Wert `entrance` sofort als Bauwerk an.
- Die Typübersetzung wird zentralisiert.
- Lagehinweis, Kartenlink, Feedback und sichtbare Quellen werden kompakter und als zurückhaltende Metabereiche dargestellt; lange Texte dürfen umbrechen. Interne Felder wie `notiz` und `koordinaten_quelle` bleiben unsichtbar.
- Bereits korrekte 44/48-Pixel-Antippflächen bleiben bestehen. Kompakte Kartenpunkte werden nicht pauschal vergrößert.
- Aktuell verwendete SVG-Markerregeln werden nicht als vermeintliches Alt-CSS entfernt.

## Qualitätssicherung

- Unit-Tests prüfen Overpass-Abfrage, Konvertierung, Begrenzung, erlaubte Wege, Rundung, deterministische Ausgabe, zentrale Typübersetzung und Base-Path-Auflösung.
- E2E-Tests prüfen das Overlay auf Start- und Sammlungskarte, genau eine geladene Ebene unter React Strict Mode, den Fehler-Fallback und die fortbestehende Markerinteraktion.
- Der Production-Build fragt Overpass nicht ab. Die Exportprüfung verlangt das gebündelte GeoJSON, eine gültige Friedhofsfläche und höchstens 350 KB.
- Screenshots auf 360 x 740 und 1280 x 800 prüfen Zoom 14, 16, 17 und 19 auf Kontrast, Ebenenreihenfolge, Markerinteraktion und Überlagerungen.
