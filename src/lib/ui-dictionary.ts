import type { SupportedLocale } from './LocaleContext'

export type UIDictionary = {
  // Settings / Language
  settingsTitle: string
  languageLabel: string
  
  // Navigation
  navMap: string
  navCollections: string
  navInfo: string
  navSettings: string
  back: string
  
  // Map View
  searchPlaceholder: string
  
  // Collections List
  collectionsTitle: string
  collectionsSubtitle: string
  sitesCount: string
  nearest: string
  away: string
  
  // POI Card
  typeGrab: string
  typeBauwerk: string
  typeBereich: string
  typeDenkmal: string
  typeMausoleum: string
  typeGedenkanlage: string
  learnMore: string
  sources: string
}

export const ui: Record<SupportedLocale, UIDictionary> = {
  de: {
    settingsTitle: 'Optionen',
    languageLabel: 'Sprache',
    navMap: 'Karte',
    navCollections: 'Sammlungen',
    navInfo: 'Info',
    navSettings: 'Optionen',
    back: 'Zurück',
    searchPlaceholder: 'Namen suchen...',
    collectionsTitle: 'Sammlungen',
    collectionsSubtitle: 'Thematische Pfade durch das Flächendenkmal.',
    sitesCount: 'Orte',
    nearest: 'Nächstes:',
    away: 'entfernt',
    typeGrab: 'Grabstätte',
    typeBauwerk: 'Bauwerk',
    typeBereich: 'Bereich',
    typeDenkmal: 'Denkmal',
    typeMausoleum: 'Mausoleum',
    typeGedenkanlage: 'Gedenkanlage',
    learnMore: 'Mehr erfahren',
    sources: 'Quellen'
  },
  en: {
    settingsTitle: 'Settings',
    languageLabel: 'Language',
    navMap: 'Map',
    navCollections: 'Collections',
    navInfo: 'Info',
    navSettings: 'Settings',
    back: 'Back',
    searchPlaceholder: 'Search names...',
    collectionsTitle: 'Collections',
    collectionsSubtitle: 'Thematic trails through the heritage site.',
    sitesCount: 'sites',
    nearest: 'Nearest:',
    away: 'away',
    typeGrab: 'Grave',
    typeBauwerk: 'Building',
    typeBereich: 'Section',
    typeDenkmal: 'Memorial',
    typeMausoleum: 'Mausoleum',
    typeGedenkanlage: 'Memorial site',
    learnMore: 'Learn more',
    sources: 'Sources'
  },
  fr: {
    settingsTitle: 'Options',
    languageLabel: 'Langue',
    navMap: 'Carte',
    navCollections: 'Collections',
    navInfo: 'Info',
    navSettings: 'Options',
    back: 'Retour',
    searchPlaceholder: 'Rechercher des noms...',
    collectionsTitle: 'Collections',
    collectionsSubtitle: 'Parcours thématiques à travers le site.',
    sitesCount: 'sites',
    nearest: 'Plus proche :',
    away: 'de distance',
    typeGrab: 'Tombe',
    typeBauwerk: 'Bâtiment',
    typeBereich: 'Section',
    typeDenkmal: 'Mémorial',
    typeMausoleum: 'Mausolée',
    typeGedenkanlage: 'Lieu de mémoire',
    learnMore: 'En savoir plus',
    sources: 'Sources'
  },
  pl: {
    settingsTitle: 'Ustawienia',
    languageLabel: 'Język',
    navMap: 'Mapa',
    navCollections: 'Kolekcje',
    navInfo: 'Info',
    navSettings: 'Opcje',
    back: 'Wróć',
    searchPlaceholder: 'Szukaj imion...',
    collectionsTitle: 'Kolekcje',
    collectionsSubtitle: 'Ścieżki tematyczne przez teren cmentarza.',
    sitesCount: 'miejsc',
    nearest: 'Najbliższe:',
    away: 'stąd',
    typeGrab: 'Grób',
    typeBauwerk: 'Budowla',
    typeBereich: 'Sekcja',
    typeDenkmal: 'Pomnik',
    typeMausoleum: 'Mauzoleum',
    typeGedenkanlage: 'Miejsce pamięci',
    learnMore: 'Dowiedz się więcej',
    sources: 'Źródła'
  },
  ru: {
    settingsTitle: 'Настройки',
    languageLabel: 'Язык',
    navMap: 'Карта',
    navCollections: 'Коллекции',
    navInfo: 'Инфо',
    navSettings: 'Опции',
    back: 'Назад',
    searchPlaceholder: 'Поиск имен...',
    collectionsTitle: 'Коллекции',
    collectionsSubtitle: 'Тематические маршруты по территории памятника.',
    sitesCount: 'мест',
    nearest: 'Ближайшее:',
    away: 'от вас',
    typeGrab: 'Могила',
    typeBauwerk: 'Сооружение',
    typeBereich: 'Участок',
    typeDenkmal: 'Памятник',
    typeMausoleum: 'Мавзолей',
    typeGedenkanlage: 'Мемориал',
    learnMore: 'Узнать больше',
    sources: 'Источники'
  },
  sv: {
    settingsTitle: 'Inställningar',
    languageLabel: 'Språk',
    navMap: 'Karta',
    navCollections: 'Samlingar',
    navInfo: 'Info',
    navSettings: 'Alternativ',
    back: 'Tillbaka',
    searchPlaceholder: 'Sök namn...',
    collectionsTitle: 'Samlingar',
    collectionsSubtitle: 'Tematiska spår över kulturarvsplatsen.',
    sitesCount: 'platser',
    nearest: 'Närmaste:',
    away: 'bort',
    typeGrab: 'Grav',
    typeBauwerk: 'Byggnad',
    typeBereich: 'Sektion',
    typeDenkmal: 'Minnesmärke',
    typeMausoleum: 'Mausoleum',
    typeGedenkanlage: 'Minnesplats',
    learnMore: 'Läs mer',
    sources: 'Källor'
  }
}

export function useDictionary(locale: SupportedLocale): UIDictionary {
  return ui[locale] || ui.de
}
