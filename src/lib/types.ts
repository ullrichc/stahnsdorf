export type Translation = {
  de?: string;
  en?: string;
  fr?: string;
  [lang: string]: string | undefined;
};

export type Coordinates = [number, number];

export type SourceRef = {
  title: string;
  type: string;
  publisher?: string;
  url: string;
  accessed?: string;
  note?: string;
};

export type PersonRef = {
  name: string;
  role_note?: string;
  status?: "bestätigt" | "unsicher" | "prüfen";
  birth_date?: string;
  death_date?: string;
};

export type PoiStatus = "bestätigt" | "unsicher" | "prüfen";
export type CoordinateStatus = "exact" | "approximate" | "unknown";

export type POI = {
  id: string;
  type: string;
  name: Translation;
  coordinates: Coordinates | null;
  coordinates_status: CoordinateStatus;
  location_note: Translation;
  summary: Translation;
  description: Translation;
  dates: Record<string, string>;
  images: string[];
  audio: string[]; // Re-typed as array in new schema, but UX layer assumes Record? Wait. No, schema says string[]
  tags: string[];
  categories: string[];
  source_refs: SourceRef[];
  status: PoiStatus;
  alt_names: string[];
  last_reviewed: string;
  image_source_urls: string[];
  primary_person?: PersonRef;
  persons?: PersonRef[];
  uncertainty_note?: string | Translation;
};

export type Collection = {
  id: string;
  name: Translation;
  summary: Translation;
  description: Translation;
  pois: string[];
  tags: string[];
  status: "bestätigt" | "unsicher" | "prüfen";
  last_reviewed: string;
};
