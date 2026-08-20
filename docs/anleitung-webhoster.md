Die statische Karten-App des Fördervereins Südwestkirchhof Stahnsdorf e.V. sollte unter folgender Adresse bereitgestellt werden:

`https://www.suedwestkirchhof.de/files/app/`

## Technische Kurzfassung

- Die App ist ein statischer Next.js-Export.
- Der Webserver benötigt weder Node.js noch PHP noch eine eigene Datenbank.
- Ausgeliefert werden ausschließlich HTML-, JavaScript-, CSS-, Schrift-, Bild- und GeoJSON-Dateien aus dem Build-Ordner `out/`.
- Firebase Firestore, Authentication und Storage bleiben die externen Backend-Dienste.
- Die gelieferten Dateien sind bereits für den Basispfad `/files/app` gebaut.
- HTTPS ist zwingend erforderlich, unter anderem für die Standortfunktion des Browsers.

## Einmalige Einrichtung des Webservers

1. In der Contao-Dateiverwaltung das öffentlich erreichbare Verzeichnis `files/app` verwenden.
2. Den **Inhalt** des gelieferten Ordners `out/` direkt in dieses Verzeichnis kopieren. Der Ordner `out` selbst darf keine zusätzliche Verzeichnisebene bilden.
3. `/files/app` dauerhaft auf `/files/app/` umleiten.
4. Routen ohne Dateiendung auf die entsprechende `.html`-Datei auflösen.
5. Für nicht gefundene Dateien `/files/app/404.html` ausliefern und dabei den HTTP-Status 404 beibehalten.
6. Query-Strings unverändert weiterreichen, beispielsweise bei `/files/app/poi?id=...`.

Die Zielstruktur sieht auszugsweise so aus:

```text
<document-root>/
├── ... bestehende Website ...
└── files/
    └── app/
        ├── index.html
        ├── 404.html
        ├── icon.svg
        ├── poi.html
        ├── sammlung.html
        ├── admin.html
        ├── _next/
        ├── media/
        └── map-overlay.geojson
```

## Apache

Im Verzeichnis `files/app` kann folgende `.htaccess` verwendet werden:

```apache
DirectoryIndex index.html
RewriteEngine On
RewriteBase /files/app/

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.+?)/?$ $1.html [L]

ErrorDocument 404 /files/app/404.html
```

Die Weiterleitung von `/files/app` auf `/files/app/` muss bei Bedarf in der übergeordneten `.htaccess` oder im Virtual Host eingerichtet werden. Falls `.htaccess` deaktiviert ist, sind die Regeln direkt in die Virtual-Host-Konfiguration zu übernehmen.

## nginx

Bei einem üblichen Document Root kann folgende Konfiguration verwendet werden:

```nginx
location = /files/app {
    return 301 /files/app/;
}

location /files/app/ {
    try_files $uri $uri.html $uri/ =404;
    error_page 404 =404 /files/app/404.html;
}
```

## Auslieferung und Caching

- `_next/static/` darf langfristig mit `Cache-Control: public, max-age=31536000, immutable` gecacht werden.
- HTML-Dateien und `404.html` sollen nur kurz oder mit `no-cache` gecacht werden.
- Erforderliche MIME-Typen sind insbesondere JavaScript, CSS, SVG, GeoJSON/JSON, WOFF2, JPEG, PNG und Audio.
- Komprimierung mit Brotli oder gzip ist sinnvoll, aber keine Voraussetzung.

Falls die bestehende Website eine Content-Security-Policy verwendet, müssen Verbindungen zu den tatsächlich eingesetzten externen Diensten zugelassen werden. Dazu gehören insbesondere:

- Kartenkacheln: `https://*.basemaps.cartocdn.com`
- Firestore: `https://firestore.googleapis.com`
- Firebase Storage: `https://firebasestorage.googleapis.com`
- Firebase Authentication: `https://identitytoolkit.googleapis.com`, `https://securetoken.googleapis.com`, `https://*.firebaseapp.com`
- Google-Anmeldung: `https://accounts.google.com`
