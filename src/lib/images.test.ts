import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  DEFAULT_IMAGE_CREDIT,
  buildPOIImageStoragePaths,
  extractCredit,
  normalizeImageFileName,
  resolveImageUrl,
  validateImageFile,
} from './images';

afterEach(() => {
  vi.unstubAllEnvs();
});

function file(name: string, type: string, size = 4) {
  return new File([new Uint8Array(size)], name, { type });
}

describe('POI image helpers', () => {
  it('normalizes image filenames to stable jpg names', () => {
    expect(normalizeImageFileName('45 Friedhofskapelle.jpg')).toBe('45-friedhofskapelle.jpg');
    expect(normalizeImageFileName('Müller & Söhne.PNG')).toBe('mueller-soehne.jpg');
  });

  it('builds display and thumbnail storage paths', () => {
    expect(buildPOIImageStoragePaths('poi_sws_hauptkapelle', '45 Friedhofskapelle.jpg')).toEqual({
      display: 'poi-images/poi_sws_hauptkapelle/display/45-friedhofskapelle.jpg',
      thumb: 'poi-images/poi_sws_hauptkapelle/thumb/45-friedhofskapelle.jpg',
    });
  });

  it('preserves absolute image URLs', () => {
    expect(resolveImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
  });

  it('prefixes local public paths with the configured base path', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/stahnsdorf');

    expect(resolveImageUrl('images/poi/test.jpg')).toBe('/stahnsdorf/images/poi/test.jpg');
    expect(resolveImageUrl('/images/poi/test.jpg')).toBe('/stahnsdorf/images/poi/test.jpg');
    expect(resolveImageUrl('/stahnsdorf/images/poi/test.jpg')).toBe('/stahnsdorf/images/poi/test.jpg');
  });

  it('extracts credit from metadata with fallback', () => {
    expect(extractCredit({ Creator: ['Ada Lovelace'] })).toBe('Ada Lovelace');
    expect(extractCredit({ Credit: 'Archiv Test' })).toBe('Archiv Test');
    expect(extractCredit({ Artist: 'Max Mustermann' })).toBe('Max Mustermann');
    expect(extractCredit({ Copyright: 'Maria Muster, 2026' })).toBe('Maria Muster, 2026');
    expect(extractCredit({ Artist: '' })).toBe(DEFAULT_IMAGE_CREDIT);
  });

  it('validates accepted upload image files', () => {
    expect(validateImageFile(file('grab.jpg', 'image/jpeg'))).toEqual({ ok: true });
    expect(validateImageFile(file('scan.png', 'image/png'))).toEqual({ ok: true });
  });

  it('rejects unsupported and oversized upload files with German messages', () => {
    expect(validateImageFile(file('bild.heic', 'image/heic'))).toEqual({
      ok: false,
      message: 'HEIC-Bilder werden noch nicht unterstützt. Bitte als JPEG oder PNG hochladen.',
    });
    expect(validateImageFile(file('text.txt', 'text/plain'))).toEqual({
      ok: false,
      message: 'Nur JPEG- und PNG-Bilder können hochgeladen werden.',
    });
    expect(validateImageFile(file('gross.jpg', 'image/jpeg', 21 * 1024 * 1024))).toEqual({
      ok: false,
      message: 'Das Bild ist zu groß. Maximal erlaubt sind 20 MB.',
    });
  });
});
