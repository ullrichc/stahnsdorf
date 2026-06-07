import { describe, expect, it } from 'vitest';
import { getLightboxNextIndex, getLightboxPreviousIndex, shouldCloseLightbox } from './image-lightbox';

describe('image lightbox state helpers', () => {
  it('cycles forward through image indexes', () => {
    expect(getLightboxNextIndex(0, 3)).toBe(1);
    expect(getLightboxNextIndex(2, 3)).toBe(0);
  });

  it('cycles backward through image indexes', () => {
    expect(getLightboxPreviousIndex(2, 3)).toBe(1);
    expect(getLightboxPreviousIndex(0, 3)).toBe(2);
  });

  it('keeps the current index when there are no images', () => {
    expect(getLightboxNextIndex(4, 0)).toBe(4);
    expect(getLightboxPreviousIndex(4, 0)).toBe(4);
  });

  it('closes on Escape only', () => {
    expect(shouldCloseLightbox('Escape')).toBe(true);
    expect(shouldCloseLightbox('ArrowRight')).toBe(false);
  });
});
