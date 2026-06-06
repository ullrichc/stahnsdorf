import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import exifr from 'exifr';
import sharp from 'sharp';

export const DEFAULT_IMAGE_CREDIT = 'Förderverein Südwestkirchhof Stahnsdorf e.V.';

export function normalizeImageFileName(name) {
  const withoutExtension = path.basename(name).replace(/\.[^.]+$/, '');
  const ascii = withoutExtension
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${ascii || 'bild'}.jpg`;
}

export function buildPOIImageStoragePaths(poiId, sourceName) {
  const fileName = normalizeImageFileName(sourceName);
  return {
    display: `poi-images/${poiId}/display/${fileName}`,
    thumb: `poi-images/${poiId}/thumb/${fileName}`,
  };
}

export function storageMediaUrl(bucket, storagePath) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(storagePath)}?alt=media`;
}

export async function fileHash(filePath) {
  const buffer = await readFile(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}

export async function readImageCredit(filePath) {
  const metadata = await exifr.parse(filePath, {
    iptc: true,
    xmp: true,
    tiff: true,
  }).catch(() => ({}));

  return extractCredit(metadata ?? {});
}

export function extractCredit(metadata) {
  const keys = [
    'dc:creator',
    'creator',
    'Creator',
    'By-line',
    'Byline',
    'Credit',
    'credit',
    'Artist',
    'artist',
    'Copyright',
    'copyright',
  ];

  for (const key of keys) {
    const value = normalizeMetadataValue(metadata[key]);
    if (value) return value;
  }

  return DEFAULT_IMAGE_CREDIT;
}

export async function optimizeImage(filePath) {
  const display = await resize(filePath, 1600, 82);
  const thumb = await resize(filePath, 480, 78);
  return { display, thumb };
}

async function resize(filePath, maxSize, quality) {
  const image = sharp(filePath, { rotate: true }).resize({
    width: maxSize,
    height: maxSize,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const buffer = await image.jpeg({ quality, mozjpeg: true }).toBuffer();
  const metadata = await sharp(buffer).metadata();
  return {
    buffer,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}

function normalizeMetadataValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeMetadataValue(item)).find(Boolean) ?? null;
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
