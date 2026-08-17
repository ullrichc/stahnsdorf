import { describe, expect, test } from 'vitest';
import {
  formatDateRange,
  formatHistoricalDate,
  formatPoiDate,
  linkifySourceText,
  parseGermanDate,
} from './poi-display';

describe('formatDateRange', () => {
  test('formats complete birth and death dates as day.month.year', () => {
    expect(formatDateRange('1974-01-08', '2025-12-31')).toBe('08.01.1974-31.12.2025');
  });

  test('keeps year-only values when the exact date is unknown', () => {
    expect(formatDateRange('1947', '2023')).toBe('1947-2023');
  });

  test('formats a single complete date', () => {
    expect(formatDateRange('1885-10-23', null)).toBe('23.10.1885');
  });
});

describe('formatPoiDate', () => {
  const labels = {
    range: 'bis',
    born: 'geboren',
    died: 'gestorben',
    built: 'erbaut',
    created: 'entstanden',
    until: 'bis',
  };

  test('uses a readable connector for complete life spans', () => {
    expect(formatPoiDate('grab', '1873', '1923-01-31', labels)).toBe('1873 bis 31.01.1923');
  });

  test('labels a single birth or death date', () => {
    expect(formatPoiDate('grab', '1873', null, labels)).toBe('geboren 1873');
    expect(formatPoiDate('grab', null, '1923-01-31', labels)).toBe('gestorben 31.01.1923');
  });

  test('labels buildings and other sites without implying a biography', () => {
    expect(formatPoiDate('bauwerk', '1911', null, labels)).toBe('erbaut 1911');
    expect(formatPoiDate('gedenkanlage', '1920', null, labels)).toBe('entstanden 1920');
    expect(formatPoiDate('bauwerk', null, '1945', labels)).toBe('bis 1945');
  });
});

describe('German date input', () => {
  test('formats stored ISO dates for editors', () => {
    expect(formatHistoricalDate('2025-12-31')).toBe('31.12.2025');
  });

  test('parses German full dates into the internal ISO format', () => {
    expect(parseGermanDate('31.12.2025')).toBe('2025-12-31');
  });

  test('keeps year-only values', () => {
    expect(parseGermanDate('1947')).toBe('1947');
  });

  test('rejects invalid calendar dates', () => {
    expect(() => parseGermanDate('31.02.2025')).toThrow('TT.MM.JJJJ');
  });
});

describe('linkifySourceText', () => {
  test('renders an explicit Markdown source link with a human-readable label', () => {
    expect(linkifySourceText('[Südwestkirchhof Stahnsdorf, Wikipedia](https://de.wikipedia.org/wiki/S%C3%BCdwestkirchhof_Stahnsdorf)')).toEqual([
      {
        type: 'link',
        text: 'Südwestkirchhof Stahnsdorf, Wikipedia',
        href: 'https://de.wikipedia.org/wiki/S%C3%BCdwestkirchhof_Stahnsdorf',
      },
    ]);
  });

  test('splits source text into text and url segments', () => {
    expect(linkifySourceText('Quelle https://example.org/test, abgerufen')).toEqual([
      { type: 'text', text: 'Quelle ' },
      { type: 'link', text: 'https://example.org/test', href: 'https://example.org/test' },
      { type: 'text', text: ', abgerufen' },
    ]);
  });

  test('keeps source text without urls as one text segment', () => {
    expect(linkifySourceText('Lokales Grabfoto')).toEqual([
      { type: 'text', text: 'Lokales Grabfoto' },
    ]);
  });

  test('keeps coordinate commas inside urls', () => {
    expect(linkifySourceText('OsmAnd https://osmand.net/map?pin=52.39071,13.18288#15/52.39071/13.18288')).toEqual([
      { type: 'text', text: 'OsmAnd ' },
      {
        type: 'link',
        text: 'https://osmand.net/map?pin=52.39071,13.18288#15/52.39071/13.18288',
        href: 'https://osmand.net/map?pin=52.39071,13.18288#15/52.39071/13.18288',
      },
    ]);
  });
});
