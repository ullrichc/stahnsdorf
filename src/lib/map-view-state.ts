export const MAP_VIEW_STORAGE_KEY = 'stahnsdorf.mapView';

export const DEFAULT_MAP_VIEW = {
  lat: 52.3895066,
  lng: 13.1809545,
  zoom: 19,
} as const;

export type StoredMapView = {
  lat: number;
  lng: number;
  zoom: number;
};

export type InitialMapView = StoredMapView & {
  restored: boolean;
};

export function resolveInitialMapView(storage: Pick<Storage, 'getItem'> | null): InitialMapView {
  const stored = storage ? readStoredMapView(storage) : null;
  return stored
    ? { ...stored, restored: true }
    : { ...DEFAULT_MAP_VIEW, restored: false };
}

export function readStoredMapView(storage: Pick<Storage, 'getItem'>, key = MAP_VIEW_STORAGE_KEY): StoredMapView | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredMapView>;
    if (!isValidMapView(parsed)) return null;

    return {
      lat: parsed.lat,
      lng: parsed.lng,
      zoom: parsed.zoom,
    };
  } catch {
    return null;
  }
}

export function writeStoredMapView(storage: Pick<Storage, 'setItem'>, view: StoredMapView, key = MAP_VIEW_STORAGE_KEY) {
  if (!isValidMapView(view)) return;
  storage.setItem(key, JSON.stringify(view));
}

function isValidMapView(value: Partial<StoredMapView>): value is StoredMapView {
  return typeof value.lat === 'number'
    && Number.isFinite(value.lat)
    && value.lat >= -90
    && value.lat <= 90
    && typeof value.lng === 'number'
    && Number.isFinite(value.lng)
    && value.lng >= -180
    && value.lng <= 180
    && typeof value.zoom === 'number'
    && Number.isFinite(value.zoom)
    && value.zoom >= 0
    && value.zoom <= 22;
}
