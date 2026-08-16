import type { Bild } from './types';
import { resolveAppPath } from './app-path';

export const DEFAULT_IMAGE_CREDIT = 'Förderverein Südwestkirchhof Stahnsdorf e.V.';
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const DISPLAY_MAX_SIZE = 1600;
export const THUMB_MAX_SIZE = 480;
export const DISPLAY_QUALITY = 0.82;
export const THUMB_QUALITY = 0.78;

type UploadVariant = {
  blob: Blob;
  width: number;
  height: number;
};

export type OptimizedUploadImage = {
  display: Blob;
  thumb: Blob;
  width: number;
  height: number;
  thumbWidth: number;
  thumbHeight: number;
  mimeType: 'image/jpeg';
};

export function normalizeImageFileName(name: string): string {
  const withoutExtension = name.replace(/\.[^.]+$/, '');
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

export function buildPOIImageStoragePaths(poiId: string, sourceName: string) {
  const fileName = normalizeImageFileName(sourceName);
  return {
    display: `poi-images/${poiId}/display/${fileName}`,
    thumb: `poi-images/${poiId}/thumb/${fileName}`,
  };
}

export function resolveImageUrl(urlOrPath?: string): string | undefined {
  if (!urlOrPath?.trim()) return undefined;

  const value = urlOrPath.trim();
  if (/^(https?:|data:|blob:)/.test(value)) return value;

  return resolveAppPath(value);
}

export function getImageDisplayUrl(image?: Bild): string | undefined {
  return resolveImageUrl(image?.vorschau_datei || image?.datei);
}

export function extractCredit(metadata: Record<string, unknown>): string {
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

export function validateImageFile(file: File): { ok: true } | { ok: false; message: string } {
  const lowerName = file.name.toLowerCase();

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: 'Das Bild ist zu groß. Maximal erlaubt sind 20 MB.' };
  }

  if (file.type === 'image/heic' || file.type === 'image/heif' || lowerName.endsWith('.heic') || lowerName.endsWith('.heif')) {
    return { ok: false, message: 'HEIC-Bilder werden noch nicht unterstützt. Bitte als JPEG oder PNG hochladen.' };
  }

  if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
    return { ok: false, message: 'Nur JPEG- und PNG-Bilder können hochgeladen werden.' };
  }

  return { ok: true };
}

export async function readBrowserImageMetadata(file: File): Promise<Record<string, unknown>> {
  const exifr = await import('exifr');
  return (await exifr.parse(file, {
    iptc: true,
    xmp: true,
    tiff: true,
  })) ?? {};
}

export async function optimizeImageForUpload(file: File): Promise<OptimizedUploadImage> {
  const display = await resizeImage(file, DISPLAY_MAX_SIZE, DISPLAY_QUALITY);
  const thumb = await resizeImage(file, THUMB_MAX_SIZE, THUMB_QUALITY);

  return {
    display: display.blob,
    thumb: thumb.blob,
    width: display.width,
    height: display.height,
    thumbWidth: thumb.width,
    thumbHeight: thumb.height,
    mimeType: 'image/jpeg',
  };
}

function normalizeMetadataValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeMetadataValue(item)).find(Boolean) ?? null;
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function resizeImage(file: File, maxSize: number, quality: number): Promise<UploadVariant> {
  const imageBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSize / Math.max(imageBitmap.width, imageBitmap.height));
  const width = Math.max(1, Math.round(imageBitmap.width * scale));
  const height = Math.max(1, Math.round(imageBitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Bild konnte im Browser nicht verarbeitet werden.');

  ctx.drawImage(imageBitmap, 0, 0, width, height);
  imageBitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Bild konnte nicht optimiert werden.'));
      },
      'image/jpeg',
      quality,
    );
  });

  return { blob, width, height };
}
