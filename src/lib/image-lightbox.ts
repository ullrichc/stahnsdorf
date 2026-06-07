export function getLightboxNextIndex(currentIndex: number, imageCount: number): number {
  if (imageCount <= 0) return currentIndex;
  return (currentIndex + 1) % imageCount;
}

export function getLightboxPreviousIndex(currentIndex: number, imageCount: number): number {
  if (imageCount <= 0) return currentIndex;
  return (currentIndex - 1 + imageCount) % imageCount;
}

export function shouldCloseLightbox(key: string): boolean {
  return key === 'Escape';
}
