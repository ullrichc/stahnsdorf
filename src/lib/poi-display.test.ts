import { describe, expect, test } from 'vitest';
import { formatDateRange, linkifySourceText } from './poi-display';

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

describe('linkifySourceText', () => {
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
