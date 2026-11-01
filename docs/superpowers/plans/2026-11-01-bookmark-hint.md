# Lesezeichen-Hinweis: Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Beim ersten mobilen Besuch einen verständlichen Lesezeichen-Hinweis mit automatisch passender Browseranleitung anbieten.

**Architecture:** Eine zentrale clientseitige Komponente im öffentlichen Layout zeigt einen nicht blockierenden Hinweis. Eine kleine, separat testbare Browsererkennung wählt die Anleitung vor; bei Unsicherheit bleibt eine allgemeine Anleitung erreichbar. Der Hinweisstatus bleibt lokal, ohne Firebase, Tracking oder neue Abhängigkeiten.

**Tech Stack:** Next.js Static Export, React, TypeScript, CSS Modules, vorhandenes UI-Wörterbuch und Lucide/AppIcon, Vitest, Playwright.

Stand: 01.11.2026. Umsetzung durch Carsten freigegeben, mit „Schließen“ statt „Verstanden“. Technisch implementiert und geprüft; reale Geräte-/Publikumsprüfung und Veröffentlichung bleiben getrennte Schritte. Nach Planprüfung wurde auch der implementierte Code unabhängig geprüft und nach zwei korrigierten P2-Befunden freigegeben.

## Umsetzungsstand

- [x] Browsererkennung und Speicherlogik mit roten/grünen Unit-Tests umgesetzt.
- [x] Anleitungen in allen sechs Sprachen erstellt und getestet; „Schließen“ entsprechend übersetzt.
- [x] Hinweis, Hilfe, Sprachinitialisierung, Fehlerseiten und Dialogkoordination integriert.
- [x] Vollständige E2E-Suite (98 Tests) und anschließend alle zehn finalen Bookmark-Tests bestanden; zwei neue Regressionen zuvor rot reproduziert.
- [x] 391 Unit-Tests bestanden, neun unverändert übersprungen; TypeScript erfolgreich.
- [x] Beide Static Exports (`/files/app`, `/stahnsdorf`) im Browser gegen lokale Emulatoren geprüft, einschließlich neuer POI-/Sammlungs-Query-Routen.
- [x] Dokumentation aktualisiert und unabhängige Code-Nachprüfung abgeschlossen.
- [ ] Reale Handy-/Screenreader-Prüfung und Verständlichkeitstest mit einer nicht technischen Person.
- [ ] Push und Veröffentlichung nach gesonderter Freigabe.

Die nachfolgenden ursprünglichen Aufgabenschritte bleiben als Implementierungsanleitung erhalten; diese Statusliste dokumentiert den tatsächlichen Ausführungsstand.

## 1. Produktentscheidung und Grenzen

- Empfehlung: automatische Browser-/Plattformerkennung mit hilfreicher Voreinstellung. Keine verpflichtende Browserauswahl und keine technischen Begriffe im normalen Ablauf.
- Nicht empfohlen: reine manuelle Auswahl (überfordert unnötig) oder ausschließlich allgemeiner Hinweis (zu wenig Hilfe für durchschnittliche Besucher).
- Browser erkennen ist etwas anderes als Lesezeichen anlegen: Die Website kann eine passende Anleitung anzeigen, aber kein Lesezeichen im Browser selbst erzeugen und den Erfolg nicht auslesen.
- Kein Installationsdialog, keine PWA-Erweiterung und keine Vermischung mit „Zum Home-Bildschirm hinzufügen“.
- „Alle mobilen Browser“ bedeutet: Hinweis und allgemeine Hilfe funktionieren auch ohne identifizierbaren Browser. Eine exakte Menüfolge für jede Browser-/Betriebssystemversion ist nicht garantierbar.

## 2. Geplanter Ablauf

1. Nach clientseitigem Mount und vorhandener Sprachinitialisierung ermitteln: öffentliche Route, mobiles Gerät/Tablet, normaler Browsermodus, bisherige Bestätigung.
2. Beim ersten geeigneten Besuch unten oberhalb der Navigation den Hinweis anzeigen, auch beim Direkteinstieg auf POI- oder Sammlungsdetails. Keine Zeitverzögerung, kein automatisches Schließen und kein automatischer Fokuswechsel.
3. Text: **Für den nächsten Besuch merken** / „Speichern Sie diese Seite als Lesezeichen oder Favorit in Ihrem Browser.“ Aktionen: „So geht’s“ und „Schließen“. Die Hilfe bietet zusätzlich ein zugänglich beschriftetes Schließen-Symbol.
4. „So geht’s“ öffnet eine kurze, zugängliche Anleitung mit maximal drei Schritten für den erkannten Browser und die Plattform. Beispiel: „So geht’s in Chrome“. Eine unaufdringliche Aktion „Andere Anleitung“ erlaubt die Korrektur, ohne diese allen Besuchern aufzubürden.
5. Bei unklarer Erkennung keine falsche Sicherheit: allgemeine Anleitung „Öffnen Sie das Menü Ihres Browsers und wählen Sie Lesezeichen, Favoriten oder das Sternsymbol.“ Darunter optional „Anleitung auswählen“.
6. Bei erkennbaren eingebetteten App-Browsern: „Öffnen Sie die Seite zuerst in Ihrem Browser. Meist finden Sie diese Funktion im Menü der App.“ Keine Behauptung, die Website könne Safari/Chrome zuverlässig selbst öffnen.
7. „Schließen“ am Hinweis bestätigt den Hinweis, nicht die Erstellung eines Lesezeichens. Der Abschlussbutton in der Anleitung kann ebenfalls bestätigen. Escape/Schließen-Symbol nur der Anleitung bestätigt den Hintergrundhinweis nicht.
8. Auf der Infoseite bleibt „Seite als Lesezeichen speichern“ als Hilfeaufruf erreichbar, auch nach Bestätigung und auf Desktopgeräten.

## 3. Erkennung und Fallback

Reine Funktion `detectBookmarkBrowser(input)` in `src/lib/bookmark-browser.ts`, ohne DOM-Zugriffe beim Import. Eingabe: UA-String, optional niedrig-entropische UA-Client-Hints (`brands`, `platform`, `mobile`), `platform`, `maxTouchPoints`, Standalone-Anzeige. Ergebnis:

```ts
type BookmarkBrowser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'unknown';
type BookmarkPlatform = 'ios' | 'android' | 'other';
type BookmarkContext = {
  browser: BookmarkBrowser;
  platform: BookmarkPlatform;
  mobile: boolean;
  embedded: boolean;
  standalone: boolean;
  confidence: 'identified' | 'uncertain';
};
```

- Nur für die Anleitung verwenden, niemals für die Verfügbarkeit der App-Funktionen.
- Explizite Kennungen unterscheiden Browser trotz gemeinsamer Engines. Vor generischem Chrome/Safari zuerst eingebettete Browser, Samsung (`SamsungBrowser`), Edge (`EdgA`, `EdgiOS`, `Edg`), Opera (`OPR`, `OPiOS`), Firefox (`Firefox`, `FxiOS`) und Chrome iOS (`CriOS`) prüfen.
- Spezifische UA-Client-Hint-Marken verwenden, wenn vorhanden. `Chromium` allein und GREASE-/Platzhaltermarken sind kein Beleg für Chrome. Widersprechende Signale führen zu `uncertain` und allgemeiner Hilfe.
- Safari nur bei positiven Safari-/Version-Signalen und ohne Kennung eines anderen Browsers annehmen. Ausnahme: Safari-artige iPad-UA ohne unterscheidende Kennung bleibt `uncertain`, denn Firefox kann dort dieselbe UA senden. Auf dem iPad kann Safari deshalb ebenfalls die allgemeine Hilfe erhalten; die manuelle Korrektur bleibt erreichbar. WebKit alleine ist kein Safari-Beleg; unmarkierte WebViews lassen sich nicht sicher ausschließen.
- Android aus Plattform/UA, iPhone/iPad aus Kennungen erkennen. `MacIntel`/Macintosh mit mehreren Touchpunkten als iPad-Heuristik behandeln, nicht als sicheren Beleg für Safari. Bei Desktop-UA ohne eindeutigen Browser keine Safari-Anleitung erzwingen.
- Mobile Erkennung nicht nur an Fensterbreite oder `userAgentData.mobile` festmachen: Android-Tablets und iPad-Desktopansicht berücksichtigen. Nicht eindeutig mobile Geräte erhalten weiterhin Hilfe auf der Infoseite; kein vollumfängliches Fingerprinting zur Auflösung von Sonderfällen.
- Bekannte WebView-/App-Kennungen sind positive Hinweise; nicht alle eingebetteten Browser sind identifizierbar. Unbekannte Signale bekommen immer den allgemeinen Fallback.
- Bei `display-mode: standalone` oder iOS-Standalone keinen automatischen Hinweis; manuelle Hilfe bleibt möglich.
- Keine hohen Entropiewerte, keine Netzwerkabfrage, keine Weitergabe oder Speicherung der Browserkennung. Keine neue Parser-Bibliothek für diesen begrenzten Zweck.

## 4. Zustand, Routen und Bedienbarkeit

- Speicherkennung: `swk:<APP_BASE_PATH>:bookmark-hint:v1`. Bestehenden Build-/basePath-Zugriff wiederverwenden, keine fest verdrahteten `/stahnsdorf`- oder `/files/app`-Links.
- `localStorage` nur clientseitig und vollständig in `try/catch` lesen/schreiben. Fallback auf `sessionStorage`, danach Modulzustand für das laufende Dokument. Wenn beide Speicher gesperrt sind, lässt sich das Ausbleiben nach vollständigem Neuladen nicht garantieren; keine gegenteilige Zusage.
- Bestehenden `src/lib/LocaleContext.tsx` verbindlich mit absichern: dessen derzeit ungeschütztes Lesen/Schreiben darf das Mounten nicht abbrechen. Initialisierung wird auch bei Speicherfehlern abgeschlossen; Browser-/Fallbacksprache bleibt nutzbar. Initialisierungsstatus eng begrenzt bereitstellen, damit kein deutsches Zwischenbanner vor der gewählten Sprache erscheint.
- Erst bei expliziter Bestätigung speichern. Sprachwechsel und interne Navigation dürfen keinen zweiten Hinweis erzeugen. Strict-Mode-Effekte idempotent gestalten. Optionales `storage`-Event schließt den Hinweis auch in bereits geöffneten anderen Tabs.
- Auf `/admin` und allen Unterrouten nie automatisch anzeigen. `usePathname()` und vorhandene basePath-Konventionen verwenden. Keine Anzeige während Legacy-Redirects oder auf Fehler-/404-Seiten; deren Einbindung bei der Umsetzung ausdrücklich prüfen.
- Höchstens eine aktive Hilfe/Lightbox gleichzeitig. Den bestehenden Lightbox-Zustand und Tastaturhandler in `src/app/poi/[id]/POIDetailContent.tsx` verbindlich einbinden: während fremder Dialoge ist das Banner verborgen oder `inert`, und eine zweite Hilfe öffnet nicht parallel. Ein kleiner gemeinsamer Dialogstatus ist dafür vorgesehen; keine allgemeine Modal-Framework-Neuentwicklung.
- Bei jedem Routenwechsel die Hilfe schließen; beim Wechsel zu Admin, Fehlerseite oder Redirect auch den Hinweis verbergen. Fokus nur auf noch vorhandene, sichtbare Auslöser zurückgeben, sonst der Zielseite ihre normale Fokusführung überlassen.
- Browser-GPS-Abfragen weder auslösen noch unterdrücken. Keine Browserberechtigungs-API gibt zuverlässig Auskunft, ob gerade ein nativer Dialog sichtbar ist; deshalb bleibt der Hinweis nicht modal und ohne Autofokus.
- Responsive, mindestens 44 Pixel große Aktionsflächen, Safe-Area berücksichtigen. Banner im vorhandenen Flex-Layout mit reservierter Höhe oberhalb der Navigation platzieren, nicht als die Karte überdeckende Fläche. `src/styles/globals.css` und die Kartengrößenbeobachtung gezielt anpassen; Leaflet muss nach Größenänderungen `invalidateSize()` erhalten. Navigation, Kartenbedienung und Attribution bleiben erreichbar. Bei großer Schrift darf Hilfe scrollen; kein horizontaler Überlauf.
- Dialog mit zugänglichem Namen, Fokusführung, Escape, Rückkehr zum auslösenden Button und unterbundenem Hintergrundfokus. Bestehende zugängliche Dialoglösung wiederverwenden; sonst natives `<dialog>` mit geprüftem `showModal`-Fallback. Keine neue Dialogbibliothek.

## 5. Dateien und Implementierungsschritte

### Aufgabe 1: Browserklassifikation durch Tests absichern

**Neu:** `src/lib/bookmark-browser.ts`, `tests/bookmark-browser.test.ts`.

- [ ] Zuerst tabellarische Vitest-Fixtures mit Herkunftskommentar schreiben: Safari iPhone, Safari iPad-Desktopansicht, Firefox iPad ohne `FxiOS` (identische UA, beide `uncertain`), Chrome/Firefox/Edge auf iOS und Android, Samsung Internet, Opera Android, Android-Tablet, Desktop, unbekannter Browser, App-WebView, widersprüchliche Signale, fehlende Client Hints, generische Chromium-Marke, Standalone.
- [ ] `npx vitest run tests/bookmark-browser.test.ts` muss zunächst wegen fehlender Implementierung scheitern.
- [ ] Funktion mit obigem Vertrag implementieren. Reihenfolge anhand der Tests prüfen, keine Browserabfrage beim Server-/Build-Import.
- [ ] Erneut ausführen; alle Fixtures müssen bestehen. Besonders Edge/Samsung/Opera dürfen nicht als Chrome, iOS-Chrome/Firefox nicht als Safari klassifiziert werden.

### Aufgabe 2: Bestätigung ohne Backend speichern

**Neu:** `src/lib/bookmark-hint-state.ts`, `tests/bookmark-hint-state.test.ts`.

- [ ] Speicheradapter mit injizierbaren `Storage`-ähnlichen Objekten und Rückfallzustand testen: frisch, bestätigt, persistenter Speicher gesperrt, Sitzungsspeicher gesperrt, abweichender App-Pfad, kein Browser beim Import.
- [ ] `npx vitest run tests/bookmark-hint-state.test.ts` zunächst rot ausführen.
- [ ] Kleine `hasDismissedBookmarkHint`-/`dismissBookmarkHint`-Funktionen mit obigem Schlüssel, Fallback-Reihenfolge und ohne Ablaufdatum implementieren.
- [ ] Test erneut grün ausführen; keine Cookies/Firebase-Daten und keine Erfolgsmeldung für ein angeblich angelegtes Lesezeichen.

### Aufgabe 3: Verständliche Texte und browserbezogene Hilfe

**Ändern:** `src/lib/ui-dictionary.ts`; bei Bedarf `src/components/AppIcon.tsx` für vorhandene Lucide-Symbole Bookmark/Star/Share.

Umgesetzt als separates, typisiertes `src/lib/bookmark-copy.ts` statt Vergrößerung des allgemeinen UI-Wörterbuchs. Vorhandenes AppIcon-Schließen-Symbol wiederverwendet. Keine neue Laufzeitbibliothek; lediglich die für das Body-Portal fehlenden React-DOM-Typdeklarationen als Entwicklungsabhängigkeit ergänzt.

- [ ] Herstelleranleitungen für Safari iOS/iPadOS, Chrome iOS/Android, Firefox iOS/Android, Edge iOS/Android, Samsung Android und Opera auf verfügbaren Plattformen lesen. Nicht die Android-Schritte auf iOS übertragen.
- [ ] Pro tatsächlich unterstützter Kombination maximal drei kurze Schritte schreiben. Wegen unterschiedlicher Layouts keine starren Aussagen „oben rechts“, außer ausdrücklich versionsunabhängig belegt; Menü-/Teilen-/Sternsymbol und Aktionsnamen benennen. Wenn kein belegter genauer Ablauf verfügbar ist, allgemeinen Fallback liefern.
- [ ] Alle Texte in de/en/fr/pl/ru/sv selbst erstellen, im vorhandenen Dictionary typisiert ablegen. Kein Browsermenü mit „Home-Bildschirm“, Leseliste oder Offline-Download verwechseln.
- [ ] Test für vollständige Sprachschlüssel und definierte Hilfe für jede unterstützte Browser-/Plattformkombination bzw. deren expliziten Fallback ergänzen.

### Aufgabe 4: Hinweis und Hilfe integrieren

**Neu:** `src/components/BookmarkHint.tsx`, `src/components/BookmarkHelp.tsx`, `src/components/BookmarkHint.module.css`.
**Ändern:** `src/app/layout.tsx`, `src/app/info/page.tsx`, `src/lib/LocaleContext.tsx`, `src/styles/globals.css`, `src/components/ClientMap.tsx` (Größenbeobachtung), `src/app/poi/[id]/POIDetailContent.tsx` (Dialogkoordination) und ggf. deren CSS Module.
**Neu für Dialogkoordination:** `src/lib/ActiveDialogContext.tsx`, eng begrenzt auf aktive Bookmark-Hilfe und vorhandene Lightbox.

- [ ] `BookmarkHelp` als wiederverwendbaren Dialog implementieren; zusätzlich einen kleinen Hilfeaufruf mit lokalem Öffnungszustand für die Infoseite exportieren. Kein neuer globaler Provider erforderlich.
- [ ] Zentralen `BookmarkHint` innerhalb `LocaleProvider` neben bestehender Navigation integrieren. SSR rendert zunächst keinen Hinweis. Browser- und Speicherzugriff erst nach Mount; keine Einblendung vor der initialen Sprache.
- [ ] Sprache aus vorhandenem Context beziehen, dessen Speicherzugriffe absichern und Initialisierungsstatus lesbar machen; dazu Integrationstests ergänzen. Keine unabhängige zweite Spracherkennung.
- [ ] Banner, erkannte Anleitung und manuelle Korrektur nach Abschnitten 2 bis 4 verbinden. Im normalen Ablauf weder Browsername abfragen noch Auswahlmenü zeigen.
- [ ] Gemeinsamen Dialogstatus für Bookmark-Hilfe und vorhandene Lightbox ergänzen. Banner während fremder Dialoge deaktivieren/verbergen; Hilfe bei Routenwechsel schließen, sichere Fokusrückgabe prüfen. Reservierten Bannerplatz und Leaflet-Größenanpassung umsetzen, statt nur hohe z-index-Werte zu vergeben.
- [ ] Zuerst E2E-Tests aus Aufgabe 5 schreiben und rot ausführen, dann die benötigten UI-Teile implementieren. Kein POI-/Firestore-Schema ändern.

### Aufgabe 5: Verhalten, Barrierefreiheit und mobile Browser prüfen

**Neu:** `tests/e2e/bookmark-hint.spec.ts`.

- [ ] Pro Fixture UA, `navigator.platform`, `maxTouchPoints` und verfügbare/fehlende UA-Client-Hints konsistent setzen. Widersprüchliche Eingaben separat testen. Rendering-Engine und UA-Fixtures getrennt benennen; Chromium mit iPhone-UA ist kein Safari-Test.
- [ ] Erstbesuch auf Karte, POI- und Sammlungsdetail zeigt Hinweis; Desktop, Admin, Standalone, 404 und laufende Legacy-Weiterleitung zeigen keinen automatischen Hinweis.
- [ ] Bestätigen, Neuladen und Routen-/Sprachwechsel prüfen: kein erneutes Banner. Speicher bereits vor der Sprachinitialisierung sperren und ohne Absturz starten; abweichende gespeicherte Sprache ohne Hydrationfehler und ohne deutsches Zwischenbanner prüfen. Dokumentierte Rückfallgrenzen testen.
- [ ] Safari- und Chrome-Erkennung zeigen ohne Auswahl die richtige Hilfe; unbekanntes Gerät zeigt allgemeine Hilfe; manuelle Korrektur funktioniert.
- [ ] Anleitungsschließen/Escape und Bestätigen getrennt prüfen. Fokus kehrt auf vorhandene Auslöser zurück, Hintergrund ist während Dialog nicht bedienbar. Hilfe öffnen und anschließend Route wechseln, einschließlich Admin-/404-Ziel: kein zurückbleibender Dialog oder Fokus auf entfernte Elemente. Lightbox und Hilfe dürfen nicht gleichzeitig aktiv werden.
- [ ] Mindestens 320 × 568 und 568 × 320 CSS-Pixel, iPad-Größe und 200 Prozent Textgröße prüfen; Screenshots mit sichtbarer Navigation, Kartenbedienelementen und Attribution erstellen. Reservierter Bannerplatz darf keine dieser Funktionen verdecken; nach Schließen füllt die Karte den zurückgewonnenen Platz.
- [ ] Im Emulator ausführen: `npx firebase emulators:exec "npx playwright test tests/e2e/bookmark-hint.spec.ts"`. Keine produktiven Daten anfassen.
- [ ] Praxisvalidierung getrennt von technischer Fertigstellung protokollieren: empfohlenes Minimum sind reales iPhone/Safari und Android/Chrome sowie ein kurzer Verständlichkeitstest mit einer nicht technisch versierten Person. Dieses Minimum ist eine Abnahmeempfehlung zur Bestätigung durch Carsten, kein neu eingeführter automatischer Deploy-Blocker. Ohne diese Nachweise lautet der Status ausdrücklich „technisch geprüft, Praxisvalidierung offen“.
- [ ] Weitere Geräteprüfungen: iPhone Chrome, Android Firefox, Samsung und Edge sowie iPad-Desktopansicht. Nicht verfügbare Kombinationen als ungeprüft ausweisen. WebKit-/UA-Emulation ersetzt keine Sichtprüfung der nativen Menüs.
- [ ] Auf realen Geräten Anleitung bis zum erstellten und wieder aufrufbaren Lesezeichen nachvollziehen. Automatische Fokus-/Semantiktests und tatsächliche menschliche VoiceOver-/TalkBack-Prüfung getrennt ausweisen; letzteres nicht aus Playwright-Tests ableiten.

### Aufgabe 6: Dokumentation und Auslieferung

**Ändern:** `AGENTS.md`, `README.md`. Schema-Dokumentation bleibt unverändert, sofern kein Datenmodell geändert wird.

- [ ] Funktionsumfang, Erstbesuchsdefinition, Speichergrenzen, manuellen Hilfezugang und Testmatrix dokumentieren. Herstellerquellen für die Browseranleitungen im Plan/Review ergänzen, nicht als lange technische Texte im Banner.
- [ ] `npm test`, `npm run typecheck`, `npm run build`, `npm run verify:export` ausführen. Erwartung: Tests erfolgreich, keine Typfehler, Static Export mit funktionierenden Query-Routen.
- [ ] Für `/stahnsdorf` und `APP_BASE_PATH=/files/app` jeweils den fertigen Export auf einem lokalen statischen Server mit echtem Unterpfad bereitstellen. In einem separaten Playwright-Production-Testkontext ohne Dev-webServer Hinweis, Bestätigung/Neuladen, POI-/Sammlungs-Query-Routen und Admin-/404-Ausschluss im Browser prüfen. Zwei erfolgreiche Builds allein genügen nicht. Unterschiedliche Deployments/Origins haben unabhängig gespeicherte Bestätigungen.
- [ ] Nur neue Feature-Dateien und die tatsächlich angepassten Bestandsstellen zum Commit vormerken. Bereits vorhandene Bildimport-/Datenänderungen und fremde unversionierte Dateien nicht versehentlich einschließen.
- [ ] Nach Implementierungsfreigabe gezielt committen. Push und Veröffentlichung erst nach gesonderter Freigabe; dieser Plan löst keinen Deploy aus.

## 6. Abnahme

- Durchschnittliche Besucher sehen ohne Browserauswahl eine passende, kurze Anleitung, soweit der Browser erkennbar ist.
- Unbekannte Browser erhalten trotzdem einen nutzbaren Hinweis; weder App-Nutzung noch Navigation werden gesperrt.
- Bestätigte Hinweise erscheinen bei normalen späteren Aufrufen desselben Browsers und Deployments nicht erneut.
- Kartenfunktionen, GPS, Bild-Lightbox, Admin und sechs Sprachen bleiben funktionsfähig.
- Belegte Hersteller-Schritte und tatsächlich auf Geräten geprüfte Kombinationen sind von ungetesteten Kombinationen unterscheidbar.

## 7. Quellen und fachliche Einordnung

- [Microsoft: Detecting Microsoft Edge from your website](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/user-agent-guidance): nennt Browseranleitungen ausdrücklich als geeigneten Einsatzfall und empfiehlt verfügbare Client Hints; Edge Android/iOS besitzt eigene Kennungen.
- [Chromium: User Agent in Chrome for iOS](https://chromium.googlesource.com/chromium/src/+/main/docs/ios/user_agent.md): `CriOS` unterscheidet Chrome von Safari, auch bei angeforderter Desktopansicht.
- [MDN: Browser detection using the user agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Browser_detection_using_the_user_agent): Identifikation ist nicht garantiert; gemeinsame Kennungen, Maskierung und Sonderfälle berücksichtigen.
- [MDN: Firefox user agent string reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent/Firefox): Firefox auf dem iPad kann dieselbe UA wie Safari verwenden; deshalb expliziter Unsicherheitsfall statt erzwungener Safari-Erkennung.
- [MDN: bookmarks API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks): API für Erweiterungen mit Berechtigung, keine allgemeine Webseiten-API.

Schlussfolgerung: Automatisch erkennen ist für diesen risikoarmen Hinweis sinnvoll. „Nicht in jedem Fall sicher erkennbar“ rechtfertigt keine obligatorische Browserauswahl für alle Besucher.

## 8. Ergebnis der unabhängigen Prüfung

Separater Reviewer „Bernoulli“, Prüfdatum 01.11.2026, ohne Übernahme des bisherigen Chatverlaufs und ausschließlich lesend. Prüfauftrag: technische Machbarkeit und Verständlichkeit für ein durchschnittliches, nicht technisches Publikum.

Die Erstprüfung führte zu sechs konkreten Korrekturen:

1. Safari-artige iPad-Kennungen einschließlich Firefox ohne `FxiOS` ausdrücklich als mehrdeutig behandeln.
2. Auch bestehende Speicherzugriffe und Initialisierung im Sprachkontext absichern.
3. Dialogkoordination, Routenwechsel und sichere Fokusrückgabe verbindlich festlegen.
4. Platz im Layout reservieren und Leaflet-Größenänderungen berücksichtigen.
5. Konsistente Browser-Testeingaben und Laufzeitprüfung beider statischen Production-Unterpfade vorsehen.
6. Technische Fertigstellung von menschlicher Geräte-/Verständlichkeitsprüfung trennen, mit klar benanntem empfohlenem Mindestumfang.

Zweitprüfung: **Freigabe des überarbeiteten Implementierungsplans; keine verbleibenden relevanten Befunde.** Die automatische Vorauswahl mit freiwilliger Korrektur und allgemeinem Fallback wurde bestätigt. Der Reviewer hat keine Implementierung, Testläufe oder menschlichen Geräteprüfungen durchgeführt.

## 9. Implementierungsprüfung

Der unabhängige Reviewer fand zunächst eine belegte Dialogsperre nach tabübergreifender Bestätigung sowie eine unvollständige Hintergrundsperre ohne natives `showModal()`. Beide wurden durch gezielte E2E-Tests rot reproduziert, korrigiert und grün nachgeprüft. Die zweite Quelltextprüfung erteilte die Freigabe ohne weitere relevante Befunde.

Die vorhandene `ResizeObserver`-/`invalidateSize()`-Logik in `ClientMap` genügt bereits für den reservierten Bannerplatz; zusätzliche Kartenlogik war nicht nötig. Die Sprachinitialisierung ist jetzt auch bei gesperrtem Speicher funktionsfähig. Tabellen-, POI-Inhalts- und Bildimportänderungen gehörten nicht zum Feature-Scope.

Prüfungen: vollständige bisherige E2E-Suite inklusive der ersten acht Bookmark-Tests: 98 erfolgreich; finale Bookmark-Suite inklusive beider Regressionen: zehn erfolgreich. Insgesamt 100 unterschiedliche E2E-Fälle. Statische Browserprüfungen beider Unterpfade erfolgten mit Emulator-Builds und gesperrten Live-Firebase-Endpunkten; neue Query-IDs wurden ausschließlich im Emulator angelegt. Der abschließende Standardexport wurde wieder ohne Emulatorbindung erstellt und mit `npm run verify:export` geprüft.

Die Windows-Java-Laufzeit benötigte für den Emulator einen projektlokalen Unix-Socket-Tempordner (`JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/Code/stahnsdorf/stahnsdorf/tmp/java-sockets`); keine globale Java- oder Systemeinstellung wurde geändert. Screenshots und lokale Export-Prüfskripte liegen unter `outputs/bookmark-hint/` (nicht versioniert).

Status: technisch geprüft; Praxisvalidierung offen. Native Browsermenüs, VoiceOver/TalkBack und ein tatsächlicher Nutzer-Verständlichkeitstest wurden nicht als durchgeführt ausgegeben.
