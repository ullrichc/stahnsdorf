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

export function linkifySourceText(text: string): SourceSegment[] {
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

function pushText(segments: SourceSegment[], text: string) {
  if (!text) return;

  const previous = segments.at(-1);
  if (previous?.type === 'text') {
    previous.text += text;
    return;
  }

  segments.push({ type: 'text', text });
}
