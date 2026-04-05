// Verbindlich: docs/schema.md

export type LocalizedText = {
  de: string;
  en?: string;
  fr?: string;
  pl?: string;
  ru?: string;
  sv?: string;
  [lang: string]: string | undefined;
};

export type Koordinaten = {
  lat: number;
  lng: number;
};

export type Bild = {
  datei: string;
  nachweis: string;
  nachweis_url?: string;
  beschriftung?: LocalizedText;
};

export type PoiTyp = 'grab' | 'mausoleum' | 'denkmal' | 'gedenkanlage' | 'bauwerk' | 'bereich';
export type Status = 'bestätigt' | 'prüfen';

export type POI = {
  id: string;
  typ: PoiTyp;
  name: LocalizedText;
  koordinaten: Koordinaten | null;
  kurztext: LocalizedText;
  beschreibung: LocalizedText;
  datum_von?: string | null;
  datum_bis?: string | null;
  wikipedia_url?: string | null;
  bilder?: Bild[];
  audio?: Record<string, string>;
  quellen?: string[];
  status: Status;
  notiz?: string;
};

export type Collection = {
  id: string;
  name: LocalizedText;
  kurztext: LocalizedText;
  beschreibung: LocalizedText;
  pois: string[];
  status: Status;
  notiz?: string;
};

// --- Firestore-spezifische Typen (Authoring Tool) ---

export type PublishStatus = 'entwurf' | 'zur_prüfung' | 'veröffentlicht';

export type FirestorePOI = POI & {
  publish_status: PublishStatus;
  erstellt_von: string;
  erstellt_am: any; // Firestore Timestamp
  geaendert_von: string;
  geaendert_am: any; // Firestore Timestamp
};

export type FirestoreCollection = Collection & {
  publish_status: PublishStatus;
  erstellt_von: string;
  erstellt_am: any;
  geaendert_von: string;
  geaendert_am: any;
};
