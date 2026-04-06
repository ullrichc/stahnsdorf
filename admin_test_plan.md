# Testplan: Südwestkirchhof Redaktionswerkzeug

Stand: April 2026 — basiert auf dem tatsächlich implementierten Code.

> [!IMPORTANT]
> **Ist-Zustand vs. Soll-Zustand**: Jeder Testfall beschreibt das *aktuell erwartete* Verhalten. Felder, die noch nicht in der UI existieren (z.B. Bilder/Audio-Editing), werden als Feature-Gaps dokumentiert — nicht als Tests, die fälschlicherweise "grün" wären.

---

## 1. Test-Architektur

| Thema | Entscheidung |
|---|---|
| Backend | Firebase Local Emulator Suite (`npm run emulators`) |
| Auth-Bypass | Emulator Auth erlaubt programmatische Token-Erzeugung; kein OAuth nötig |
| Fixture-Setup | Vor Tests: Emulator-DB seeden via Admin SDK, Editor-Whitelist anlegen |
| Waits | Kein `waitForTimeout`. Statt dessen auf DOM-Elemente warten (`waitForSelector`, `waitForResponse`) |
| Isolation | Emulator-DB pro Test-Suite zurücksetzen (`DELETE /emulator/v1/projects/{id}/databases/…`) |
| Framework | Playwright + Vitest |
| Base-URL | `http://localhost:3000` (Next.js dev, kein `basePath` lokal) |

> [!IMPORTANT]
> **Voraussetzung:** Die Pakete `@playwright/test` und `@firebase/rules-unit-testing` sind aktuell **nicht** in `package.json` enthalten und müssen vor dem ersten Testlauf installiert werden:
> ```bash
> npm install -D @playwright/test @firebase/rules-unit-testing
> npx playwright install
> ```

### Voraussetzungen (Installation)

Diese Pakete müssen als devDependencies installiert werden (aktuell **nicht** in `package.json`):

| Paket | Zweck | Status |
|---|---|---|
| `@playwright/test` | E2E-Tests im Browser | ❌ Noch nicht installiert |
| `@firebase/rules-unit-testing` | Firestore Security Rules testen (ohne Browser) | ❌ Noch nicht installiert |

---

## 2. Authentifizierung & Autorisierung (AuthGate)

> Implementierung: [`AuthGate.tsx`](src/components/admin/AuthGate.tsx)
> Layout: [`admin/layout.tsx`](src/app/admin/layout.tsx) — rendert `<AuthGate>` um `<AdminSidebar>` + `{children}`

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| AUTH-01 | Erfolgreicher Login (Whitelist-Editor) | AuthGate verschwindet. Sidebar wird sichtbar mit User-Name. Hauptbereich zeigt POI-Tabelle. | Sidebar-Footer zeigt `displayName` und "Archivist Mode". |
| AUTH-02 | Login mit nicht-whitelisteter Email | Seite zeigt "Zugriff verweigert" und die E-Mail des Benutzers. "Mit anderem Konto anmelden"-Button löst `signOut` aus. | Kein Redirect — Fehler wird in-place gerendert. |
| AUTH-03 | Direktzugriff `/admin/backup` ohne Session | AuthGate rendert Login-Card in-place. Kein Redirect auf `/login` oder ähnlich. | Gilt für *alle* `/admin/*`-Routen identisch. |
| AUTH-04 | Abmelden über Sidebar-Button | `signOut(auth)` wird aufgerufen. AuthGate rendert Login-Card erneut. | Button ist in [`AdminSidebar.tsx`](src/components/admin/AdminSidebar.tsx). |

---

## 3. Admin-Navigation (Sidebar)

> Implementierung: [`AdminSidebar.tsx`](src/components/admin/AdminSidebar.tsx)

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| NAV-01 | Sidebar sichtbar nach Login | Sidebar mit 4 Links: Übersicht, POIs, Sammlungen, Backup. Brand-Header "The Eternal Archive". | |
| NAV-02 | Active-State: `/admin` | "Übersicht" und "POIs" haben Klasse `.active` (beide zeigen auf `/admin` mit `exact: true`). | **Bekanntes Problem**: Beide Links verweisen auf denselben Pfad — "Übersicht" und "POIs" sind de facto identisch. |
| NAV-03 | Active-State: `/admin/collections` | "Sammlungen"-Link hat `.active`. Andere Links nicht. | |
| NAV-04 | Active-State: `/admin/backup` | "Backup"-Link hat `.active`. | |
| NAV-05 | Navigation zu Sammlungen | Klick auf "Sammlungen" → URL ändert sich zu `/admin/collections`. Sammlungen-Seite wird geladen. | |

---

## 4. Dashboard & POI-Tabelle (`/admin`)

> Implementierung: [`admin/page.tsx`](src/app/admin/page.tsx)

### 4.1 Daten & Anzeige

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| TAB-01 | Tabelle lädt POIs | Tabelle listet POIs. Stats-Card zeigt **nur die Gesamtzahl** (`stats.total`) — ein einzelner Wert, keine weiteren Kennzahlen. Footer zeigt "Zeige X von Y POIs". | `stats.withCoords`, `stats.zurPruefung`, `stats.entwuerfe` werden berechnet ([`page.tsx` L118–123](src/app/admin/page.tsx)) aber **nicht gerendert** ([`page.tsx` L175–178](src/app/admin/page.tsx)). Siehe BUG-10. |
| TAB-02 | Textsuche | Eingabe in Suchfeld filtert nach `name.de` (case-insensitive). | Suche läuft über `t(p.name, 'de').toLowerCase().includes(s)`. |
| TAB-03 | "Neuer POI"-Button | Link navigiert zu `/admin/poi/new`. | |

### 4.2 Filterung

> [!NOTE]
> Die State-Variablen `filterStatus` und `onlyNoCoords` existieren im Code ([`page.tsx` L38–39](src/app/admin/page.tsx)) und die Filterlogik ist implementiert ([`page.tsx` L73–74](src/app/admin/page.tsx)), aber **es gibt keine zugehörigen UI-Controls** in der gerenderten Toolbar. Nur Typ- und Publish-Status-Dropdowns sind sichtbar. Tests dürfen daher **nur** die beiden sichtbaren Dropdowns (Typ und Publish-Status) via UI testen. Siehe BUG-09.

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| FIL-01 | Filter nach Typ (z.B. `grab`) | Nur POIs mit `typ === 'grab'` angezeigt. Footer-Zähler aktualisiert. | Dropdown mit Label "Typ". |
| FIL-02 | Filter nach Publish-Status | Dropdown (Label: "Status") mit Entwurf/Zur Prüfung/Veröffentlicht. | In der UI als "Status" gelabelt, steuert aber `filterPublish`, nicht `filterStatus`. |
| FIL-03 | Kombination Typ + Publish | Z.B. Typ=`grab` + Publish=`entwurf` → Schnittmenge. | Kann 0 Ergebnisse liefern. Nur die zwei sichtbaren Dropdowns kombinieren. |

### 4.3 Sortierung

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| SRT-01 | Klick auf Spalte "Name" | Sortiert alphabetisch (asc). Erneuter Klick → desc. | `localeCompare('de')` |
| SRT-02 | Sortierung nach Typ | Klick auf "Typ" sortiert nach Typ-String. | |
| SRT-03 | Sortierung nach Datum | Klick auf "Zeitraum" sortiert nach `datum_von`. Leere Werte (`null` → `''`) sortieren **an den Anfang** bei asc (Leerstring `< ` Datum per `localeCompare`). | [`page.tsx` L98–99](src/app/admin/page.tsx): `null` wird zu `''` gemappt. `''.localeCompare('1850-…')` → negativer Wert → Leerstrings stehen bei asc **vor** echten Daten. |

---

## 5. POI-Editor (`/admin/poi/[id]` und `/admin/poi/new`)

> Implementierung: [`POIForm.tsx`](src/components/admin/POIForm.tsx)

### 5.1 Neuer POI

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| NEW-01 | Formular leer bei neuem POI | Alle Felder leer/default. Typ = `grab`, Status = `prüfen`, Publish = `entwurf`. | |
| NEW-02 | Pflichtfeld Name leer → Fehler | Klick auf "Speichern" ohne Name zeigt Fehlermeldung "Name (de) ist ein Pflichtfeld." | |
| NEW-03 | Pflichtfeld Name nur Leerzeichen → Fehler | `"   "` als Name → Validierung schlägt fehl (`.trim()` check). | |
| NEW-04 | ID-Generierung | Name `"Heinrich Zille"` → ID `poi_sws_heinrich-zille`. Umlaute bleiben erhalten (`ä`, `ö`, `ü`, `ß`). | Regex: `[^a-z0-9äöüß]` → `-`. |
| NEW-05 | Audit-Felder bei Create | `erstellt_von` und `geaendert_von` werden auf `user.email` gesetzt. `erstellt_am` und `geaendert_am` auf `Timestamp.now()`. | |

### 5.2 Bestehender POI bearbeiten

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| EDIT-01 | Formulardaten laden | Alle gespeicherten Felder erscheinen vorausgefüllt. Metadaten-Box zeigt erstellt_von/am, geändert_von/am. | |
| EDIT-02 | Audit-Felder bei Update | `erstellt_von`/`erstellt_am` bleiben unverändert (aus `originalData`). Nur `geaendert_von` und `geaendert_am` werden aktualisiert. | |
| EDIT-03 | Bild/Audio/Fremdsprachen bleiben erhalten | Ein POI mit `bilder`, `audio` und Fremdsprach-Texten (EN/FR) wird editiert → nur geänderte Felder überschrieben, Rest bleibt. | `formData` enthält den gesamten Payload via `{...formData}`. |

### 5.3 Geodaten

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| GEO-01 | Koordinaten eingeben | `52.3912` / `13.1899` → Wird geparsed. Speichern schreibt `{ lat: 52.3912, lng: 13.1899 }`. | |
| GEO-02 | Koordinaten entfernen | Klick auf "Koordinaten entfernen" → setzt `koordinaten: null`. Hinweis "Keine Koordinaten — POI erscheint nicht auf der Karte" wird sichtbar. | |
| GEO-03 | Mein Standort (GPS) | Klick auf 📍-Button → Browser fragt Geolocation. Bei Erfolg: Lat/Lng Felder gefüllt (auf 6 Dezimalstellen gerundet). | `navigator.geolocation` muss gemockt werden. |
| GEO-04 | Ungültige Eingabe | Buchstaben in Lat/Lng → `parseFloat` gibt `NaN`, Koordinaten werden *nicht* gesetzt. | Kein Fehlerfeedback in der UI. |

### 5.4 Quellen-Editor

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| SRC-01 | Quelle hinzufügen | Klick auf "+ Quelle hinzufügen" → neues leeres Textfeld. | |
| SRC-02 | Quelle entfernen | Klick auf "✕" entfernt die jeweilige Quelle. | |
| SRC-03 | Leere Quellen werden gefiltert | `["Quelle A", "", "  "]` → nach Speichern nur `["Quelle A"]` in Firestore. | `.filter(q => q.trim())` |

### 5.5 POI löschen

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| DEL-01 | POI löschen mit Bestätigung | `window.confirm` → OK → POI wird gelöscht + Referenz aus allen Collections entfernt. Redirect auf `/admin`. | Kaskadierende Löschung in [`POIForm.tsx` L186–196](src/components/admin/POIForm.tsx). |
| DEL-02 | POI löschen abbrechen | `window.confirm` → Abbrechen → nichts passiert. | |
| DEL-03 | Löschen-Button nur bei bestehenden POIs | Bei `/admin/poi/new` kein "Löschen"-Button sichtbar. | |

### 5.6 Feature-Gaps (kein Test möglich)

| Gap | Beschreibung |
|:---|:---|
| Bilder-Editor | Kein UI zum Verwalten von `bilder[]` (Datei, Nachweis, Beschriftung). Bestehende Bilder bleiben beim Speichern erhalten. |
| Audio-Editor | Kein UI zum Verwalten von `audio` (URLs pro Sprache). Bestehende Daten bleiben erhalten. |
| Fremdsprachen-Editor | Nur `de`-Felder editierbar. EN/FR/PL/RU/SV müssen extern generiert werden. |

---

## 6. Publish-Workflow

> Implementierung: Workflow-Buttons in [`POIForm.tsx` L410–431](src/components/admin/POIForm.tsx)

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| PUB-01 | Entwurf → Zur Prüfung | Badge zeigt "Entwurf". Klick "Zur Prüfung einreichen" → Badge wechselt zu "Zur Prüfung". | Status wird nur lokal gesetzt — erst beim Speichern in DB geschrieben. |
| PUB-02 | Zur Prüfung → Veröffentlicht | Button "Veröffentlichen" setzt `publish_status: 'veröffentlicht'`. | |
| PUB-03 | Zur Prüfung → Zurück zum Entwurf | Button "Zurück zum Entwurf" setzt `publish_status: 'entwurf'`. | |
| PUB-04 | Veröffentlicht → Zurückziehen | Button "Zurückziehen" setzt `publish_status: 'entwurf'`. | Kein Zwischenschritt über `zur_prüfung`. |
| PUB-05 | Workflow ohne Speichern | Status-Wechsel + Seite verlassen ohne Speichern → Änderung geht verloren. | Kein "Unsaved Changes"-Warning implementiert. |

---

## 7. Sammlungen-Editor (`/admin/collections`)

> Implementierung: [`admin/collections/page.tsx`](src/app/admin/collections/page.tsx)

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| COL-01 | Sammlungsliste laden | Alle Collections erscheinen als Karten mit Name, POI-Anzahl, Publish-Badge. | |
| COL-02 | Neue Sammlung anlegen | Klick "+ Neue Sammlung" → Modal öffnet sich mit leeren Feldern. | |
| COL-03 | ID-Generierung bei neuer Sammlung | Name "Architektur & Anlage" → ID `collection_sws_architektur-anlage`. | [`collections/page.tsx` L117](src/app/admin/collections/page.tsx): Zuerst `[^a-z0-9äöüß]` → `-`, dann `/-+/g` → `-` (Mehrfach-Bindestriche werden kollabiert), dann `^-|-$` Trim. Aus `"architektur---anlage"` wird `"architektur-anlage"`. |
| COL-04 | Name ändern und speichern | Edit → Name ändern → Speichern → Collection-Karte aktualisiert sich. | |
| COL-05 | POI suchen & hinzufügen | Suchfeld filtert POI-Liste. Checkbox toggelt POI in `pois[]`-Array. | |
| COL-06 | POI entfernen | Checkbox deaktivieren → POI wird aus `pois[]` entfernt. | |
| COL-07 | Sammlung löschen | "Löschen"-Button → `window.confirm` → Collection wird gelöscht. | Button nicht sichtbar bei neuen Sammlungen. |
| COL-08 | Publish-Status ändern | Dropdown mit Entwurf/Zur Prüfung/Veröffentlicht im Modal. | |
| COL-09 | Pflichtfeld Name → Fehler | Leerer Name → "Name (de) ist ein Pflichtfeld." | |

---

## 8. Backup & Restore (`/admin/backup`)

> Implementierung: [`BackupRestore.tsx`](src/components/admin/BackupRestore.tsx)

### 8.1 Export

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| EXP-01 | Inhalts-Export | Download startet. Dateiname: `stahnsdorf-export-YYYY-MM-DDTHH-MM.json`. JSON enthält `pois[]` und `collections[]` *ohne* Firestore-Meta (`publish_status`, `erstellt_von`, etc.). | |
| EXP-02 | Vollständiges Backup | Download startet. Dateiname: `stahnsdorf-backup-…json`. JSON enthält `_backup: true`, `_timestamp`, und alle Felder inkl. Timestamps als ISO-Strings. | |
| EXP-03 | Export-JSON ist valides JSON | `JSON.parse()` auf heruntergeladene Datei wirft keinen Fehler. | |

### 8.2 Import — Validierung & Preview

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| IMP-01 | Ungültiges JSON (Syntaxfehler) | Fehlermeldung "Datei konnte nicht gelesen werden: …" | `JSON.parse` wirft. |
| IMP-02 | POI mit falschem ID-Prefix | JSON enthält POI mit `id: "wrong_123"` → Fehlermeldung "ungültige POI-Daten". | Validierung prüft `id.startsWith('poi_sws_')`. |
| IMP-03 | Collection mit falschem ID-Prefix | JSON enthält Collection mit `id: "col_sws_test"` → Fehler "ungültige Collections". | Validierung prüft `id.startsWith('collection_sws_')`. |
| IMP-04 | POI ohne Name | `name.de` fehlt → Fehler. | `isValidPOI` prüft `p.name?.de`. |
| IMP-05 | Preview: neue vs. bestehende POIs | Preview zeigt korrekte Anzahl für "Neu" und "Aktualisiert". | Vergleich mit existierenden IDs in Emulator-DB. |
| IMP-06 | Preview: Ungültige Referenzen | Collection referenziert `poi_sws_gibts_nicht` → `invalidRefs` zeigt Warnung. | |

### 8.3 Import — Ausführung

> [!CAUTION]
> **Regeln-Konflikt — auch im Emulator aktiv:** Der Emulator lädt die produktiven Rules aus [`firestore.rules`](firestore.rules) (konfiguriert in [`firebase.json` L2–3](firebase.json)). Die App spricht per Client SDK mit dem Emulator und unterliegt daher denselben `allow`/`deny`-Prüfungen wie gegen die echte DB. Nur das Seeding via Admin SDK ([`seed-emulator.ts`](scripts/seed-emulator.ts)) umgeht die Rules. **E2E-Tests (Playwright) werden die `PERMISSION_DENIED`-Fehler von BUG-06/07 also reproduzieren.**
>
> **Betrifft POIs UND Collections gleichermaßen.** Der Import-Code durchläuft beide Dokumenttypen sequentiell: erst POIs ([`BackupRestore.tsx` L172–193](src/components/admin/BackupRestore.tsx)), dann Collections ([L202–224](src/components/admin/BackupRestore.tsx)). Die Firestore Rules für Collections ([`firestore.rules` L28–35](firestore.rules)) spiegeln die POI-Rules ([L13–20](firestore.rules)) 1:1. Jeder unten beschriebene Pfad gilt daher symmetrisch für beide Dokumenttypen.
>
> **Funktionierender grüner Pfad:**
> - **Content-Import neuer POIs/Collections** (`create`): ✅ — Code setzt `erstellt_von`/`geaendert_von` auf `user.email` ([`BackupRestore.tsx` L185/187](src/components/admin/BackupRestore.tsx) für POIs, [L216/218](src/components/admin/BackupRestore.tsx) für Collections), stimmt mit Rules überein.
> - **Full-Backup neuer POIs/Collections** (`create`): ⚠️ Nur wenn `erstellt_von` und `geaendert_von` in der Backup-Datei mit dem aktuell eingeloggten Editor übereinstimmen. Andernfalls scheitert der `create` an [`firestore.rules` L14–15](firestore.rules) (POIs) bzw. [L29–30](firestore.rules) (Collections). → **BUG-07**
> - **Skip-Modus** (bestehende Dokumente): ✅ — Bestehende Dokumente werden übersprungen, kein `setDoc`-Aufruf ([`BackupRestore.tsx` L174](src/components/admin/BackupRestore.tsx) für POIs, [L204](src/components/admin/BackupRestore.tsx) für Collections). **Aber:** Neue Dokumente im selben Import werden weiterhin per `setDoc` geschrieben. Bei Full-Backups können diese `create`s an den Audit-Feld-Rules scheitern (siehe Full-Backup-Pfad oben).
>
> **Fehlschlagende Pfade:**
> - **Content-Import Overwrite** (`update`): ❌ — `erstellt_von`/`erstellt_am` werden neu gesetzt ([`BackupRestore.tsx` L184–188](src/components/admin/BackupRestore.tsx) für POIs, [L215–219](src/components/admin/BackupRestore.tsx) für Collections), Rules verlangen unveränderte Werte ([`firestore.rules` L17–18](firestore.rules) für POIs, [L32–33](firestore.rules) für Collections). → **BUG-06**
> - **Full-Backup Overwrite** (`update`): ❌ — `geaendert_von` aus Datei ≠ `request.auth.token.email` ([`firestore.rules` L19](firestore.rules) für POIs, [L34](firestore.rules) für Collections). → **BUG-07**

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| IMP-10 | Content-Import neuer POIs/Collections | Neue POIs und Collections werden angelegt mit `publish_status` = gewähltem Import-Status, `erstellt_von`/`geaendert_von` = aktueller User, `erstellt_am`/`geaendert_am` = `Timestamp.now()`. | ✅ Grüner Pfad. Kein Rules-Konflikt, da bei `create` die Audit-Felder korrekt auf `user.email` gesetzt werden ([`BackupRestore.tsx` L185/187](src/components/admin/BackupRestore.tsx) für POIs, [L216/218](src/components/admin/BackupRestore.tsx) für Collections). |
| IMP-11 | Full-Backup Restore neuer POIs/Collections | **Abhängig vom Backup-Inhalt.** Wenn `erstellt_von`/`geaendert_von` in der Datei mit dem aktuell eingeloggten Editor übereinstimmen → Dokumente werden angelegt. Andernfalls → `PERMISSION_DENIED` schon beim `create`. | ⚠️ `create`-Rules verlangen `erstellt_von == request.auth.token.email` UND `geaendert_von == request.auth.token.email` ([`firestore.rules` L14–15](firestore.rules) für POIs, [L29–30](firestore.rules) für Collections). Code übernimmt die Werte 1:1 aus der Backup-Datei ([`BackupRestore.tsx` L178–181](src/components/admin/BackupRestore.tsx) für POIs, [L211–213](src/components/admin/BackupRestore.tsx) für Collections). → **BUG-07** |
| IMP-12 | Merge-Modus: Skip | Bestehende POIs und Collections werden *nicht* überschrieben. Neue Dokumente werden weiterhin importiert. | ✅ für bestehende Dokumente (kein `setDoc`). ⚠️ Neue Dokumente im selben Import durchlaufen weiterhin `setDoc` → bei Content-Import grün (Audit-Felder korrekt gesetzt), bei Full-Backup nur grün wenn `erstellt_von`/`geaendert_von` in der Datei zum Editor passen (sonst `PERMISSION_DENIED` beim `create`, → BUG-07). |
| IMP-13 | Merge-Modus: Overwrite (Content-Import) | **Scheitert gegen Firestore Rules** (auch im Emulator): Code setzt `erstellt_von`/`erstellt_am` neu, aber Rules verlangen unveränderte Werte bei Updates. Betrifft POIs ([`BackupRestore.tsx` L184–188](src/components/admin/BackupRestore.tsx), [`firestore.rules` L17–18](firestore.rules)) **und** Collections ([`BackupRestore.tsx` L215–219](src/components/admin/BackupRestore.tsx), [`firestore.rules` L32–33](firestore.rules)). Test soll `PERMISSION_DENIED` reproduzieren. | **BUG-06** |
| IMP-14 | Merge-Modus: Overwrite (Full Backup) | **Scheitert gegen Firestore Rules** (auch im Emulator): `geaendert_von` kommt aus Backup-Datei, Rules verlangen aber `request.auth.token.email`. Betrifft POIs ([`firestore.rules` L19](firestore.rules)) **und** Collections ([`firestore.rules` L34](firestore.rules)). Test soll `PERMISSION_DENIED` reproduzieren. | **BUG-07** |
| IMP-15 | Destructive Restore | Full Backup + Delete-Modus aktiviert → POIs/Collections, die *nicht* im Backup sind, werden aus der DB gelöscht. Erfolgsmeldung zeigt Löschanzahl. | **Preconditions:** Der Delete-Zweig ([`BackupRestore.tsx` L227–247](src/components/admin/BackupRestore.tsx)) wird erst **nach** den `setDoc`-Schleifen für POIs ([L172–193](src/components/admin/BackupRestore.tsx)) und Collections ([L202–224](src/components/admin/BackupRestore.tsx)) erreicht. Wenn **irgendein** `setDoc` an den Rules scheitert (BUG-06/07), wirft die Funktion und der Delete-Zweig läuft **nie**. Verlässlich grüner Pfad nur bei **allen** folgenden Bedingungen: (1) `mergeMode === 'skip'` sodass bestehende Dokumente nicht angefasst werden, (2) falls das Backup *neue* Dokumente enthält: alle Audit-Felder (`erstellt_von`, `geaendert_von`) stimmen mit dem aktuell eingeloggten Editor überein (bei Content-Import automatisch erfüllt, bei Full-Backup nicht garantiert → BUG-07), (3) falls das Backup *keine* neuen Dokumente enthält: alle werden übersprungen und nur Deletes ausgeführt. Ein Overwrite bestehender Dokumente — auch mit inhaltlich identischen Daten — scheitert an den `update`-Rules, solange BUG-06/07 bestehen. |
| IMP-16 | Referenz-Bereinigung | Collections mit ungültigen POI-Referenzen → werden beim Import automatisch gesäubert (`filter`). | Keine Warnung beim Import selbst — nur Preview warnt. |
| IMP-17 | Merge-Modus-Selector nur bei POI-Konflikten sichtbar | Import mit bestehenden **Collections** aber keinen bestehenden **POIs** → Merge-Selector wird **nicht** angezeigt (`updatedPOIs.length === 0`). Default `skip` greift stillschweigend auch für Collections. | **BUG-08**. [`BackupRestore.tsx` L362](src/components/admin/BackupRestore.tsx): Selector nur wenn `updatedPOIs.length > 0`. [`BackupRestore.tsx` L203](src/components/admin/BackupRestore.tsx) wendet `mergeMode` trotzdem auf Collections an. |

---

## 9. Firestore Security Rules

> Implementierung: [`firestore.rules`](firestore.rules)

| ID | Testfall | Erwartetes Verhalten | Hinweise |
|:---|:---|:---|:---|
| SEC-01 | Öffentliches Lesen nur für veröffentlichte POIs | Unauthentifizierter Read auf POI mit `publish_status: 'entwurf'` → denied. | |
| SEC-02 | Öffentliches Lesen nur für veröffentlichte Collections | Gleich wie SEC-01 für Collections. | |
| SEC-03 | Editor kann alle POIs lesen | Editor (in Whitelist) kann auch Entwürfe lesen. | |
| SEC-04 | Nicht-Editor kann nicht schreiben | Authentifizierter User ohne `editors/{email}`-Dokument → write denied. | |
| SEC-05 | Create: `erstellt_von` muss eigene Email sein | Editor schreibt `erstellt_von: "fremde@email.de"` → denied. | ✅ Field-Level Rule aktiv. |
| SEC-06 | Update: `erstellt_von` darf nicht geändert werden | Editor ändert `erstellt_von` bei Update → denied (`request.resource.data.erstellt_von == resource.data.erstellt_von`). | ✅ Field-Level Rule aktiv. |
| SEC-07 | Update: `erstellt_am` darf nicht geändert werden | Gleich wie SEC-06 für Timestamp. | ✅ Field-Level Rule aktiv. |
| SEC-08 | Update: `geaendert_von` muss eigene Email sein | Editor setzt `geaendert_von` auf fremde Email → denied. | ✅ Field-Level Rule aktiv. |
| SEC-09 | Editor-Whitelist: eigenes Dokument lesen | User liest `editors/{own-email}` → allowed. | |
| SEC-10 | Editor-Whitelist: fremdes Dokument lesen | User liest `editors/{other-email}` → denied. | |
| SEC-11 | Editor-Whitelist: Schreiben verboten | Niemand kann `editors/`-Dokumente über die API erstellen/ändern/löschen. | `allow write: if false` |

> [!TIP]
> Security Rules testen via Firebase Emulator Rules Unit Testing (`@firebase/rules-unit-testing`) — kein Playwright nötig.

---

## 10. Bekannte Probleme & offene Punkte

### Bugs

| ID | Schwere | Beschreibung | Ort |
|:---|:---|:---|:---|
| BUG-01 | P3 | Sidebar-Links "Übersicht" und "POIs" verweisen beide auf `/admin` und sind funktional identisch. | [`AdminSidebar.tsx` L10–11](src/components/admin/AdminSidebar.tsx) |
| BUG-02 | P3 | Collections- und Backup-Seiten rendern einen eigenen Header mit Emoji (🌲) und eigener Navigation *zusätzlich* zur Sidebar. Doppelte Navigation. | [`collections/page.tsx` L171–178](src/app/admin/collections/page.tsx), [`backup/page.tsx` L13–21](src/app/admin/backup/page.tsx) |
| BUG-03 | P3 | POI-Editor nutzt noch Emojis (✏️ im Header, 📍 am GPS-Button) statt Material Symbols. | [`POIForm.tsx` L231, L381](src/components/admin/POIForm.tsx) |
| BUG-04 | P2 | Kein "Unsaved Changes"-Warning beim Verlassen des POI-Editors oder Collection-Modals. | |
| BUG-05 | P3 | Sammlungen-Editor hat inline-styles statt CSS-Klassen (abweichend vom Eternal Archive Design). | [`collections/page.tsx`](src/app/admin/collections/page.tsx) |
| BUG-06 | **P1** | **Content-Import Overwrite verletzt Firestore Rules (POIs und Collections).** Bei Overwrite bestehender Dokumente setzt der Code `erstellt_von` und `erstellt_am` neu ([`BackupRestore.tsx` L184–188](src/components/admin/BackupRestore.tsx) für POIs, [L215–219](src/components/admin/BackupRestore.tsx) für Collections), aber die Rules verlangen, dass diese Felder bei Updates unverändert bleiben ([`firestore.rules` L17–18](firestore.rules) für POIs, [L32–33](firestore.rules) für Collections). → `setDoc` schlägt mit Permission Denied fehl. | [`BackupRestore.tsx` L162–224](src/components/admin/BackupRestore.tsx) |
| BUG-07 | **P1** | **Full-Backup Restore verletzt Firestore Rules (POIs und Collections).** Bei Restore bestehender Dokumente bleibt `geaendert_von` aus der Backup-Datei erhalten (z.B. `"seed"`), aber die Rules verlangen `geaendert_von == request.auth.token.email` ([`firestore.rules` L19](firestore.rules) für POIs, [L34](firestore.rules) für Collections). → `setDoc` schlägt fehl. Zusätzlich bei `create`: Wenn die Backup-Datei einen anderen User als den aktuell eingeloggten für `erstellt_von`/`geaendert_von` enthält, scheitert auch das Anlegen neuer Dokumente ([`firestore.rules` L14–15](firestore.rules) für POIs, [L29–30](firestore.rules) für Collections). | [`BackupRestore.tsx` L178–181](src/components/admin/BackupRestore.tsx), [L211–213](src/components/admin/BackupRestore.tsx) |
| BUG-08 | P3 | **Merge-Modus-Selector nur bei POI-Konflikten sichtbar.** Wenn ein Import nur bestehende Collections betrifft (keine POI-Konflikte), wird der Merge-Selector nicht angezeigt. Der Default `skip` wirkt dann stillschweigend auf Collections, ohne dass der User das steuern kann. | [`BackupRestore.tsx` L362](src/components/admin/BackupRestore.tsx) |
| BUG-09 | P3 | **Dashboard: Ghost-Filterlogik ohne UI.** State-Variablen `filterStatus` und `onlyNoCoords` existieren ([`page.tsx` L38–39](src/app/admin/page.tsx)) und die Filter-Logik ist aktiv ([`page.tsx` L73–74](src/app/admin/page.tsx)), aber es gibt keine Dropdowns/Checkboxen in der Toolbar, um sie zu bedienen. Toter Code. | [`page.tsx` L38–39, L73–74](src/app/admin/page.tsx) |
| BUG-10 | P3 | **Dashboard: Stats-Werte berechnet aber nicht gerendert.** `stats.withCoords`, `stats.zurPruefung`, `stats.entwuerfe` werden berechnet ([`page.tsx` L118–123](src/app/admin/page.tsx)), aber die Stats-Card rendert nur `stats.total` ([`page.tsx` L175–178](src/app/admin/page.tsx)). | [`page.tsx` L118–123, L175–178](src/app/admin/page.tsx) |

### Feature-Gaps

| ID | Beschreibung |
|:---|:---|
| GAP-01 | Kein Bild-Upload/-Verwaltung im Editor |
| GAP-02 | Kein Audio-Upload/-Verwaltung im Editor |
| GAP-03 | Keine Fremdsprachen-Bearbeitung (nur `de`) |
| GAP-04 | Kein Duplicate-Check bei POI-ID-Generierung (Namenskollisionen möglich) |
| GAP-05 | Kein Datumsformat-Validierung (`datum_von`/`datum_bis` akzeptieren beliebige Strings) |
