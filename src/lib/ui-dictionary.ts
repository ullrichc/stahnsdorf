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
}

export const ui: Record<SupportedLocale, UIDictionary> = {
  de: {
    settingsTitle: 'Optionen',
    languageLabel: 'Sprache',
    navMap: 'Karte',
    navCollections: 'Sammlungen',
    navInfo: 'Info',
    navSettings: 'Optionen',
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
    learnMore: 'Mehr erfahren'
  },
  en: {
    settingsTitle: 'Settings',
    languageLabel: 'Language',
    navMap: 'Map',
    navCollections: 'Collections',
    navInfo: 'Info',
    navSettings: 'Settings',
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
    learnMore: 'Learn more'
  },
  fr: {
    settingsTitle: 'Options',
    languageLabel: 'Langue',
    navMap: 'Carte',
    navCollections: 'Collections',
    navInfo: 'Info',
    navSettings: 'Options',
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
    learnMore: 'En savoir plus'
  },
  pl: {
    settingsTitle: 'Ustawienia',
    languageLabel: 'Język',
    navMap: 'Mapa',
    navCollections: 'Kolekcje',
    navInfo: 'Info',
    navSettings: 'Opcje',
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
    learnMore: 'Dowiedz się więcej'
  },
  ru: {
    settingsTitle: 'Настройки',
    languageLabel: 'Язык',
    navMap: 'Карта',
    navCollections: 'Коллекции',
    navInfo: 'Инфо',
    navSettings: 'Опции',
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
    learnMore: 'Узнать больше'
  },
  sv: {
    settingsTitle: 'Inställningar',
    languageLabel: 'Språk',
    navMap: 'Karta',
    navCollections: 'Samlingar',
    navInfo: 'Info',
    navSettings: 'Alternativ',
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
    learnMore: 'Läs mer'
  }
}

export function useDictionary(locale: SupportedLocale): UIDictionary {
  return ui[locale] || ui.de
}
