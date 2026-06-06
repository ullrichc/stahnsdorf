# Redaktionelle Leitlinien für POI-Informationstexte

Diese Leitlinien gelten für `beschreibung` bei POIs. Sie sollen verhindern, dass die Detailansicht doppelte oder quellenhafte Texte zeigt.

## Grundsatz

Der Informationstext beantwortet: Warum ist dieser POI interessant?

Er wiederholt nicht, was die Detailansicht bereits separat zeigt.

## Regeln

1. **Nicht wiederholen, was die UI schon zeigt**
   Kein Name am Satzanfang nur zur Wiederholung. Keine Lebensdaten im Text, wenn `datum_von` und `datum_bis` gepflegt sind. Keine Lageangaben in `beschreibung`.

2. **Kurz und inhaltlich stark schreiben**
   Ziel sind 1-2 Sätze. Der Text benennt Bedeutung, Werk, historische Rolle oder Besonderheit des Ortes.

3. **Personen über Leistung erklären**
   Nicht nur Berufsetikett und Lebensdaten nennen. Stattdessen sagen, was die Person geprägt, geschaffen oder historisch relevant gemacht hat.

4. **Orte direkt beschreiben**
   Keine Formulierungen wie "Öffentliche Beschreibungen nennen...". Besuchertext sagt direkt, was dort ist und warum der Ort zählt.

5. **Quellenprosa vermeiden**
   Quellen gehören in `quellen`, Unsicherheiten in `notiz`, Lageangaben in `lagehinweis`. Die Beschreibung bleibt ein lesbarer Informationstext.

6. **Daten nur belastbar ergänzen**
   Fehlende Geburts- und Sterbedaten werden recherchiert und als `YYYY-MM-DD` eingetragen, wenn der exakte Tag belegt ist. Wenn nur ein Jahr belastbar ist, bleibt es beim Jahr oder die Unsicherheit wird in `notiz` dokumentiert.

7. **Kurztext und Beschreibung trennen**
   `kurztext` benennt knapp Rolle oder Bedeutung, aber nicht "Grab von ...". Dass es sich bei Personen-POIs um eine Grabstätte handelt, ist im Kontext der App klar. `beschreibung` liefert den Mehrwert und wiederholt nicht denselben Inhalt in anderer Länge.

8. **Alle genutzten Sprachen pflegen**
   Deutsch ist die Quellsprache. `en`, `fr`, `pl`, `ru` und `sv` werden sinngemäß und natürlich formuliert.

## Praktische Muster

### Personen

1 Satz über die Hauptbedeutung, optional 1 Satz Kontext oder Bezug.

Gut:

> Prägte die Berliner Mordkommission mit moderner Tatortarbeit und wurde zum Vorbild für Kriminalfiguren der Weimarer Zeit.

Schlecht:

> Ernst Gennat (1880-1939) - Kriminalist und Begründer der Berliner Mordkommission.

### Bauwerke und Mausoleen

Entstehung, Stil und Besonderheit nennen.

### Gedenkanlagen und Kriegsgräber

Sagen, wem gedacht wird und warum der Ort innerhalb des Friedhofs wichtig ist.

### Bereiche

Funktion innerhalb des Friedhofs und historische Bedeutung beschreiben.

## Beispiel Heldenblock

Gut:

> Der deutsche Ehrenblock erinnert an Gefallene des Ersten Weltkriegs und bildet zusammen mit den britischen und italienischen Kriegsgräberstätten ein wichtiges Erinnerungsensemble des Friedhofs.

Schlecht:

> Öffentliche Beschreibungen nennen auf dem Südwestkirchhof neben dem britischen und italienischen Soldatenfriedhof auch einen deutschen Ehrenblock beziehungsweise Heldenblock.
