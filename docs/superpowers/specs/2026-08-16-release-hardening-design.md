# Release-Haertung 2026-08-16

## Ziel

Alle im Pruefbericht `docs/pruefbericht-release-2026-08-16.md` genannten Blocker, wichtigen und optionalen Punkte werden vor der Veroeffentlichung behoben. Das Datenmodell und die Firebase-Sicherheitsregeln bleiben unveraendert.

## Statische Navigation

Neue POIs und Sammlungen muessen ohne Build sofort erreichbar sein. Oeffentliche Details verwenden `/poi?id=<poiId>` beziehungsweise `/sammlung?id=<collectionId>`, der Admin-Editor `/admin/poi/edit?id=<poiId>`. Kleine Client-Komponenten lesen `id` innerhalb einer `Suspense`-Grenze und reichen es an die bestehenden Firestore-Komponenten weiter. Nach dem ersten Speichern wird direkt der Editor mit der neuen ID geoeffnet; damit ist der Bildupload sofort aktiv.

Alte `/poi/<id>`- und `/admin/poi/<id>`-Links werden in kanonische Query-Links uebersetzt. Eine App-Router-`not-found`-Seite erzeugt die tatsaechlich ausgelieferte `out/404.html`; die von Next ueberschriebene `public/404.html` entfaellt. Interne Redirects lehnen Backslashes und externe URLs ab.

## Besucher-App

Firestore-Hooks unterscheiden Laden, nicht gefunden und Netzwerkfehler. Sie liefern eine Retry-Funktion, ignorieren Ergebnisse nach dem Unmount und lassen nur POIs mit vorhandenen Koordinaten auf die Karte. Detail- und Sammlungsseiten zeigen lokalisierte Offline-Fehler mit Wiederholen-Aktion.

Beide Ortungspfade verwenden hochgenaue kontinuierliche Ortung mit 30 Sekunden Timeout und 30 Sekunden Cache-Alter. Ein spaeterer Erfolg loescht alte Fehler. Die Karte aktualisiert Positionspunkt und Genauigkeitskreis, zeigt lokalisierte Fehler und beendet Tracking sowie Listener beim Unmount. Die Sammlungsansicht macht Ortungsfehler sichtbar.

Audio-Pfade beruecksichtigen den Production-`basePath`. Der Player pausiert beim Unmount, wartet auf ein erfolgreiches `play()`, ignoriert Seek vor gueltigen Metadaten und verwendet einen tastaturbedienbaren Range-Regler. Browser-Zoom wird nicht mehr durch Viewport-Metadaten gesperrt.

Alle im Bericht genannten UI- und ARIA-Texte werden ueber das vorhandene sechs-sprachige Woerterbuch geliefert. Distanzformatierung akzeptiert den lokalisierten Text fuer den unmittelbaren Standort. `t()` toleriert fehlende Textobjekte. Telefonnummern werden `tel:`-Links, aktive Navigation und Sprachwahl erhalten `aria-current` beziehungsweise `aria-pressed`.

Material Symbols werden durch `lucide-react`-SVG-Icons ersetzt, sodass die Oberflaeche offline keine externe Google-Font-Datei benoetigt. Die Bild-Lightbox erhaelt Dialogsemantik, initialen Fokus, Tab-Fokusbegrenzung, Wiederherstellung des vorherigen Fokus und einen iOS-tauglichen Scroll-Lock.

## Admin und Datenintegritaet

Leere optionale Bildfelder werden aus dem Objekt entfernt. Bild-Nachweis, URL und Beschriftung aendern nur den lokalen Formularstand und werden mit dem Haupt-Speichern geschrieben; Upload, Reihenfolge und Entfernen bleiben direkte, explizite Aktionen.

Beim Loeschen eines POI werden referenzierende Collections mit aktuellen Audit-Feldern und die POI-Loeschung in einem gemeinsamen Firestore-Batch geschrieben. Backup-Importe werden vollstaendig vorbereitet und in genau einem Batch geschrieben; ueberschreitet der Import Firestores 500-Operationen-Grenze, wird er vor jedem Schreibzugriff abgelehnt.

Neue POI-IDs werden innerhalb einer Firestore-Transaktion auf Kollision geprueft und bei Bedarf deterministisch mit `-2`, `-3` usw. ergaenzt. Dadurch koennen auch zwei gleichzeitige Editoren keinen bestehenden POI ueberschreiben. AuthGate unterscheidet einen wirklich nicht freigeschalteten Account von einem technischen Prueffehler und bietet bei letzterem Wiederholen an.

Koordinateneingaben werden vor dem Speichern als Paar validiert. Eine unveraenderte Koordinate behaelt ihre Quelle; nur eine tatsaechliche Positionsaenderung setzt die Quelle auf `redaktionell`. Halb leere oder ungueltige Werte werden nicht gespeichert. Der doppelte Admin-Navigationspunkt wird entfernt.

## Repository und Verifikation

Temporaerer Uebersetzungs-Cache und `outputs/` werden ignoriert. Der GitHub-Pages-Deploy startet erst nach einer erfolgreichen Test-Suite; diese enthaelt auch den Production-Build und Artefaktpruefungen.

Unit-Tests decken URL-Erzeugung und Redirects, Asset-Pfade, tolerantes i18n, Koordinatenvalidierung, ID-Kandidaten, Bildbereinigung und Importgrenzen ab. Emulator-E2E-Tests decken insbesondere Routing, Admin-Speichern, atomare Loeschung und Wiederherstellung sowie relevante Fehler-/Retry-Zustaende ab; Rules-Tests sichern die Batch-Auditfelder. Abschliessend muessen Unit-, TypeScript-, Rules- und E2E-Tests sowie der Production-Build erfolgreich laufen. `out/poi.html`, `out/admin/poi/edit.html` und der Redirect-Code in `out/404.html` werden explizit geprueft.

`AGENTS.md` und `README.md` werden fuer Query-Routen, Fallback, Offline-/Retry-Verhalten, Admin-Integritaet und die neue Icon-Abhaengigkeit aktualisiert. Echte Android-Tests in Chrome und Firefox bleiben eine manuelle Release-Pruefung: Erstberechtigung, Ablehnung, Timeout und Flugmodus.
