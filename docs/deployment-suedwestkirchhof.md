# Deployment auf suedwestkirchhof.de

Diese Anleitung beschreibt die Bereitstellung der Karten-App unter

`https://www.suedwestkirchhof.de/stahnsdorf/`

sowie die spätere automatische Veröffentlichung mit GitHub Actions.

## Zielarchitektur

Die App ist ein statischer Next.js-Export. Der Webserver benötigt daher weder Node.js noch PHP noch eine eigene Datenbank. Firestore, Firebase Authentication und Firebase Storage bleiben unverändert die Backend-Dienste.

Der Produktions-Build verwendet bereits den `basePath` `/stahnsdorf`. Der Inhalt des Build-Ordners `out/` muss deshalb direkt in das Verzeichnis ausgeliefert werden, das unter `/stahnsdorf/` erreichbar ist. Der Ordner `out` selbst darf nicht als zusätzliche Verzeichnisebene kopiert werden.

Die bisherige GitHub-Pages-Version sollte zunächst als Test- und Rückfallversion erhalten bleiben.

## Aufgaben des Vereins

1. Die Ziel-URL `https://www.suedwestkirchhof.de/stahnsdorf/` bestätigen.
2. Auf der bestehenden Website einen Menüpunkt wie „Digitale Karte“ oder „Friedhofsplan“ anlegen.
3. Die Datenschutzerklärung hinsichtlich Firebase, Google-Anmeldung und OpenStreetMap-Kartenkacheln prüfen und gegebenenfalls ergänzen.
4. In Firebase unter **Authentication → Settings → Authorized domains** eintragen:
   - `www.suedwestkirchhof.de`
   - `suedwestkirchhof.de`, falls die Domain ohne `www` ebenfalls verwendet wird
5. Den bestehenden Firebase-`authDomain` zunächst unverändert lassen. Die App verwendet `signInWithPopup()`.

Die GPS-Position der Besucher wird nach aktuellem Code nur im Browser verarbeitet und nicht als Besucherstandort gespeichert.

## Produktions-Build erstellen

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run verify:export
```

Der fertige statische Export liegt anschließend im Ordner `out/`.

An den Hoster wird ausschließlich der Inhalt dieses Ordners übergeben. Nicht übergeben werden:

- `.env.local`
- das Git-Verzeichnis
- Firebase-Admin-Zugangsdaten
- hochauflösende Originalfotos

Die im Browser verwendete Firebase-Webkonfiguration ist keine geheime Server-Zugangsinformation. Schreibrechte werden durch Firebase Authentication, Editor-Whitelist und Firebase Security Rules geschützt.

## Manuelle Installation durch den Hoster

Im Document Root der bestehenden Website wird ein Unterordner `stahnsdorf` angelegt:

```text
<document-root>/
├── index.html
├── kirchhof.html
├── ...
└── stahnsdorf/
    ├── index.html
    ├── 404.html
    ├── poi.html
    ├── sammlung.html
    ├── admin.html
    ├── _next/
    ├── media/
    └── ...
```

Der vollständige Inhalt von `out/` wird nach `<document-root>/stahnsdorf/` kopiert.

### Apache

Im Verzeichnis `stahnsdorf` kann folgende `.htaccess` verwendet werden:

```apache
DirectoryIndex index.html
RewriteEngine On
RewriteBase /stahnsdorf/

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.+?)/?$ $1.html [L]

ErrorDocument 404 /stahnsdorf/404.html
```

Zusätzlich muss `/stahnsdorf` dauerhaft auf `/stahnsdorf/` umgeleitet werden. Falls `.htaccess` deaktiviert ist, werden dieselben Regeln in der Virtual-Host-Konfiguration hinterlegt.

### nginx

```nginx
location = /stahnsdorf {
    return 301 /stahnsdorf/;
}

location /stahnsdorf/ {
    try_files $uri $uri.html $uri/ =404;
    error_page 404 =404 /stahnsdorf/404.html;
}
```

Die Auflösung von URLs ohne `.html` ist unter anderem für folgende Routen erforderlich:

- `/stahnsdorf/poi?id=<poi-id>`
- `/stahnsdorf/sammlung?id=<sammlungs-id>`
- `/stahnsdorf/admin/poi/edit?id=<poi-id>`

## Anforderungen an den Webserver

- HTTPS muss aktiv sein, insbesondere für die Browser-Geolokalisierung.
- `_next/static/` darf lange mit `immutable` gecacht werden.
- HTML-, TXT- und `404.html`-Dateien sollen nur kurz oder mit `no-cache` gecacht werden.
- Gängige MIME-Typen für JavaScript, CSS, SVG, WOFF2, JPEG, PNG und Audio müssen eingerichtet sein.
- Der Webserver muss Query-Strings unverändert an die ausgelieferte HTML-Datei weiterreichen.

Falls eine Content-Security-Policy aktiv ist, müssen die tatsächlich genutzten Verbindungen mindestens für folgende Ziele geprüft und freigegeben werden:

- `https://*.tile.openstreetmap.org`
- `https://firestore.googleapis.com`
- `https://firebasestorage.googleapis.com`
- `https://identitytoolkit.googleapis.com`
- `https://securetoken.googleapis.com`
- `https://*.firebaseapp.com`
- `https://accounts.google.com`

Das Redaktionswerkzeug ist unter `https://www.suedwestkirchhof.de/stahnsdorf/admin` erreichbar. Die statische HTML-Seite ist öffentlich abrufbar; Anmeldung und Schreibrechte werden durch Google-Login, Editor-Whitelist und Firebase Rules geschützt.

## Abnahme der manuellen Installation

Nach der Installation werden mindestens folgende Punkte geprüft:

1. Karte und OpenStreetMap-Kacheln erscheinen.
2. POI-Marker, Detailansichten und Bilder werden geladen.
3. Ein direkter POI-Link funktioniert auch nach Neuladen der Seite.
4. Sammlungen, Sprachwechsel und Audio funktionieren.
5. GPS-Abfrage funktioniert auf Android und iPhone.
6. Browser-Zoom bleibt möglich.
7. Ein freigeschalteter Editor kann sich unter `/stahnsdorf/admin` anmelden.
8. Die Browserkonsole zeigt keine 404-, CSP-, CORS- oder Firebase-Fehler.
9. Unbekannte und alte Routen werden von `404.html` korrekt behandelt.
10. Die bestehende Website außerhalb von `/stahnsdorf/` bleibt unverändert.

## Automatisches Deployment mit GitHub Actions

Nach der ersten manuellen Installation kann GitHub Actions den statischen Export automatisch auf den Webserver übertragen:

`Push auf main → Tests → Build → Freigabe → Upload → neue Version online`

Der bestehende Workflow wartet bereits auf die erfolgreiche Test-Suite. Er muss nur um ein allgemeines Build-Artefakt und einen Webserver-Deployment-Job ergänzt werden.

### Einmalige Einrichtung durch den Hoster

Der Hoster stellt bereit:

- SSH/SFTP-Zugang, vorzugsweise ausschließlich mit SSH-Schlüssel
- einen eigenen Benutzer, beispielsweise `stahnsdorf-deploy`
- Schreibrechte ausschließlich für die App-Verzeichnisse
- SSH-Hostname und Port
- den exakten absoluten Zielpfad
- den verifizierten SSH-Hostschlüssel für `known_hosts`
- möglichst `rsync` auf dem Server

Der öffentliche SSH-Schlüssel wird beim Hoster hinterlegt. Der private Schlüssel wird ausschließlich als geschütztes GitHub-Secret gespeichert. Es soll kein persönlicher Serverzugang verwendet werden.

Empfohlen wird eine Release-Struktur mit atomarem Umschalten:

```text
releases/
├── <commit-1>/
├── <commit-2>/
└── <commit-3>/

stahnsdorf -> releases/<aktuelle-version>
```

So kann erst vollständig hochgeladen und danach auf die neue Version umgeschaltet werden. Ein Rollback besteht lediglich darin, den Link wieder auf die vorherige Version zu setzen.

Falls der Hoster keine Releases und Symlinks unterstützt, kann direkt nach `stahnsdorf/` synchronisiert werden. Das ist einfacher, bietet aber ein schwächeres Rollback und kann während des Uploads kurzzeitig einen gemischten Dateistand ausliefern.

### GitHub Environment

Im Repository unter **Settings → Environments** wird ein Environment `production-website` angelegt:

- Deployment-URL: `https://www.suedwestkirchhof.de/stahnsdorf/`
- nur Branch `main` darf deployen
- optional: erforderliche manuelle Freigabe durch einen Verantwortlichen
- optional: Selbstfreigabe des Auslösers verhindern

GitHub Environments protokollieren Deployments und geben geschützte Secrets erst nach den konfigurierten Freigaben an den Job weiter.

### GitHub Secrets und Variablen

| Name | Art | Inhalt |
|---|---|---|
| `DEPLOY_SSH_KEY` | Environment-Secret | privater SSH-Schlüssel |
| `DEPLOY_KNOWN_HOSTS` | Environment-Secret | vom Hoster bestätigter Hostschlüssel |
| `DEPLOY_HOST` | Environment-Variable | Servername |
| `DEPLOY_PORT` | Environment-Variable | meistens `22` |
| `DEPLOY_USER` | Environment-Variable | z. B. `stahnsdorf-deploy` |
| `DEPLOY_PATH` | Environment-Variable | absoluter Zielordner auf dem Server |

Der Hostschlüssel muss vom Hoster über einen unabhängigen, vertrauenswürdigen Weg bestätigt werden. Im Workflow darf `StrictHostKeyChecking` nicht deaktiviert werden.

### Build-Artefakt hochladen

Der Build-Job in `.github/workflows/deploy.yml` erhält nach `npm run build` zusätzlich:

```yaml
- name: Upload static export
  uses: actions/upload-artifact@v4
  with:
    name: website-export
    path: out
    retention-days: 14
```

Das vorhandene spezielle GitHub-Pages-Artefakt kann parallel weitergeführt werden.

### Beispiel für den Deployment-Job

```yaml
deploy-webserver:
  needs: build
  runs-on: ubuntu-latest
  environment:
    name: production-website
    url: https://www.suedwestkirchhof.de/stahnsdorf/
  concurrency: production-website

  steps:
    - uses: actions/download-artifact@v4
      with:
        name: website-export
        path: out

    - name: SSH konfigurieren
      env:
        SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
        KNOWN_HOSTS: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
      run: |
        install -m 700 -d ~/.ssh
        printf '%s\n' "$SSH_KEY" > ~/.ssh/id_ed25519
        chmod 600 ~/.ssh/id_ed25519
        printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts

    - name: Webseite übertragen
      env:
        HOST: ${{ vars.DEPLOY_HOST }}
        PORT: ${{ vars.DEPLOY_PORT }}
        USER: ${{ vars.DEPLOY_USER }}
        TARGET: ${{ vars.DEPLOY_PATH }}
      run: |
        rsync -az --delete --delay-updates \
          -e "ssh -p $PORT" \
          out/ "$USER@$HOST:$TARGET/"
```

`--delete` darf erst aktiviert werden, wenn der Hoster den Zielpfad bestätigt hat und der Deployment-Benutzer ausschließlich dort schreiben kann. Der erste Testlauf soll ohne `--delete` erfolgen.

Für ein atomares Release-Deployment wird statt des direkten Zielordners zunächst in einen Ordner mit der Commit-ID hochgeladen. Das abschließende Umschalten sollte durch ein vom Hoster kontrolliertes Skript erfolgen, das Commit-ID und Pfade validiert.

## Inbetriebnahme des automatischen Deployments

1. Hoster richtet Verzeichnis, Rewrite-Regeln und eingeschränkten SSH-Zugang ein.
2. Öffentlicher SSH-Schlüssel wird beim Hoster hinterlegt.
3. Secrets und Variablen werden direkt in GitHub eingetragen und nicht per E-Mail oder Chat weitergegeben.
4. Deployment zunächst manuell über GitHub starten.
5. Zielverzeichnis und veröffentlichte App prüfen.
6. Einen Rollback auf die vorherige Version testen.
7. Erst danach automatische Deployments nach jedem erfolgreichen Push auf `main` freischalten.

## Anfrage an den Hoster

Folgender Text kann an den Hoster geschickt werden:

> Unterstützt der Server SSH/SFTP und rsync? Bitte nennen Sie Hostname, Port, Benutzernamen und den exakten absoluten Zielpfad für `https://www.suedwestkirchhof.de/stahnsdorf/`. Bitte richten Sie einen nur auf die App-Verzeichnisse beschränkten Deploy-Benutzer ein und übermitteln Sie den SSH-Hostschlüssel über einen unabhängigen, vertrauenswürdigen Weg. Können Releases in getrennte Ordner hochgeladen und anschließend per Symlink atomar aktiviert werden?

## Weiterführende Dokumentation

- [Next.js: Static Exports](https://nextjs.org/docs/app/guides/static-exports)
- [Firebase: Google-Anmeldung](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase: Best Practices für Browser-Anmeldung](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [GitHub: Deployments und Environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
- [GitHub: Secrets](https://docs.github.com/en/actions/concepts/security/secrets)
- [GitHub: Deployments freigeben](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments)
