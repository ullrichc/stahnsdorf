# QR-Karten A7 - Druckdesign

## Ziel

Zwei druckfertige PDF-Dateien machen den Zugang zur Karten-App des Südwestkirchhofs als laminierbare QR-Karte verfügbar:

1. eine einzelne Karte im Format DIN A7 hoch;
2. ein DIN-A4-Druckbogen mit acht identischen DIN-A7-Karten.

## Einzelkarte

- Endformat: DIN A7 hoch, 74 x 105 mm
- DIN A7 bezeichnet das zugeschnittene Papierformat vor dem Laminieren; der verschweißte Laminatrand vergrößert die fertige Karte
- weißer Hintergrund mit den Farben des bestehenden Festplakats `outputs/festplakat-fest-2026-09-05.html`
- Dunkelgrün `#00362C`, Mittelgrün `#15574D` und Orange `#F28F04`
- 46 x 46 mm großer, kontrastreicher QR-Code in Dunkelgrün auf Weiß
- Fehlerkorrekturstufe M, mindestens vier QR-Module weiße Ruhezone und mindestens 0,8 mm gedruckte Modulgröße
- Überschrift: "Karte des Südwestkirchhofs"
- Handlungsaufforderung: "Mit der Smartphone-Kamera scannen"
- ausgeschriebene Ersatzadresse: `suedwestkirchhof.de/app`
- Sicherheitsabstand von mindestens 5 mm zu allen Schnittkanten
- Überschrift in einer kräftigen Serifenschrift, Handlungsaufforderung und Adresse in einer gut lesbaren serifenlosen Schrift
- keine Beschnittzugabe

## A4-Druckbogen

- Endformat: DIN A4 hoch, 210 x 297 mm
- acht vollständige DIN-A7-Hochformatkarten
- Anordnung als zwei Spalten und vier Reihen
- jede A7-Karte wird auf dem A4-Bogen um 90 Grad gedreht, damit acht Karten nahezu ohne Verschnitt passen
- die gedrehte Karte misst auf dem Bogen 105 x 74 mm; das Raster misst damit 210 x 296 mm
- das Raster wird vertikal zentriert und beginnt 0,5 mm unter der oberen Seitenkante
- Spaltengrenze bei x = 105 mm; Zeilengrenzen bei y = 0,5 / 74,5 / 148,5 / 222,5 / 296,5 mm
- Schnittlinien in 0,15 pt und Hellgrau `#B8C0BC`, exakt auf den Kartengrenzen; die Linien werden beim Schneiden entfernt beziehungsweise liegen nur auf der späteren Schnittkante
- nach dem Ausschneiden werden die Karten ins Hochformat gedreht
- alle Karten sind inhaltlich und gestalterisch identisch mit der Einzelkarte
- Druckhinweis im PDF-Metadatenfeld und in der Übergabe: mit 100 % beziehungsweise "Tatsächliche Größe" drucken, nicht "An Seite anpassen"
- ein Drucker ohne randlosen Druck darf die äußeren weißen Kartenränder unbedruckt lassen; alle Nutzinhalte liegen mindestens 5 mm innerhalb der Karten

## Druckqualität und Prüfung

- QR-Code als Vektorgrafik, nicht als Screenshot; Zieladresse `https://suedwestkirchhof.de/app`
- Schriften und Gestaltungselemente bleiben beim PDF-Export vektorbasiert
- beide PDFs werden auf korrektes Seitenmaß und Seitenzahl geprüft
- beide PDFs werden als PNG gerendert und visuell auf Beschnitt, Überlagerungen und Lesbarkeit kontrolliert
- der erzeugte QR-Code wird vor dem PDF-Export gegen die Zieladresse geprüft
- nach dem Export werden die QR-Codes aus beiden gerenderten PDFs mit einem unabhängigen Decoder geprüft; auf dem A4-Bogen werden alle acht Positionen kontrolliert
- zusätzlich wird empfohlen, vor der Auflage eine Karte bei 100 % auszudrucken, zu laminieren und mit mindestens zwei unterschiedlichen Smartphones zu scannen
