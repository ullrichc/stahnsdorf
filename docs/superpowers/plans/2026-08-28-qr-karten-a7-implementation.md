# QR-Karten A7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine einzelne A7-QR-Karte und einen A4-Druckbogen mit acht gedrehten A7-Karten als druckfertige PDFs erzeugen und prüfen.

**Architecture:** Ein temporärer Python-Generator zeichnet mit ReportLab eine A7-Karte als wiederverwendbare Funktion und setzt dieselbe Funktion einmal auf A7 sowie achtmal mit exakt definierten Transformationen auf A4. Ein separater Node-Prüfer liest die Kontroll-PNGs mit Sharp und dekodiert jeden QR-Code unabhängig mit dem im aktuellen Workspace vorhandenen jsQR; pypdf übernimmt zusätzlich die PDF-Preflight-Prüfung.

**Tech Stack:** Python, ReportLab, pypdf, Poppler (`pdfinfo`, `pdftoppm`), Node.js, Sharp, jsQR

---

### Task 1: Prüfgerüst anlegen

**Files:**
- Create: `tmp/pdfs/verify-qr-cards.mjs`
- Output: `output/pdf/qr-karte-suedwestkirchhof-a7.pdf`
- Output: `output/pdf/qr-karten-suedwestkirchhof-a4-8x-a7.pdf`

- [ ] **Step 1: Einen Node-Prüfer schreiben**

Der Prüfer muss beide erwarteten PDFs voraussetzen, die gerenderten PNGs mit Sharp als Rohpixel lesen und mit jsQR dekodieren. Für A7 wird ein QR-Code erwartet, für A4 werden die acht Kartenbereiche einzeln ausgeschnitten und geprüft. Jede Dekodierung muss exakt `https://suedwestkirchhof.de/app` ergeben.

Vor dem Prüflauf wird mit dem Workspace-Node explizit kontrolliert, dass `sharp` und `jsqr` auflösbar sind. Diese Werkzeuge werden nur für die einmalige Artefaktprüfung verwendet und nicht als neue Projektabhängigkeiten eingetragen.

- [ ] **Step 2: Prüfer ohne PDFs ausführen**

Run:

```powershell
& 'C:\Users\cullrich\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' -e "console.log(require.resolve('sharp')); console.log(require.resolve('jsqr'))"
& 'C:\Users\cullrich\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tmp/pdfs/verify-qr-cards.mjs
```

Expected: FAIL, weil die beiden Ausgabedateien noch fehlen.

### Task 2: PDF-Generator implementieren

**Files:**
- Create: `tmp/pdfs/create-qr-cards.py`
- Create: `output/pdf/qr-karte-suedwestkirchhof-a7.pdf`
- Create: `output/pdf/qr-karten-suedwestkirchhof-a4-8x-a7.pdf`

- [ ] **Step 1: Wiederverwendbare A7-Zeichenfunktion implementieren**

Die Funktion zeichnet auf 74 x 105 mm:

- weißen Hintergrund;
- zentrierte dunkelgrüne Überschrift `Karte des Südwestkirchhofs`;
- kurze orangefarbene Linie;
- QR-Code über ReportLabs `QrCodeWidget` mit `barLevel="M"`, `barBorder=4`, `barWidth=barHeight=46*mm` und dunkelgrüner Füllung;
- für die Ziel-URL ergibt sich Version 3 mit 29 Datenmodulen; einschließlich vier Modulen Ruhezone pro Seite sind es 37 Module und damit `46 / 37 = 1,243 mm` pro Modul;
- Text `Mit der Smartphone-Kamera scannen`;
- URL `suedwestkirchhof.de/app`;
- mindestens 5 mm Sicherheitsabstand.

Die ReportLab-Schriften `Vera.ttf` und `VeraBd.ttf` werden registriert und dadurch in die PDFs eingebettet.

Vor dem Schreiben der PDFs prüft der Generator per Assertions Ziel-URL, Fehlerkorrekturstufe, Vier-Modul-Rand, 46-mm-Außenmaß, Modulzahl und alle Inhaltskoordinaten einschließlich 5-mm-Sicherheitsbereich. Der QR-Code wird über `renderPDF.draw` als Vektorgrafik ausgegeben.

- [ ] **Step 2: Einzelne A7-PDF erzeugen**

Eine Seite mit exakt 74 x 105 mm erzeugen und die Kartenfunktion einmal ungedreht aufrufen.

- [ ] **Step 3: A4-Druckbogen erzeugen**

Eine Seite mit exakt 210 x 297 mm erzeugen. Das 210 x 296 mm große Raster erhält oben und unten je 0,5 mm Abstand. Für Spalte `c = 0..1` und Reihe `r = 0..3` gilt:

```python
x = c * 105 * mm
y = 0.5 * mm + r * 74 * mm
canvas.saveState()
canvas.translate(x + 105 * mm, y)
canvas.rotate(90)
draw_a7_card(canvas, 0, 0)
canvas.restoreState()
```

Die innere Spaltengrenze liegt bei `x = 105 mm`, die inneren Zeilengrenzen bei `y = 74,5 / 148,5 / 222,5 mm`. Nur diese vier Grenzen werden mit `0,15 pt` in `#B8C0BC` gezeichnet.

Für den A4-Bogen setzt der Generator Titel und Betreff der PDF-Metadaten; der Betreff enthält den Hinweis `Mit 100 % / Tatsächliche Größe drucken - nicht an Seite anpassen`.

- [ ] **Step 4: Generator ausführen**

Run:

```powershell
& 'C:\Users\cullrich\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' tmp/pdfs/create-qr-cards.py
```

Expected: Beide PDF-Dateien werden unter `output/pdf/` erzeugt.

### Task 3: Technische und visuelle Prüfung

**Files:**
- Create temporarily: `tmp/pdfs/qr-a7-check.png`
- Create temporarily: `tmp/pdfs/qr-a4-check.png`
- Verify: `output/pdf/qr-karte-suedwestkirchhof-a7.pdf`
- Verify: `output/pdf/qr-karten-suedwestkirchhof-a4-8x-a7.pdf`

- [ ] **Step 1: PDF-Maße und Seitenzahl prüfen**

Mit pypdf bestätigen:

- A7: genau eine Seite, 74 x 105 mm;
- A4: genau eine Seite, 210 x 297 mm.

Zusätzlich prüfen:

- der A4-Betreff enthält den 100-%-Druckhinweis;
- jeder verwendete TrueType-Font besitzt im FontDescriptor einen eingebetteten Fontstream;
- keine Seite enthält Rasterbild-XObjects vom Subtyp `/Image`;
- die Inhaltsströme enthalten die erwarteten 0,15-pt-Schnittlinien an den vier festgelegten Koordinaten;
- Generator-Assertions dokumentieren 46-mm-QR-Ausmaß, vier Module Ruhezone, Modulgröße und 5-mm-Sicherheitsbereich.

- [ ] **Step 2: Beide PDFs mit Poppler bei 300 dpi rendern**

Run:

```powershell
& 'C:\Users\cullrich\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe' -png -r 300 -singlefile output/pdf/qr-karte-suedwestkirchhof-a7.pdf tmp/pdfs/qr-a7-check
& 'C:\Users\cullrich\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe' -png -r 300 -singlefile output/pdf/qr-karten-suedwestkirchhof-a4-8x-a7.pdf tmp/pdfs/qr-a4-check
```

Expected: je eine PNG-Datei ohne Renderfehler.

- [ ] **Step 3: Alle QR-Codes unabhängig dekodieren**

Run:

```powershell
& 'C:\Users\cullrich\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' tmp/pdfs/verify-qr-cards.mjs
```

Expected: 1/1 QR-Code auf A7 und 8/8 QR-Codes auf A4 ergeben exakt `https://suedwestkirchhof.de/app`.

- [ ] **Step 4: Kontroll-PNGs visuell prüfen**

Beide Seiten vollständig auf abgeschnittene Texte, überlagerte Inhalte, fehlende Schnittlinien und ungleichmäßige Abstände prüfen.

Bei der Übergabe ausdrücklich angeben: `Mit 100 % / Tatsächliche Größe drucken; nicht an Seite anpassen.`

- [ ] **Step 5: Temporäre Dateien entfernen**

Nach bestandener Prüfung `tmp/pdfs/create-qr-cards.py`, `tmp/pdfs/verify-qr-cards.mjs` und beide Kontroll-PNGs entfernen. Die zwei finalen PDFs bleiben unter `output/pdf/` erhalten.
