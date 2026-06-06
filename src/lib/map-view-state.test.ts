import { describe, expect, test, vi } from 'vitest';
import { readStoredMapView, writeStoredMapView, type StoredMapView } from './map-view-state';

function storage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_: string, next: string) => {
      value = next;
    }),
  } as unknown as Storage;
}

describe('map view state', () => {
  test('returns null when no view is stored', () => {
    expect(readStoredMapView(storage())).toBeNull();
  });

  test('ignores invalid stored data', () => {
    expect(readStoredMapView(storage('{kaputt'))).toBeNull();
    expect(readStoredMapView(storage(JSON.stringify({ lat: 999, lng: 13, zoom: 16 })))).toBeNull();
  });

  test('roundtrips a valid map view', () => {
    const store = storage();
    const view: StoredMapView = { lat: 52.39, lng: 13.18, zoom: 18 };

    writeStoredMapView(store, view);

    expect(readStoredMapView(store)).toEqual(view);
  });
});
