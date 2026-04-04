// scripts/id-mapping.mjs

// Scraping API ID → existing POI ID (before renames)
// 23 matches out of 27 scraping POIs
export const SCRAPING_TO_EXISTING = {
  '367': 'ernst-gennat',               // Ernst Gennat
  '369': 'poi_sws_edmund-rumpler',      // Edmund Rumpler
  '371': 'poi_sws_alexander-von-kluck', // Alexander von Kluck
  '373': 'poi_sws_karl-ludwig-manzel',  // Karl Ludwig Manzel
  '375': 'poi_sws_carl-ludwig-schleich',// Carl Ludwig Schleich
  '376': 'engelbert-humperdinck',       // Engelbert Humperdinck
  '377': 'poi_sws_gustav-kadelburg',    // Gustav Kadelburg
  '378': 'fw-murnau',                   // Friedrich Wilhelm Murnau
  '379': 'werner-von-siemens',          // Werner von Siemens
  '380': 'poi_sws_julius-wissinger',    // Hermann O.J. Wissinger
  '381': 'lovis-corinth',              // Lovis Corinth
  '382': 'poi_sws_max-jordan',          // Max Jordan
  '383': 'poi_sws_adolf-bastian',       // Adolf Bastian
  '384': 'poi_sws_hugo-conwentz',       // Hugo Conwentz
  '386': 'poi_sws_elisabeth-von-ardenne',// Elisabeth von Ardenne
  '387': 'poi_sws_rudolf-breitscheid',  // Rudolf Breitscheid
  '388': 'poi_sws_adolf-rohrbach',       // Adolf Rohrbach
  '389': 'poi_sws_gustav-langenscheidt', // Langenscheidt
  '391': 'poi_sws_ferdinand-von-richthofen', // Richthofen
  '392': 'heinrich-zille',              // Zille
  '393': 'poi_sws_wilhelm-kuhnert',     // Kuhnert
  '395': 'poi_sws_emil-krebs',          // Krebs
  '397': 'poi_sws_erik-jan-hanussen',   // Hanussen
};

// 4 new POIs from scraping that don't exist in current data
export const NEW_SCRAPING_IDS = ['385', '390', '394', '396'];

// Old non-standard ID → new poi_sws_ ID
export const ID_RENAMES = {
  'engelbert-humperdinck': 'poi_sws_engelbert-humperdinck',
  'ernst-gennat': 'poi_sws_ernst-gennat',
  'hauptkapelle': 'poi_sws_hauptkapelle',
  'fw-murnau': 'poi_sws_fw-murnau',
  'friedhofseingang': 'poi_sws_friedhofseingang',
  'heinrich-zille': 'poi_sws_heinrich-zille',
  'hugo-distler': 'poi_sws_hugo-distler',
  'joachim-gottschalk': 'poi_sws_joachim-gottschalk',
  'lovis-corinth': 'poi_sws_lovis-corinth',
  'theodor-fontane-jun': 'poi_sws_theodor-fontane-jun',
  'werner-von-siemens': 'poi_sws_werner-von-siemens',
};

// Apply ID renames to a POI array (returns new array, does not mutate)
export function applyRenames(pois) {
  return pois.map(poi => {
    const newId = ID_RENAMES[poi.id];
    return newId ? { ...poi, id: newId } : poi;
  });
}

// Apply ID renames inside collections' pois arrays
export function applyRenamesInCollections(collections) {
  return collections.map(col => ({
    ...col,
    pois: col.pois.map(id => ID_RENAMES[id] || id),
  }));
}
