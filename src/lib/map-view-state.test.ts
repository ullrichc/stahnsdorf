import { describe, expect, test, vi } from 'vitest';
import {
  readStoredMapView,
  resolveInitialMapView,
  writeStoredMapView,
  type StoredMapView,
} from './map-view-state';

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

  test('starts a fresh map at the chapel with labels visible', () => {
    expect(resolveInitialMapView(storage())).toEqual({
      lat: 52.3895066,
      lng: 13.1809545,
      zoom: 19,
      restored: false,
    });
  });

  test('restores the current session map view without treating it as fresh', () => {
    const view: StoredMapView = { lat: 52.386, lng: 13.177, zoom: 17 };

    expect(resolveInitialMapView(storage(JSON.stringify(view)))).toEqual({
      ...view,
      restored: true,
    });
  });
});
