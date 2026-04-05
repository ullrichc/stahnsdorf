# Testplan: Südwestkirchhof Redaktionswerkzeug

Dieses Dokument beschreibt systematisch alle End-to-End Testfälle (E2E) für das Admin-Tool (`/admin`). Der Plan wurde iterativ geprüft und fokussiert sich auf den **tatsächlich implementierten Ist-Zustand** der Anwendung (Stand April 2026).

> [!WARNING]
> **Bekannte Lücken & Bugs:** Dieser Plan macht transparente Unterscheidungen zwischen dem Ist-Zustand (was aktuell in der UI passiert) und dem Ziel-Zustand. Diese sind in den Testfällen ausdrücklich als "Bekannte Lücken" beschrieben, damit E2E-Tests nicht fälschlicherweise fehlschlagen oder Sicherheiten vorgegaukelt werden.

## 1. Test-Architektur & Automatisierung (QA Perspektive)
* **Isolation:** Tests laufen gegen die lokale Firebase Emulator Suite.
* **Auth-Bypass:** Playwright nutzt Testmode-Logins oder injizierte Tokens, um Google-OAuth zu umgehen.
* **Race-Conditions:** Alle Asserts müssen auf explizite Netzwerkanfragen zur Firestore-DB warten.

## 2. Authentifizierung & Autorisierung (AuthGate)

| ID | Bereich | Testfall | Erwartetes Verhalten (Ist-Zustand) | Randfälle / Bugs |
| :--- | :--- | :--- | :--- | :--- |
| AUTH-01 | Login | Erfolgreicher Login | Aufhebung des AuthGates, Admin-Inhalte (Dashboard) werden sichtbar. Name/Email stehen im Footer. | |
| AUTH-02 | Login | Login abgelehnt (Email nicht in Whitelist) | AuthGate zeigt Fehlermeldung ("Zugriff verweigert"). | |
| AUTH-03 | Zugang | Aufruf einer Admin-URL ohne Session | **Kein** Redirect. Das `AuthGate` rendert die Login-Oberfläche statisch "in-place" über die geschützte Route. | |

## 3. Dashboard & POI-Tabelle (`/admin`)

| ID | Bereich | Testfall | Erwartetes Verhalten | Randfälle / Edge Cases |
| :--- | :--- | :--- | :--- | :--- |
| TAB-01 | Anzeige | Korrektes Laden der Daten | Tabelle listet POIs auf. Zähler stimmt mit Reihenanzahl überein. | |
| TAB-02 | Filterung | Filtern nach "Typ" (z.B. Grab) | Es werden ausschließlich Gräber angezeigt. Zähler aktualisiert sich korrekt. | |
| TAB-03 | Filterung | Kombination von Filtern | Z.B. `Status = prüfen` UND `Publish = Entwurf`. | Kombination führt zu exakt 0 Ergebnissen. |
| TAB-04 | Sortierung | Klick auf Spaltenkopf "Name" | Sortiert alphabetisch. Erneuter Klick dreht Sortierung. | |

## 4. POI-Editor (Formular & Daten)

*Hinweis: Der aktuelle POI-Editor (`POIForm.tsx`) rendert **keine** Felder für Fremdsprachen (EN/FR) und **keine** Felder für Bilder (`bilder`) oder Audio (`audio`).*

| ID | Bereich | Testfall | Erwartetes Verhalten (Ist-Zustand) | Randfälle / Bugs |
| :--- | :--- | :--- | :--- | :--- |
| EDI-01 | Neu | POI erstellen ohne Pflichtfeld (Name de) | Speichern schlägt fehl, sichtbare Fehlermeldung wird gerendert. | Leerzeichen-Strings als Name werden abgefangen. |
| EDI-02 | Geodaten | Formate & Entfernen | Werte werden geparst. Klick auf "Koordinaten entfernen" setzt `koordinaten: null` im Payload. | |
| EDI-03 | Quellen | Leere Felder entfernen | Array mit [ "Quelle A", "" ] wird geparsed zu ["Quelle A"] vor dem Speichern. | |
| EDI-04 | Feature-Gap | Keine Bild/Audio Bearbeitung | Test überprüft lediglich, dass existierende Bild/Audio/Fremdsprachendaten beim Aktualisieren anderer Felder in der DB *erhalten* bleiben. | UI unterstützt diese Felder derzeit überhaupt nicht. |

## 5. Publish-Workflow & Sicherheit

| ID | Bereich | Testfall | Erwartetes Verhalten (Ist-Zustand) | Randfälle / Bugs |
| :--- | :--- | :--- | :--- | :--- |
| PUB-01 | Flow | Veröffentlichungs-Stufen | Status-Label und Buttons für Entwurf/Zur Prüfung/Veröffentlicht funktionieren lokal im Editor korrekt. | |
| PUB-02 | Offline | Verbindungsabbruch beim Speichern | Browser offline -> Klick auf Speichern bleibt im IndexedDB hängen oder wirft Netzwerkfehler. | |
| PUB-03 | Security | Audit-Feld Manipulation (Injection) | *IST-ZUSTAND*: Ein präparierter API-Call überschreibt `erstellt_von` erfolgreich. Tests müssen bestätigen, dass Backend manipulierbar ist. | **[BUG-P1]** Firestore Rules sichern momentan Field-Level-Integrität *nicht* ab. Nur App-Authentifizierung wird geprüft. |

## 6. Sammlungen-Editor (`/admin/collections`)

| ID | Bereich | Testfall | Erwartetes Verhalten | Randfälle / Bugs |
| :--- | :--- | :--- | :--- | :--- |
| COL-01 | UX | Collection Name überschreiben | Klick auf Edit, Ändern des Namens, Speichern -> Änderung in DB. | |
| COL-02 | UX | POI suchen & hinzufügen | Auswahl im Editor fügt korrekte POI-ID ins Array der Collection. | |
| COL-03 | Schema | Konstruktion der neuen ID | *IST-ZUSTAND*: Speichern einer neuen Collection erzeugt die ID `col_sws_...`. Test muss dies vorerst validieren. | **[BUG-P2]** Schema dokumentiert zwingend `collection_sws_...`, `page.tsx` generiert derzeit manuell falsch `col_sws_`. |

## 7. Backup & Restore (`/admin/backup`)

| ID | Bereich | Testfall | Erwartetes Verhalten (Ist-Zustand) | Randfälle / Bugs |
| :--- | :--- | :--- | :--- | :--- |
| BAK-01 | Download| Dateinamen und Inhalt | Download startet (`content_export_*.json`). JSON ist valide. | |
| BAK-02 | Import  | Ungültiges / Strukturell falsches JSON | *IST-ZUSTAND*: Parser scheitert an Syntaxfehlern. Aber strukturelle Schema-Verletzungen (z.B. falsche Feldtypen) werden gnadenlos geladen. | **[BUG-P1]** Es existiert derzeit keine Schema-Validierung vor dem `setDoc` Upsert. |
| BAK-03 | Import  | Integritätsprüfung (Referenzen) | Collection referenziert `poi_sws_fake`. Restore-Preview warnt vor fehlendem POI in der Tabelle. | |
| BAK-04 | Import  | Merge vs. Replace Semantik | *IST-ZUSTAND*: Import führt nur `upserts` (Merges) durch. Veraltete POIs in der Live-DB bleiben ungelöscht bestehen. | **[BUG-P1]** Restore vernichtet *keine* verwaisten Dokumente. Überschreiben im Konfliktfall ist aktiv. |
