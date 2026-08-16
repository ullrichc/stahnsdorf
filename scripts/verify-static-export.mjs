import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve('out');
const requiredFiles = [
  'poi.html',
  path.join('admin', 'poi', 'edit.html'),
  'sammlung.html',
  '404.html',
];

for (const relativePath of requiredFiles) {
  await readFile(path.join(outputDir, relativePath));
}

const notFoundHtml = await readFile(path.join(outputDir, '404.html'), 'utf8');
if (!notFoundHtml.includes('data-legacy-route-fallback')) {
  throw new Error('out/404.html enthält den Legacy-Routen-Fallback nicht.');
}

const textFiles = await collectTextFiles(outputDir);
const forbidden = [
  ['fonts.googleapis.com', 'externe Google-Font'],
  ['maximum-scale=1', 'gesperrter Browser-Zoom'],
  ['user-scalable=no', 'gesperrter Browser-Zoom'],
];

for (const file of textFiles) {
  const content = await readFile(file, 'utf8');
  for (const [needle, label] of forbidden) {
    if (content.includes(needle)) {
      throw new Error(`${label} in ${path.relative(outputDir, file)} gefunden.`);
    }
  }
}

console.log('Static-Export geprüft: Query-Routen, 404-Fallback, Offline-Fonts und Browser-Zoom.');

async function collectTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTextFiles(fullPath));
    else if (/\.(?:html|css|js)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}
