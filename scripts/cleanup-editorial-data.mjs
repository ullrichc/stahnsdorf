import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BACKUP = 'data/stahnsdorf-backup-translated.json';
const CEMETERY_WIKIPEDIA_URL = 'https://de.wikipedia.org/wiki/S%C3%BCdwestkirchhof_Stahnsdorf';

export const COLLECTION_DESCRIPTIONS = {
  'collection_sws_architektur-und-anlage': {
    de: 'Holzkapellen, Hauptzugang, Christusdenkmal und Mausoleen prägen den Charakter des Waldfriedhofs. Seine Planer verbanden Architektur und Landschaft zu einem besonderen Ensemble.',
    en: 'Timber chapels, the main entrance, the Christ monument and mausoleums shape the character of the woodland cemetery. Its planners combined architecture and landscape into a distinctive ensemble.',
    fr: 'Les chapelles en bois, l’entrée principale, le monument du Christ et les mausolées façonnent le caractère du cimetière forestier. Ses concepteurs ont uni architecture et paysage en un ensemble singulier.',
    pl: 'Drewniane kaplice, główne wejście, pomnik Chrystusa i mauzolea kształtują charakter leśnego cmentarza. Jego projektanci połączyli architekturę i krajobraz w wyjątkowy zespół.',
    ru: 'Деревянные часовни, главный вход, памятник Христу и мавзолеи формируют облик лесного кладбища. Его создатели объединили архитектуру и ландшафт в выразительный ансамбль.',
    sv: 'Träkapellen, huvudentrén, Kristusmonumentet och mausoleerna präglar skogskyrkogårdens karaktär. Planerarna förenade arkitektur och landskap till en särpräglad helhet.',
  },
  'collection_sws_friedhofsgeschichte-und-bestattungskultur': {
    de: 'Alte und Neue Umbettung, Urnenhaine, besondere Blöcke und neuere Bestattungsformen veranschaulichen den Wandel vom Berliner Zentralfriedhof zum heutigen Erinnerungs- und Bestattungsort.',
    en: 'The Old and New Reinterment sections, urn groves, distinctive burial blocks and newer forms of burial illustrate the transition from a Berlin central cemetery to today’s place of remembrance and burial.',
    fr: 'Les anciennes et nouvelles zones de réinhumation, les bosquets d’urnes, les secteurs particuliers et les formes funéraires récentes illustrent le passage d’un cimetière central berlinois au lieu actuel de mémoire et d’inhumation.',
    pl: 'Stare i Nowe Kwatery Przeniesionych Grobów, gaje urnowe, szczególne sektory i nowsze formy pochówku ukazują przemianę berlińskiego cmentarza centralnego we współczesne miejsce pamięci i pochówku.',
    ru: 'Старый и Новый участки перезахоронений, урновые рощи, особые кварталы и новые формы погребения показывают путь от берлинского центрального кладбища к современному месту памяти и захоронения.',
    sv: 'Gamla och Nya återbegravningsområdet, urnlundar, särskilda kvarter och nyare gravskick visar utvecklingen från Berlins centralkyrkogård till dagens minnes- och begravningsplats.',
  },
  'collection_sws_kriegsgedenken-und-internationale-graeberstaetten': {
    de: 'Britische und italienische Gräberstätten, deutsche Ehrenbereiche und Gedenkanlagen erinnern an Kriegstote und Opfer von Gewaltherrschaft. Ihre unterschiedlichen Formen spiegeln den Wandel des Gedenkens im 20. Jahrhundert.',
    en: 'British and Italian war cemeteries, German fields of honour and memorial sites commemorate the war dead and victims of tyranny. Their different forms reflect changes in remembrance during the twentieth century.',
    fr: 'Les cimetières militaires britanniques et italiens, les carrés d’honneur allemands et les mémoriaux commémorent les morts de guerre et les victimes de la tyrannie. Leurs formes diverses reflètent l’évolution de la mémoire au XXe siècle.',
    pl: 'Brytyjskie i włoskie cmentarze wojenne, niemieckie kwatery honorowe oraz miejsca pamięci upamiętniają poległych i ofiary przemocy państwowej. Ich różne formy odzwierciedlają przemiany pamięci w XX wieku.',
    ru: 'Британские и итальянские воинские захоронения, немецкие почётные участки и мемориалы напоминают о погибших на войне и жертвах тирании. Их разные формы отражают изменения культуры памяти в XX веке.',
    sv: 'Brittiska och italienska krigskyrkogårdar, tyska hederskvarter och minnesplatser hedrar krigsdöda och offer för förtryck. Deras olika former speglar hur minneskulturen förändrades under 1900-talet.',
  },
  'collection_sws_widerstand-verfolgung-und-ns-zeit': {
    de: 'Lebenswege von Verfolgten und Menschen des politischen Widerstands machen die Gewalt der nationalsozialistischen Herrschaft und ihre Folgen sichtbar. Gedenkorte bewahren die Erinnerung an ihre Opfer.',
    en: 'The lives of persecuted people and members of the political resistance reveal the violence of Nazi rule and its consequences. Memorial sites preserve the memory of its victims.',
    fr: 'Les parcours de personnes persécutées et de membres de la résistance politique rendent visibles la violence du régime national-socialiste et ses conséquences. Les lieux commémoratifs préservent la mémoire de ses victimes.',
    pl: 'Losy osób prześladowanych i uczestników oporu politycznego ukazują przemoc rządów narodowosocjalistycznych oraz jej następstwa. Miejsca pamięci zachowują pamięć o ofiarach.',
    ru: 'Судьбы преследуемых и участников политического сопротивления показывают насилие национал-социалистического режима и его последствия. Мемориальные места сохраняют память о жертвах.',
    sv: 'Förföljdas och politiska motståndskämpars livsöden synliggör naziregimens våld och följder. Minnesplatser bevarar minnet av dess offer.',
  },
  'collection_sws_politik-staat-und-militaer': {
    de: 'Militärs, Minister, Beamte und politische Akteure stehen für Brüche und Kontinuitäten vom Kaiserreich über die Weimarer Republik und den Nationalsozialismus bis in die Bundesrepublik.',
    en: 'Military officers, ministers, civil servants and political figures embody ruptures and continuities from the German Empire through the Weimar Republic and National Socialism to the Federal Republic.',
    fr: 'Militaires, ministres, fonctionnaires et acteurs politiques incarnent les ruptures et les continuités de l’Empire allemand à la République fédérale, en passant par Weimar et le national-socialisme.',
    pl: 'Wojskowi, ministrowie, urzędnicy i działacze polityczni ukazują zerwania i ciągłości od Cesarstwa Niemieckiego przez Republikę Weimarską i narodowy socjalizm po Republikę Federalną.',
    ru: 'Военные, министры, государственные служащие и политические деятели олицетворяют разрывы и преемственность от Германской империи через Веймарскую республику и национал-социализм до Федеративной Республики.',
    sv: 'Militärer, ministrar, ämbetsmän och politiska aktörer speglar brott och kontinuiteter från kejsardömet via Weimarrepubliken och nationalsocialismen till Förbundsrepubliken.',
  },
  'collection_sws_film-fernsehen-und-synchronkultur': {
    de: 'Regisseure, Schauspieler, Synchronstimmen und Filmschaffende stehen für Film- und Fernsehgeschichte von der Stummfilmzeit über die DEFA bis zur Gegenwart.',
    en: 'Directors, actors, dubbing voices and filmmakers represent the history of film and television from the silent era and DEFA to the present day.',
    fr: 'Réalisateurs, comédiens, voix de doublage et professionnels du cinéma retracent l’histoire du cinéma et de la télévision, du muet et de la DEFA jusqu’à nos jours.',
    pl: 'Reżyserzy, aktorzy, artyści dubbingowi i filmowcy reprezentują historię filmu i telewizji od kina niemego i DEFA po współczesność.',
    ru: 'Режиссёры, актёры, мастера дубляжа и кинематографисты представляют историю кино и телевидения от немого фильма и студии DEFA до современности.',
    sv: 'Regissörer, skådespelare, dubbningsröster och filmskapare representerar film- och tv-historia från stumfilmstiden och DEFA till nutiden.',
  },
  'collection_sws_buehne-variete-und-unterhaltung': {
    de: 'Schauspiel, Theaterleitung, Varieté, Zirkus und Show erzählen von der Entwicklung populärer Unterhaltung und ihrem Einfluss auf Stadt- und Medienkultur.',
    en: 'Acting, theatre management, variety, circus and show business trace the development of popular entertainment and its influence on urban and media culture.',
    fr: 'Le jeu théâtral, la direction de théâtre, les variétés, le cirque et le spectacle racontent l’évolution du divertissement populaire et son influence sur la culture urbaine et médiatique.',
    pl: 'Aktorstwo, kierowanie teatrem, variété, cyrk i widowisko opowiadają o rozwoju popularnej rozrywki oraz jej wpływie na kulturę miejską i medialną.',
    ru: 'Актёрское искусство, руководство театрами, варьете, цирк и шоу рассказывают о развитии массовых развлечений и их влиянии на городскую и медиакультуру.',
    sv: 'Skådespeleri, teaterledning, varieté, cirkus och show skildrar den populära underhållningens utveckling och dess inflytande på stads- och mediekulturen.',
  },
  'collection_sws_musik-und-oper': {
    de: 'Komponisten, Sängerinnen und Sänger sowie Kirchenmusiker stehen für die große Spannweite musikalischer Kultur zwischen Opernbühne, Konzertsaal und Kirche.',
    en: 'Composers, singers and church musicians represent the breadth of musical culture across the opera stage, concert hall and church.',
    fr: 'Compositeurs, chanteuses, chanteurs et musiciens d’église témoignent de l’ampleur de la culture musicale entre scène lyrique, salle de concert et église.',
    pl: 'Kompozytorzy, śpiewaczki, śpiewacy i muzycy kościelni ukazują szeroki zakres kultury muzycznej między sceną operową, salą koncertową a kościołem.',
    ru: 'Композиторы, певицы, певцы и церковные музыканты представляют широкую панораму музыкальной культуры между оперной сценой, концертным залом и церковью.',
    sv: 'Kompositörer, sångare och kyrkomusiker representerar musiklivets stora bredd mellan operascen, konsertsal och kyrka.',
  },
  'collection_sws_literatur-presse-und-sprache': {
    de: 'Schriftsteller, Verleger, Journalisten und Sprachforscher prägten Literatur, Presse und Sprachvermittlung vom 19. Jahrhundert bis in die Moderne.',
    en: 'Writers, publishers, journalists and linguists shaped literature, the press and language education from the nineteenth century into the modern era.',
    fr: 'Écrivains, éditeurs, journalistes et linguistes ont marqué la littérature, la presse et la transmission des langues du XIXe siècle à l’époque moderne.',
    pl: 'Pisarze, wydawcy, dziennikarze i językoznawcy kształtowali literaturę, prasę oraz nauczanie języków od XIX wieku po czasy nowoczesne.',
    ru: 'Писатели, издатели, журналисты и языковеды формировали литературу, прессу и языковое образование с XIX века до эпохи модерна.',
    sv: 'Författare, förläggare, journalister och språkforskare formade litteratur, press och språkförmedling från 1800-talet in i modern tid.',
  },
  'collection_sws_bildende-kunst-fotografie-und-grabkunst': {
    de: 'Malerei, Grafik, Fotografie, Skulptur und Grabkunst begegnen sich in Künstlerbiografien, Denkmälern und besonders gestalteten Grabstätten.',
    en: 'Painting, graphic art, photography, sculpture and funerary art meet in artists’ lives, monuments and exceptionally designed graves.',
    fr: 'Peinture, arts graphiques, photographie, sculpture et art funéraire se rencontrent dans les parcours d’artistes, les monuments et les sépultures particulièrement travaillées.',
    pl: 'Malarstwo, grafika, fotografia, rzeźba i sztuka sepulkralna spotykają się w biografiach artystów, pomnikach i wyjątkowo zaprojektowanych grobach.',
    ru: 'Живопись, графика, фотография, скульптура и надгробное искусство соединяются в биографиях художников, памятниках и особо оформленных захоронениях.',
    sv: 'Måleri, grafik, fotografi, skulptur och gravkonst möts i konstnärsliv, monument och särskilt gestaltade gravplatser.',
  },
  'collection_sws_wissenschaft-und-forschung': {
    de: 'Ethnologie, Geographie, Naturschutz, Medizin, Sprachwissenschaft, Kunstgeschichte und Technikgeschichte belegen die wissenschaftliche Vielfalt der hier bestatteten Forscher und Gelehrten.',
    en: 'Ethnology, geography, nature conservation, medicine, linguistics, art history and the history of technology demonstrate the scholarly diversity of the researchers and academics buried here.',
    fr: 'Ethnologie, géographie, protection de la nature, médecine, linguistique, histoire de l’art et histoire des techniques témoignent de la diversité scientifique des chercheurs et savants inhumés ici.',
    pl: 'Etnologia, geografia, ochrona przyrody, medycyna, językoznawstwo, historia sztuki i historia techniki ukazują naukową różnorodność pochowanych tu badaczy i uczonych.',
    ru: 'Этнология, география, охрана природы, медицина, языкознание, история искусства и техники показывают научное многообразие похороненных здесь исследователей и учёных.',
    sv: 'Etnologi, geografi, naturskydd, medicin, språkvetenskap, konsthistoria och teknikhistoria visar den vetenskapliga bredden bland de forskare och lärda som är begravda här.',
  },
  'collection_sws_technik-industrie-und-verkehr': {
    de: 'Elektrotechnik, Funk, Flugzeug- und Automobilbau, Fernsehtechnik und Ingenieurwesen stehen für industrielle Entwicklung und technische Innovation.',
    en: 'Electrical engineering, radio, aircraft and automobile construction, television technology and engineering represent industrial development and technical innovation.',
    fr: 'Électrotechnique, radio, construction aéronautique et automobile, télévision et ingénierie témoignent du développement industriel et de l’innovation technique.',
    pl: 'Elektrotechnika, radio, budowa samolotów i samochodów, technika telewizyjna oraz inżynieria reprezentują rozwój przemysłowy i innowacje techniczne.',
    ru: 'Электротехника, радио, авиа- и автомобилестроение, телевизионная техника и инженерное дело представляют промышленное развитие и технические инновации.',
    sv: 'Elektroteknik, radio, flygplans- och biltillverkning, televisionsteknik och ingenjörskonst representerar industriell utveckling och teknisk innovation.',
  },
};

export function cleanupPoiSources(poi) {
  const archiveEntries = [];
  const cleanedSources = [];

  for (const source of poi.quellen ?? []) {
    const removeFromSources = /Grabstättenplan, Südwestkirchhof Stahnsdorf/i.test(source)
      || /Manuelle GPS-Erfassung via OsmAnd/i.test(source)
      || /OpenStreetMap|openstreetmap\.org/i.test(source);
    const hasFetchedDate = /abgerufen\s+\d{4}-\d{2}-\d{2}/i.test(source);

    if (removeFromSources || hasFetchedDate) {
      archiveEntries.push(`- ${formatArchivedSource(source)}`);
    }
    if (removeFromSources) continue;

    let cleaned = source
      .replace(/\s*,?\s*abgerufen\s+\d{4}-\d{2}-\d{2}/gi, '')
      .replace(/[\s,;]+$/, '');
    cleaned = formatSourceDates(cleaned);

    cleaned = normalizeNamedUrlSource(normalizeWikipediaSource(cleaned));

    if (cleaned && !cleanedSources.includes(cleaned)) cleanedSources.push(cleaned);
  }

  return {
    ...poi,
    quellen: cleanedSources,
    notiz: appendSourceArchive(poi.notiz ?? '', archiveEntries),
  };
}

function normalizeNamedUrlSource(source) {
  if (/^\[[^\]]+]\(https?:\/\/[^\s)]+\)$/.test(source)) return source;

  const match = source.match(/^(.+?)[,;]\s*(https?:\/\/\S+)$/);
  if (!match) return source;

  return `[${match[1].trim()}](${match[2]})`;
}

function normalizeWikipediaSource(source) {
  if (/^\[[^\]]+]\(https?:\/\/[^\s)]+\)$/.test(source)) return source;

  const prefixed = source.match(/^Wikipedia:\s*(.+?),\s*(https?:\/\/(?:[a-z]+\.)?wikipedia\.org\/wiki\/\S+)$/i);
  if (prefixed) return `[${prefixed[1]}, Wikipedia](${prefixed[2]})`;

  const suffixed = source.match(/^(.+?),\s*Wikipedia,\s*(https?:\/\/(?:[a-z]+\.)?wikipedia\.org\/wiki\/\S+)$/i);
  if (suffixed) return `[${suffixed[1]}, Wikipedia](${suffixed[2]})`;

  if (/Südwestkirchhof Stahnsdorf/i.test(source) && /Wikipedia/i.test(source)) {
    return `[Südwestkirchhof Stahnsdorf, Wikipedia](${CEMETERY_WIKIPEDIA_URL})`;
  }

  return source;
}

export function cleanupEditorialData(backup) {
  return {
    ...backup,
    pois: (backup.pois ?? []).map(cleanupPoiSources),
    collections: (backup.collections ?? []).map((collection) => ({
      ...collection,
      beschreibung: COLLECTION_DESCRIPTIONS[collection.id] ?? collection.beschreibung,
    })),
  };
}

function formatArchivedSource(source) {
  return formatSourceDates(source.replace(
    /\s*,?\s*abgerufen\s+(\d{4})-(\d{2})-(\d{2})/gi,
    (_match, year, month, day) => `; Abrufdatum: ${day}.${month}.${year}`,
  ));
}

function formatSourceDates(source) {
  return source.replace(
    /Stand\s+(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z/g,
    (_match, year, month, day, hour, minute, second) =>
      `Stand ${day}.${month}.${year}, ${hour}:${minute}:${second} UTC`,
  );
}

function appendSourceArchive(note, entries) {
  const archivedEntries = new Set(
    note.split(/\r?\n/)
      .map(normalizeArchivedSource)
      .filter(Boolean),
  );
  const uniqueEntries = [...new Set(entries)].filter((entry) => (
    !archivedEntries.has(normalizeArchivedSource(entry))
  ));
  if (uniqueEntries.length === 0) return note;

  const trimmed = note.trimEnd();
  if (trimmed.includes('\nQuellenarchiv:') || trimmed.startsWith('Quellenarchiv:')) {
    return `${trimmed}\n${uniqueEntries.join('\n')}`;
  }
  return `${trimmed}${trimmed ? '\n\n' : ''}Quellenarchiv:\n${uniqueEntries.join('\n')}`;
}

function normalizeArchivedSource(source) {
  return source
    .replace(/^\s*-\s*/, '')
    .replace(/;\s*Abrufdatum:\s*\d{2}\.\d{2}\.\d{4}\s*$/i, '')
    .trim();
}

function parseArgs(argv) {
  const args = { backup: DEFAULT_BACKUP };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--backup') args.backup = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return args;
}

function main() {
  const { backup } = parseArgs(process.argv.slice(2));
  const backupPath = path.resolve(backup);
  const current = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const cleaned = cleanupEditorialData(current);
  fs.writeFileSync(backupPath, `${JSON.stringify(cleaned, null, 2)}\n`, 'utf8');
  console.log(`Updated ${backupPath}`);
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main();
}
