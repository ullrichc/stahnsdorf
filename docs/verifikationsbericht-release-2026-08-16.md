# Nachverifikation vor Release

**Stand:** 16.08.2026 · Bezug: [Prüfbericht](pruefbericht-release-2026-08-16.md) — alle übrigen Befunde daraus sind verifiziert behoben.

**Ergebnis nach Umsetzung:** Sämtliche in diesem Bericht aufgeführten Befunde sind behoben und durch Unit-, Browser- oder Build-Prüfungen abgesichert.

## Vor Release beheben

### 1. Behoben: Open Redirect nach Pfadnormalisierung

**`src/lib/redirect.ts:30`** — Ein präparierter Link auf die App kann Besucher unbemerkt auf eine beliebige fremde Website weiterleiten. Die Schutzprüfung gegen externe Ziele (`//…`) untersucht nur die rohe Eingabe; anschließend löst die URL-Normalisierung `..`-Segmente auf, wodurch doch wieder ein externes Ziel entstehen kann. Nachgewiesen:

```
normalizeInternalRedirect('/a/..//evil.com')  →  '//evil.com'
```

Der Link `/?redirect=%2Fa%2F..%2F%2Fevil.com` führt über `src/app/page.tsx:13-16` zu `router.replace('//evil.com')` und landet auf `https://evil.com`. Missbrauchbar für Phishing: Der Link sieht aus wie ein App-Link (z. B. auf einem Aushang oder in einer Mail), leitet aber auf eine fremde Seite.

*Vorschlag:* Nach dem Parsen zusätzlich `if (url.pathname.startsWith('//')) return null` sowie Testfall `'/a/..//evil.com'` in `redirect.test.ts`.

**Umgesetzt:** Das normalisierte `pathname` wird erneut geprüft. Der dokumentierte Angriffspfad ist als Regressionstest abgedeckt.

### 2. Behoben: Sammlung mit bereits vergebenem Namen

**`src/app/admin/collections/page.tsx:118-139`** — Legt ein Editor eine Sammlung an, deren Name eine bereits existierende ID ergibt, wird das vorhandene Dokument per `setDoc` überschrieben-versucht; die Firestore-Rules lehnen das ab. Der Editor sieht nur „Missing or insufficient permissions" und kann daraus weder den Grund erkennen noch die Sammlung anlegen. Für POIs ist dasselbe Problem bereits gelöst, für Sammlungen nicht.

*Vorschlag:* Das POI-Muster übernehmen — `runTransaction` mit Kandidaten-Prüfung und Suffix (`-2`, `-3`, …) wie in `POIForm.tsx:258-270` / `slug.ts:22-25`.

**Umgesetzt:** Neue Sammlungen reservieren ihre ID transaktional und verwenden bei Kollisionen deterministische Suffixe. Ein E2E-Test prüft, dass das bestehende Dokument unverändert bleibt.

## Kleinigkeiten

- **Behoben: `src/app/not-found.tsx`** — Meldung und Rücklink verwenden die zentrale Spracheinstellung in allen sechs Sprachen.
- **Behoben: `src/lib/admin-data.ts`** — Die Batch-Grenzmeldung spricht neutral vom „Vorgang" und passt damit zu Import und Löschung.
- **Behoben: `src/components/MapView.tsx`** — Ein Ortungsfehler beendet Watcher und Trackingstatus; erneutes Tippen startet sofort einen neuen Versuch. Der Browserablauf ist als E2E-Test abgedeckt.
- **Behoben: Legacy-`[id]`-Seiten** — Während des Client-Redirects wird eine lokalisierte Statusmeldung statt einer leeren Seite angezeigt.
