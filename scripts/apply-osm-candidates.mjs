import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BACKUP = 'data/stahnsdorf-backup-translated.json';
const DEFAULT_AUDIT = 'inputdata/osm-poi-candidates.json';
const DEFAULT_FETCHED_AT = '2026-05-25';
const DEFAULT_TIMESTAMP = '2026-05-25T00:00:00.000Z';

export const NEW_POI_DETAILS = {
  'Anonymes Gräberfeld': {
    id: 'poi_sws_anonymes-graeberfeld',
    name: {
      de: 'Anonymes Gräberfeld',
      en: 'Anonymous burial field',
      fr: 'Champ funéraire anonyme',
      pl: 'Anonimowe pole grobowe',
      ru: 'Безымянное поле захоронений',
      sv: 'Anonymt gravfält',
    },
    kurztext: {
      de: 'Benannter Friedhofsbereich für anonyme Bestattungen.',
      en: 'Named cemetery section for anonymous burials.',
      fr: 'Secteur nommé du cimetière pour les inhumations anonymes.',
      pl: 'Nazwany sektor cmentarza przeznaczony do anonimowych pochówków.',
      ru: 'Именованный участок кладбища для анонимных захоронений.',
      sv: 'Namngiven kyrkogårdsdel för anonyma gravsättningar.',
    },
  },
  'Bestattungsareal unter Bäumen': {
    id: 'poi_sws_bestattungsareal-unter-baeumen',
    name: {
      de: 'Bestattungsareal unter Bäumen',
      en: 'Burial area under trees',
      fr: 'Espace funéraire sous les arbres',
      pl: 'Obszar pochówków pod drzewami',
      ru: 'Участок захоронений под деревьями',
      sv: 'Gravsättningsområde under träd',
    },
    kurztext: {
      de: 'Bestattungsbereich unter Bäumen, nach Art eines Friedwaldes.',
      en: 'Burial section under trees, similar to a woodland cemetery.',
      fr: 'Secteur d’inhumation sous les arbres, comparable à une forêt cinéraire.',
      pl: 'Sektor pochówków pod drzewami, podobny do leśnego cmentarza.',
      ru: 'Участок захоронений под деревьями, по типу лесного кладбища.',
      sv: 'Gravsättningsområde under träd, liknande en skogskyrkogård.',
    },
  },
  'Denkmal (node 13629435895)': {
    id: 'poi_sws_namenlose-metallstatue',
    name: {
      de: 'Namenlose Metallstatue',
      en: 'Unnamed metal statue',
      fr: 'Statue métallique sans nom',
      pl: 'Nienazwana metalowa statua',
      ru: 'Безымянная металлическая статуя',
      sv: 'Namnlös metallstaty',
    },
    kurztext: {
      de: 'Namenlose Metallstatue auf dem Südwestkirchhof.',
      en: 'Unnamed metal statue on the South-Western Cemetery.',
      fr: 'Statue métallique sans nom dans le cimetière du Sud-Ouest.',
      pl: 'Nienazwana metalowa statua na Cmentarzu Południowo-Zachodnim.',
      ru: 'Безымянная металлическая статуя на Юго-Западном кладбище.',
      sv: 'Namnlös metallstaty på Südwestkirchhof.',
    },
  },
  'Gedenkanlage (node 11966089685)': {
    id: 'poi_sws_namenlose-kriegsgraeber-gedenkanlage-1',
    name: {
      de: 'Namenlose Kriegsgräber-Gedenkanlage I',
      en: 'Unnamed war graves memorial I',
      fr: 'Mémorial anonyme des tombes de guerre I',
      pl: 'Nienazwane miejsce pamięci grobów wojennych I',
      ru: 'Безымянный мемориал воинских захоронений I',
      sv: 'Namnlös minnesanläggning för krigsgravar I',
    },
    kurztext: {
      de: 'Kriegsgräber-Gedenkanlage ohne eigenen OSM-Namen.',
      en: 'War graves memorial without its own OSM name.',
      fr: 'Mémorial de tombes de guerre sans nom propre dans OSM.',
      pl: 'Miejsce pamięci grobów wojennych bez własnej nazwy w OSM.',
      ru: 'Мемориал воинских захоронений без собственного названия в OSM.',
      sv: 'Minnesanläggning för krigsgravar utan eget OSM-namn.',
    },
  },
  'Gedenkanlage (node 11966089686)': {
    id: 'poi_sws_namenlose-kriegsgraeber-gedenkanlage-2',
    name: {
      de: 'Namenlose Kriegsgräber-Gedenkanlage II',
      en: 'Unnamed war graves memorial II',
      fr: 'Mémorial anonyme des tombes de guerre II',
      pl: 'Nienazwane miejsce pamięci grobów wojennych II',
      ru: 'Безымянный мемориал воинских захоронений II',
      sv: 'Namnlös minnesanläggning för krigsgravar II',
    },
    kurztext: {
      de: 'Kriegsgräber-Gedenkanlage ohne eigenen OSM-Namen.',
      en: 'War graves memorial without its own OSM name.',
      fr: 'Mémorial de tombes de guerre sans nom propre dans OSM.',
      pl: 'Miejsce pamięci grobów wojennych bez własnej nazwy w OSM.',
      ru: 'Мемориал воинских захоронений без собственного названия в OSM.',
      sv: 'Minnesanläggning för krigsgravar utan eget OSM-namn.',
    },
  },
  'Grab Paul Manteufel': {
    id: 'poi_sws_paul-manteufel',
    name: { de: 'Paul Manteufel', en: 'Paul Manteufel', fr: 'Paul Manteufel', pl: 'Paul Manteufel', ru: 'Пауль Мантефель', sv: 'Paul Manteufel' },
    kurztext: {
      de: 'Grab von Prof. Dr. med. Paul Manteufel (1879–1941).',
      en: 'Grave of Prof. Dr. med. Paul Manteufel (1879–1941).',
      fr: 'Tombe du professeur docteur en médecine Paul Manteufel (1879–1941).',
      pl: 'Grób prof. dr. med. Paula Manteufla (1879–1941).',
      ru: 'Могила профессора, доктора медицины Пауля Мантефеля (1879–1941).',
      sv: 'Grav för professor och medicine doktor Paul Manteufel (1879–1941).',
    },
    datum_von: '1879-07-11',
    datum_bis: '1941-01-14',
    wikipedia_url: 'https://de.wikipedia.org/wiki/Paul_Manteufel',
  },
  'Heilige Geist': {
    id: 'poi_sws_heilige-geist',
    name: { de: 'Heilige Geist', en: 'Holy Spirit', fr: 'Saint-Esprit', pl: 'Duch Święty', ru: 'Святой Дух', sv: 'Helig Ande' },
    kurztext: {
      de: 'Benannter Friedhofsbereich Heilige Geist.',
      en: 'Named cemetery section Holy Spirit.',
      fr: 'Secteur nommé du cimetière Saint-Esprit.',
      pl: 'Nazwany sektor cmentarza Duch Święty.',
      ru: 'Именованный участок кладбища «Святой Дух».',
      sv: 'Namngiven kyrkogårdsdel Helig Ande.',
    },
  },
  'Michael Heinrich': {
    id: 'poi_sws_michael-heinrich',
    name: { de: 'Michael Heinrich', en: 'Michael Heinrich', fr: 'Michael Heinrich', pl: 'Michael Heinrich', ru: 'Михаэль Хайнрих', sv: 'Michael Heinrich' },
    kurztext: {
      de: 'Grab von Michael Heinrich (1956–2025), Lagehinweis Baum 1130.',
      en: 'Grave of Michael Heinrich (1956–2025), location note tree 1130.',
      fr: 'Tombe de Michael Heinrich (1956–2025), repère arbre 1130.',
      pl: 'Grób Michaela Heinricha (1956–2025), wskazówka lokalizacyjna: drzewo 1130.',
      ru: 'Могила Михаэля Хайнриха (1956–2025), ориентир: дерево 1130.',
      sv: 'Grav för Michael Heinrich (1956–2025), lägesangivelse träd 1130.',
    },
    datum_von: '1956-03-14',
    datum_bis: '2025-04-26',
  },
  'Schöneberg': {
    id: 'poi_sws_schoeneberg',
    name: { de: 'Schöneberg', en: 'Schöneberg', fr: 'Schöneberg', pl: 'Schöneberg', ru: 'Шёнеберг', sv: 'Schöneberg' },
    kurztext: {
      de: 'Benannter Friedhofsbereich Schöneberg.',
      en: 'Named cemetery section Schöneberg.',
      fr: 'Secteur nommé du cimetière Schöneberg.',
      pl: 'Nazwany sektor cmentarza Schöneberg.',
      ru: 'Именованный участок кладбища «Шёнеберг».',
      sv: 'Namngiven kyrkogårdsdel Schöneberg.',
    },
  },
  'Schwedischer Friedhof': {
    id: 'poi_sws_schwedischer-friedhof',
    name: { de: 'Schwedischer Friedhof', en: 'Swedish Cemetery', fr: 'Cimetière suédois', pl: 'Cmentarz szwedzki', ru: 'Шведское кладбище', sv: 'Svenska kyrkogården' },
    kurztext: {
      de: 'Benannter Bereich Schwedischer Friedhof.',
      en: 'Named section Swedish Cemetery.',
      fr: 'Secteur nommé Cimetière suédois.',
      pl: 'Nazwany sektor Cmentarz szwedzki.',
      ru: 'Именованный участок «Шведское кладбище».',
      sv: 'Namngiven del Svenska kyrkogården.',
    },
  },
  'Schwesternblock': {
    id: 'poi_sws_schwesternblock',
    name: { de: 'Schwesternblock', en: 'Sisters’ Block', fr: 'Bloc des sœurs', pl: 'Kwatera sióstr', ru: 'Сестринский блок', sv: 'Systerblocket' },
    kurztext: {
      de: 'Benannter Friedhofsbereich Schwesternblock.',
      en: 'Named cemetery section Sisters’ Block.',
      fr: 'Secteur nommé du cimetière Bloc des sœurs.',
      pl: 'Nazwany sektor cmentarza Kwatera sióstr.',
      ru: 'Именованный участок кладбища «Сестринский блок».',
      sv: 'Namngiven kyrkogårdsdel Systerblocket.',
    },
  },
  'Trauerkapelle': {
    id: 'poi_sws_trauerkapelle',
    name: { de: 'Trauerkapelle', en: 'Funeral Chapel', fr: 'Chapelle funéraire', pl: 'Kaplica pogrzebowa', ru: 'Траурная капелла', sv: 'Sorgekapell' },
    kurztext: {
      de: 'Christliche Trauerkapelle auf dem Südwestkirchhof.',
      en: 'Christian funeral chapel on the South-Western Cemetery.',
      fr: 'Chapelle funéraire chrétienne du cimetière du Sud-Ouest.',
      pl: 'Chrześcijańska kaplica pogrzebowa na Cmentarzu Południowo-Zachodnim.',
      ru: 'Христианская траурная капелла на Юго-Западном кладбище.',
      sv: 'Kristet sorgkapell på Südwestkirchhof.',
    },
  },
  'Urnenhain I': {
    id: 'poi_sws_urnenhain-1',
    name: { de: 'Urnenhain I', en: 'Urn Grove I', fr: 'Jardin des urnes I', pl: 'Gaj urnowy I', ru: 'Урновая роща I', sv: 'Urnlund I' },
    kurztext: {
      de: 'Benannter Friedhofsbereich Urnenhain I.',
      en: 'Named cemetery section Urn Grove I.',
      fr: 'Secteur nommé du cimetière Jardin des urnes I.',
      pl: 'Nazwany sektor cmentarza Gaj urnowy I.',
      ru: 'Именованный участок кладбища «Урновая роща I».',
      sv: 'Namngiven kyrkogårdsdel Urnlund I.',
    },
  },
  'Urnenhain II': {
    id: 'poi_sws_urnenhain-2',
    name: { de: 'Urnenhain II', en: 'Urn Grove II', fr: 'Jardin des urnes II', pl: 'Gaj urnowy II', ru: 'Урновая роща II', sv: 'Urnlund II' },
    kurztext: {
      de: 'Benannter Friedhofsbereich Urnenhain II.',
      en: 'Named cemetery section Urn Grove II.',
      fr: 'Secteur nommé du cimetière Jardin des urnes II.',
      pl: 'Nazwany sektor cmentarza Gaj urnowy II.',
      ru: 'Именованный участок кладбища «Урновая роща II».',
      sv: 'Namngiven kyrkogårdsdel Urnlund II.',
    },
  },
};

const DESCRIPTION_TEMPLATES = {
  grab: {
    de: ({ name, source }) => `${name.de} ist eine in OpenStreetMap verzeichnete Grabstätte auf dem Südwestkirchhof Stahnsdorf. ${source}`,
    en: ({ name, source }) => `${name.en} is a grave recorded in OpenStreetMap on the South-Western Cemetery in Stahnsdorf. ${source}`,
    fr: ({ name, source }) => `${name.fr} est une tombe recensée dans OpenStreetMap au cimetière du Sud-Ouest à Stahnsdorf. ${source}`,
    pl: ({ name, source }) => `${name.pl} to grób odnotowany w OpenStreetMap na Cmentarzu Południowo-Zachodnim w Stahnsdorfie. ${source}`,
    ru: ({ name, source }) => `${name.ru} — могила, отмеченная в OpenStreetMap на Юго-Западном кладбище в Штансдорфе. ${source}`,
    sv: ({ name, source }) => `${name.sv} är en grav registrerad i OpenStreetMap på Südwestkirchhof i Stahnsdorf. ${source}`,
  },
  bereich: {
    de: ({ name, source }) => `${name.de} ist ein in OpenStreetMap verzeichneter Bereich des Südwestkirchhofs Stahnsdorf. ${source}`,
    en: ({ name, source }) => `${name.en} is a section of the South-Western Cemetery in Stahnsdorf recorded in OpenStreetMap. ${source}`,
    fr: ({ name, source }) => `${name.fr} est un secteur du cimetière du Sud-Ouest à Stahnsdorf recensé dans OpenStreetMap. ${source}`,
    pl: ({ name, source }) => `${name.pl} to sektor Cmentarza Południowo-Zachodniego w Stahnsdorfie odnotowany w OpenStreetMap. ${source}`,
    ru: ({ name, source }) => `${name.ru} — участок Юго-Западного кладбища в Штансдорфе, отмеченный в OpenStreetMap. ${source}`,
    sv: ({ name, source }) => `${name.sv} är en del av Südwestkirchhof i Stahnsdorf registrerad i OpenStreetMap. ${source}`,
  },
  denkmal: {
    de: ({ name, source }) => `${name.de} ist ein in OpenStreetMap verzeichnetes Denkmal beziehungsweise Kunstobjekt auf dem Südwestkirchhof Stahnsdorf. ${source}`,
    en: ({ name, source }) => `${name.en} is a memorial or artwork recorded in OpenStreetMap on the South-Western Cemetery in Stahnsdorf. ${source}`,
    fr: ({ name, source }) => `${name.fr} est un monument ou une œuvre recensé dans OpenStreetMap au cimetière du Sud-Ouest à Stahnsdorf. ${source}`,
    pl: ({ name, source }) => `${name.pl} to pomnik lub obiekt artystyczny odnotowany w OpenStreetMap na Cmentarzu Południowo-Zachodnim w Stahnsdorfie. ${source}`,
    ru: ({ name, source }) => `${name.ru} — памятник или художественный объект, отмеченный в OpenStreetMap на Юго-Западном кладбище в Штансдорфе. ${source}`,
    sv: ({ name, source }) => `${name.sv} är ett minnesmärke eller konstverk registrerat i OpenStreetMap på Südwestkirchhof i Stahnsdorf. ${source}`,
  },
  gedenkanlage: {
    de: ({ name, source }) => `${name.de} ist eine in OpenStreetMap verzeichnete Gedenkanlage auf dem Südwestkirchhof Stahnsdorf. ${source}`,
    en: ({ name, source }) => `${name.en} is a memorial site recorded in OpenStreetMap on the South-Western Cemetery in Stahnsdorf. ${source}`,
    fr: ({ name, source }) => `${name.fr} est un mémorial recensé dans OpenStreetMap au cimetière du Sud-Ouest à Stahnsdorf. ${source}`,
    pl: ({ name, source }) => `${name.pl} to miejsce pamięci odnotowane w OpenStreetMap na Cmentarzu Południowo-Zachodnim w Stahnsdorfie. ${source}`,
    ru: ({ name, source }) => `${name.ru} — мемориальный объект, отмеченный в OpenStreetMap на Юго-Западном кладбище в Штансдорфе. ${source}`,
    sv: ({ name, source }) => `${name.sv} är en minnesanläggning registrerad i OpenStreetMap på Südwestkirchhof i Stahnsdorf. ${source}`,
  },
  bauwerk: {
    de: ({ name, source }) => `${name.de} ist ein in OpenStreetMap verzeichnetes Bauwerk auf dem Südwestkirchhof Stahnsdorf. ${source}`,
    en: ({ name, source }) => `${name.en} is a structure recorded in OpenStreetMap on the South-Western Cemetery in Stahnsdorf. ${source}`,
    fr: ({ name, source }) => `${name.fr} est un bâtiment recensé dans OpenStreetMap au cimetière du Sud-Ouest à Stahnsdorf. ${source}`,
    pl: ({ name, source }) => `${name.pl} to budowla odnotowana w OpenStreetMap na Cmentarzu Południowo-Zachodnim w Stahnsdorfie. ${source}`,
    ru: ({ name, source }) => `${name.ru} — сооружение, отмеченное в OpenStreetMap на Юго-Западном кладбище в Штансдорфе. ${source}`,
    sv: ({ name, source }) => `${name.sv} är en byggnad registrerad i OpenStreetMap på Südwestkirchhof i Stahnsdorf. ${source}`,
  },
};

function sourceTextByLang() {
  return {
    de: 'Die Angaben wurden aus OpenStreetMap übernommen.',
    en: 'The information was taken from OpenStreetMap.',
    fr: 'Les informations proviennent d’OpenStreetMap.',
    pl: 'Informacje pochodzą z OpenStreetMap.',
    ru: 'Сведения взяты из OpenStreetMap.',
    sv: 'Uppgifterna har hämtats från OpenStreetMap.',
  };
}

function buildDescription(typ, name) {
  const sources = sourceTextByLang();
  const templates = DESCRIPTION_TEMPLATES[typ] ?? DESCRIPTION_TEMPLATES.bereich;
  return Object.fromEntries(Object.keys(sources).map((lang) => [
    lang,
    templates[lang]({ name, source: sources[lang] }),
  ]));
}

function sourceLine(candidate) {
  const bits = [
    `OpenStreetMap: ${candidate.osm.type} ${candidate.osm.id}`,
    candidate.osm.url,
  ];
  if (candidate.osm.version) bits.push(`Version ${candidate.osm.version}`);
  if (candidate.osm.timestamp) bits.push(`Stand ${formatOSMTimestamp(candidate.osm.timestamp)}`);
  return bits.join(', ');
}

function formatOSMTimestamp(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/);
  if (!match) return value;
  const [, year, month, day, hour, minute, second] = match;
  return `${day}.${month}.${year}, ${hour}:${minute}:${second} UTC`;
}

function coordinateSource(candidate, fetchedAt) {
  return {
    typ: 'osm',
    beleg: `OpenStreetMap: ${candidate.osm.type} ${candidate.osm.id}`,
    datum: fetchedAt,
    genauigkeit: 'hoch',
  };
}

function wikipediaTagToUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const match = value.match(/^([a-z-]+):(.+)$/i);
  if (!match) return null;
  const [, lang, title] = match;
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
}

function appendNote(note = '', addition) {
  if (!addition || note.includes(addition)) return note;
  return note ? `${note} ${addition}` : addition;
}

function appendSourceArchive(note = '', source) {
  if (!source || note.includes(source)) return note;
  const trimmed = note.trimEnd();
  if (trimmed.includes('\nQuellenarchiv:') || trimmed.startsWith('Quellenarchiv:')) {
    return `${trimmed}\n- ${source}`;
  }
  return `${trimmed}${trimmed ? '\n\n' : ''}Quellenarchiv:\n- ${source}`;
}

function appendOSMProvenance(note, candidate) {
  const withCoordinateNote = appendNote(
    note,
    `OSM-Koordinate übernommen (${candidate.osm.type} ${candidate.osm.id}).`,
  );
  return appendSourceArchive(withCoordinateNote, sourceLine(candidate));
}

function createNewPOI(candidate, { fetchedAt, timestamp }) {
  const details = NEW_POI_DETAILS[candidate.name];
  if (!details) {
    throw new Error(`Missing editorial details for new OSM candidate: ${candidate.name}`);
  }

  const wikipediaUrl =
    details.wikipedia_url ??
    candidate.osm.wikipediaUrl ??
    wikipediaTagToUrl(candidate.osm.tags?.['buried:wikipedia']) ??
    null;

  return {
    id: details.id,
    typ: candidate.typ,
    name: details.name,
    koordinaten: candidate.koordinaten,
    koordinaten_quelle: coordinateSource(candidate, fetchedAt),
    kurztext: details.kurztext,
    beschreibung: buildDescription(candidate.typ, details.name),
    datum_von: details.datum_von ?? null,
    datum_bis: details.datum_bis ?? null,
    wikipedia_url: wikipediaUrl,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'bestätigt',
    notiz: appendSourceArchive(
      `Aus OpenStreetMap übernommen. OSM-Tags: ${JSON.stringify(candidate.osm.tags)}`,
      sourceLine(candidate),
    ),
    publish_status: 'veröffentlicht',
    erstellt_von: 'system',
    geaendert_von: 'system',
    erstellt_am: timestamp,
    geaendert_am: timestamp,
  };
}

export function applyOSMAuditToBackup(backup, audit, options = {}) {
  const fetchedAt = options.fetchedAt ?? DEFAULT_FETCHED_AT;
  const timestamp = options.timestamp ?? DEFAULT_TIMESTAMP;
  const result = structuredClone(backup);
  const poiById = new Map(result.pois.map((poi) => [poi.id, poi]));

  for (const candidate of selectExistingCandidates(audit.candidates)) {
    const poi = poiById.get(candidate.match.existing_poi_id);
    if (!poi) continue;
    poi.koordinaten = candidate.koordinaten;
    poi.koordinaten_quelle = coordinateSource(candidate, fetchedAt);
    poi.status = 'bestätigt';
    poi.notiz = appendOSMProvenance(poi.notiz ?? '', candidate);
    if ('geaendert_am' in poi) poi.geaendert_am = timestamp;
  }

  const existingIds = new Set(result.pois.map((poi) => poi.id));
  const newCandidates = audit.candidates.filter((candidate) => candidate.match?.kind === 'new');
  for (const candidate of newCandidates) {
    const poi = createNewPOI(candidate, { fetchedAt, timestamp });
    if (existingIds.has(poi.id)) {
      const existing = poiById.get(poi.id);
      Object.assign(existing, {
        koordinaten: poi.koordinaten,
        koordinaten_quelle: poi.koordinaten_quelle,
        notiz: appendOSMProvenance(existing.notiz ?? '', candidate),
        status: 'bestätigt',
        publish_status: existing.publish_status ?? 'veröffentlicht',
        geaendert_am: timestamp,
      });
      continue;
    }
    existingIds.add(poi.id);
    poiById.set(poi.id, poi);
    result.pois.push(poi);
  }

  result._timestamp = timestamp;
  return result;
}

function selectExistingCandidates(candidates) {
  const bestByPoi = new Map();
  for (const candidate of candidates) {
    if (candidate.match?.kind !== 'existing') continue;
    const id = candidate.match.existing_poi_id;
    const current = bestByPoi.get(id);
    if (!current || candidateScore(candidate) > candidateScore(current)) {
      bestByPoi.set(id, candidate);
    }
  }
  return [...bestByPoi.values()];
}

function candidateScore(candidate) {
  const tags = candidate.osm?.tags ?? {};
  let score = Object.keys(tags).length;
  if (tags['buried:wikipedia'] || tags.wikipedia) score += 100;
  if (tags['buried:wikidata'] || tags.wikidata) score += 80;
  if (tags.inscription) score += 30;
  if (tags.description || tags.note) score += 10;
  return score;
}

function parseArgs(argv) {
  const args = {
    backup: DEFAULT_BACKUP,
    audit: DEFAULT_AUDIT,
    fetchedAt: DEFAULT_FETCHED_AT,
    timestamp: DEFAULT_TIMESTAMP,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--backup') args.backup = argv[++index];
    else if (arg === '--audit') args.audit = argv[++index];
    else if (arg === '--fetched-at') args.fetchedAt = argv[++index];
    else if (arg === '--timestamp') args.timestamp = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const backupPath = path.resolve(args.backup);
  const auditPath = path.resolve(args.audit);
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const updated = applyOSMAuditToBackup(backup, audit, args);
  fs.writeFileSync(backupPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  console.log(`Updated ${backupPath}`);
  console.log(`POIs: ${backup.pois.length} -> ${updated.pois.length}`);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main();
}
