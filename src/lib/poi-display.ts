import type { PoiTyp } from './types';

export type SourceSegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; href: string };

export function formatDateRange(start?: string | null, end?: string | null): string {
  const formattedStart = formatHistoricalDate(start);
  const formattedEnd = formatHistoricalDate(end);

  if (formattedStart && formattedEnd) return `${formattedStart}-${formattedEnd}`;
  return formattedStart || formattedEnd || '';
}

export function formatHistoricalDate(value?: string | null): string {
  if (!value) return '';

  const fullDate = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!fullDate) return value;

  const [, year, month, day] = fullDate;
  return `${day}.${month}.${year}`;
}

export type PoiDateLabels = {
  range: string;
  born: string;
  died: string;
  built: string;
  created: string;
  until: string;
};

export function formatPoiDate(
  typ: PoiTyp,
  start: string | null | undefined,
  end: string | null | undefined,
  labels: PoiDateLabels,
): string {
  const formattedStart = formatHistoricalDate(start);
  const formattedEnd = formatHistoricalDate(end);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} ${labels.range} ${formattedEnd}`;
  }

  if (typ === 'grab') {
    if (formattedStart) return `${labels.born} ${formattedStart}`;
    if (formattedEnd) return `${labels.died} ${formattedEnd}`;
    return '';
  }

  if (formattedStart) {
    const label = typ === 'bauwerk' || typ === 'mausoleum'
      ? labels.built
      : labels.created;
    return `${label} ${formattedStart}`;
  }

  if (formattedEnd) return `${labels.until} ${formattedEnd}`;
  return '';
}

export function parseGermanDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}$/.test(trimmed)) return trimmed;

  const fullDate = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!fullDate) {
    throw new Error('Datum bitte als TT.MM.JJJJ oder JJJJ eingeben.');
  }

  const [, day, month, year] = fullDate;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const isValid = parsed.getUTCFullYear() === Number(year)
    && parsed.getUTCMonth() === Number(month) - 1
    && parsed.getUTCDate() === Number(day);
  if (!isValid) {
    throw new Error('Datum bitte als gültiges TT.MM.JJJJ eingeben.');
  }

  return `${year}-${month}-${day}`;
}

export function linkifySourceText(text: string): SourceSegment[] {
  const segments: SourceSegment[] = [];
  const markdownLinkPattern = /\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markdownLinkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      appendSegments(segments, linkifyRawUrls(text.slice(lastIndex, match.index)));
    }
    segments.push({ type: 'link', text: match[1], href: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    appendSegments(segments, linkifyRawUrls(text.slice(lastIndex)));
  }

  return segments.length > 0 ? segments : [{ type: 'text', text }];
}

function linkifyRawUrls(text: string): SourceSegment[] {
  const segments: SourceSegment[] = [];
  const urlPattern = /https?:\/\/[^\s]+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      pushText(segments, text.slice(lastIndex, match.index));
    }

    const rawUrl = match[0];
    const href = rawUrl.replace(/[.,;)]$/, '');
    const trailing = rawUrl.slice(href.length);
    segments.push({ type: 'link', text: href, href });
    if (trailing) {
      pushText(segments, trailing);
    }
    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < text.length) {
    pushText(segments, text.slice(lastIndex));
  }

  return segments.length > 0 ? segments : [{ type: 'text', text }];
}

function appendSegments(target: SourceSegment[], additions: SourceSegment[]) {
  for (const segment of additions) {
    if (segment.type === 'text') {
      pushText(target, segment.text);
    } else {
      target.push(segment);
    }
  }
}

function pushText(segments: SourceSegment[], text: string) {
  if (!text) return;

  const previous = segments.at(-1);
  if (previous?.type === 'text') {
    previous.text += text;
    return;
  }

  segments.push({ type: 'text', text });
}
