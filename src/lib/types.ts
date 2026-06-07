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

export type KoordinatenQuelleTyp =
  | 'osm'
  | 'wo-sie-ruhen'
  | 'manuell-osmand'
  | 'manuell-kamera'
  | 'redaktionell'
  | 'altbestand'
  | 'unbekannt';

export type KoordinatenGenauigkeit = 'hoch' | 'mittel' | 'niedrig';

export type KoordinatenQuelle = {
  typ: KoordinatenQuelleTyp;
  beleg: string;
  datum?: string;
  genauigkeit?: KoordinatenGenauigkeit;
};

export type Bild = {
  datei: string;
  nachweis: string;
  nachweis_url?: string;
  beschriftung?: LocalizedText;
  storage_pfad?: string;
  breite?: number;
  hoehe?: number;
  mime_type?: string;
  vorschau_datei?: string;
  vorschau_storage_pfad?: string;
  vorschau_breite?: number;
  vorschau_hoehe?: number;
  quelle_datei?: string;
  quelle_hash?: string;
};

export type PoiTyp = 'grab' | 'mausoleum' | 'denkmal' | 'gedenkanlage' | 'bauwerk' | 'bereich';
export type Status = 'bestätigt' | 'prüfen';

export type POI = {
  id: string;
  typ: PoiTyp;
  name: LocalizedText;
  koordinaten: Koordinaten | null;
  koordinaten_quelle?: KoordinatenQuelle | null;
  lagehinweis?: string;
  lagehinweis_quelle?: string;
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
