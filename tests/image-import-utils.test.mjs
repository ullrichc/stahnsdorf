import { describe, expect, it } from 'vitest';
import { resolveImageCredit } from '../scripts/image-import-utils.mjs';

describe('resolveImageCredit', () => {
  it('prefers a confirmed manifest credit without reading image metadata', async () => {
    await expect(resolveImageCredit('does-not-exist.jpg', ' Lars Uhlemann '))
      .resolves.toBe('Lars Uhlemann');
  });
});
