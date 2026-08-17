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
  mapLoading: string
  locate: string
  locationError: string
  locationUnavailable: string
  currentLocation: string
  showOnMap: string
  
  // Collections List
  collectionsTitle: string
  collectionsSubtitle: string
  sitesCount: string
  nearest: string
  away: string
  loadingEntry: string
  loadingCollection: string
  loadingCollections: string
  notFoundTitle: string
  pageNotFoundBody: string
  redirecting: string
  poiNotFound: string
  collectionNotFound: string
  loadErrorTitle: string
  loadErrorBody: string
  retry: string
  backToMap: string
  backToCollections: string
  collectionPlaces: string
  collectionMap: string
  
  // POI Card
  typeGrab: string
  typeBauwerk: string
  typeBereich: string
  typeDenkmal: string
  typeMausoleum: string
  typeGedenkanlage: string
  locationHint: string
  learnMore: string
  dateRange: string
  dateBorn: string
  dateDied: string
  dateBuilt: string
  dateCreated: string
  dateUntil: string
  sources: string
  poiFeedbackText: string
  poiFeedbackLink: string
  close: string
  enlargeImage: string
  imageViewer: string
  previousImage: string
  nextImage: string
  zoomOut: string
  resetView: string
  zoomIn: string
  audioPlay: string
  audioPause: string
  audioSeek: string
  audioError: string
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
    mapLoading: 'Karte wird geladen…',
    locate: 'Eigenen Standort anzeigen',
    locationError: 'Standort konnte nicht ermittelt werden.',
    locationUnavailable: 'Standortbestimmung wird nicht unterstützt.',
    currentLocation: 'Gerade hier',
    showOnMap: 'Auf der Karte zeigen',
    collectionsTitle: 'Sammlungen',
    collectionsSubtitle: 'Thematische Pfade durch das Flächendenkmal.',
    sitesCount: 'Orte',
    nearest: 'Nächstes:',
    away: 'entfernt',
    loadingEntry: 'Eintrag wird geladen…',
    loadingCollection: 'Sammlung wird geladen…',
    loadingCollections: 'Sammlungen werden geladen…',
    notFoundTitle: 'Nicht gefunden',
    pageNotFoundBody: 'Die angeforderte Seite ist nicht vorhanden.',
    redirecting: 'Weiterleitung…',
    poiNotFound: 'Dieser Eintrag wurde nicht gefunden.',
    collectionNotFound: 'Diese Sammlung wurde nicht gefunden.',
    loadErrorTitle: 'Daten konnten nicht geladen werden',
    loadErrorBody: 'Bitte prüfe die Verbindung und versuche es erneut. Offline gespeicherte Daten werden automatisch verwendet, sofern vorhanden.',
    retry: 'Erneut versuchen',
    backToMap: 'Zurück zur Karte',
    backToCollections: 'Zurück zu Sammlungen',
    collectionPlaces: 'Orte dieser Sammlung',
    collectionMap: 'Karte der Sammlung',
    typeGrab: 'Grabstätte',
    typeBauwerk: 'Bauwerk',
    typeBereich: 'Bereich',
    typeDenkmal: 'Denkmal',
    typeMausoleum: 'Mausoleum',
    typeGedenkanlage: 'Gedenkanlage',
    locationHint: 'Lage',
    learnMore: 'Mehr erfahren',
    dateRange: 'bis',
    dateBorn: 'geboren',
    dateDied: 'gestorben',
    dateBuilt: 'erbaut',
    dateCreated: 'entstanden',
    dateUntil: 'bis',
    sources: 'Quellen',
    poiFeedbackText: 'Fehlt eine Information oder ist eine Angabe nicht korrekt?',
    poiFeedbackLink: 'Hinweis zu diesem Eintrag geben',
    close: 'Schließen',
    enlargeImage: 'Bild vergrößern',
    imageViewer: 'Bild vergrößert anzeigen',
    previousImage: 'Vorheriges Bild',
    nextImage: 'Nächstes Bild',
    zoomOut: 'Verkleinern',
    resetView: 'Ansicht zurücksetzen',
    zoomIn: 'Vergrößern',
    audioPlay: 'Audio abspielen',
    audioPause: 'Audio pausieren',
    audioSeek: 'Wiedergabeposition',
    audioError: 'Audio konnte nicht abgespielt werden.'
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
    mapLoading: 'Loading map…',
    locate: 'Show my location',
    locationError: 'Your location could not be determined.',
    locationUnavailable: 'Location services are not supported.',
    currentLocation: 'Right here',
    showOnMap: 'Show on map',
    collectionsTitle: 'Collections',
    collectionsSubtitle: 'Thematic trails through the heritage site.',
    sitesCount: 'sites',
    nearest: 'Nearest:',
    away: 'away',
    loadingEntry: 'Loading entry…',
    loadingCollection: 'Loading collection…',
    loadingCollections: 'Loading collections…',
    notFoundTitle: 'Not found',
    pageNotFoundBody: 'The requested page does not exist.',
    redirecting: 'Redirecting…',
    poiNotFound: 'This entry was not found.',
    collectionNotFound: 'This collection was not found.',
    loadErrorTitle: 'Unable to load data',
    loadErrorBody: 'Check your connection and try again. Cached offline data is used automatically when available.',
    retry: 'Try again',
    backToMap: 'Back to map',
    backToCollections: 'Back to collections',
    collectionPlaces: 'Places in this collection',
    collectionMap: 'Collection map',
    typeGrab: 'Grave',
    typeBauwerk: 'Building',
    typeBereich: 'Section',
    typeDenkmal: 'Memorial',
    typeMausoleum: 'Mausoleum',
    typeGedenkanlage: 'Memorial site',
    locationHint: 'Location',
    learnMore: 'Learn more',
    dateRange: 'to',
    dateBorn: 'born',
    dateDied: 'died',
    dateBuilt: 'built',
    dateCreated: 'created',
    dateUntil: 'until',
    sources: 'Sources',
    poiFeedbackText: 'Is any information missing or is any information incorrect?',
    poiFeedbackLink: 'Submit information about this entry',
    close: 'Close',
    enlargeImage: 'Enlarge image',
    imageViewer: 'View enlarged image',
    previousImage: 'Previous image',
    nextImage: 'Next image',
    zoomOut: 'Zoom out',
    resetView: 'Reset view',
    zoomIn: 'Zoom in',
    audioPlay: 'Play audio',
    audioPause: 'Pause audio',
    audioSeek: 'Playback position',
    audioError: 'Audio could not be played.'
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
    mapLoading: 'Chargement de la carte…',
    locate: 'Afficher ma position',
    locationError: 'Votre position n’a pas pu être déterminée.',
    locationUnavailable: 'La localisation n’est pas prise en charge.',
    currentLocation: 'Juste ici',
    showOnMap: 'Afficher sur la carte',
    collectionsTitle: 'Collections',
    collectionsSubtitle: 'Parcours thématiques à travers le site.',
    sitesCount: 'sites',
    nearest: 'Plus proche :',
    away: 'de distance',
    loadingEntry: 'Chargement de l’entrée…',
    loadingCollection: 'Chargement de la collection…',
    loadingCollections: 'Chargement des collections…',
    notFoundTitle: 'Introuvable',
    pageNotFoundBody: 'La page demandée n’existe pas.',
    redirecting: 'Redirection en cours…',
    poiNotFound: 'Cette entrée est introuvable.',
    collectionNotFound: 'Cette collection est introuvable.',
    loadErrorTitle: 'Impossible de charger les données',
    loadErrorBody: 'Vérifiez votre connexion et réessayez. Les données hors ligne sont utilisées si elles sont disponibles.',
    retry: 'Réessayer',
    backToMap: 'Retour à la carte',
    backToCollections: 'Retour aux collections',
    collectionPlaces: 'Lieux de cette collection',
    collectionMap: 'Carte de la collection',
    typeGrab: 'Tombe',
    typeBauwerk: 'Bâtiment',
    typeBereich: 'Section',
    typeDenkmal: 'Mémorial',
    typeMausoleum: 'Mausolée',
    typeGedenkanlage: 'Lieu de mémoire',
    locationHint: 'Emplacement',
    learnMore: 'En savoir plus',
    dateRange: 'à',
    dateBorn: 'naissance',
    dateDied: 'décès',
    dateBuilt: 'construit',
    dateCreated: 'créé',
    dateUntil: 'jusqu’en',
    sources: 'Sources',
    poiFeedbackText: 'Une information manque-t-elle ou une indication est-elle incorrecte ?',
    poiFeedbackLink: 'Donner une indication sur cette entrée',
    close: 'Fermer',
    enlargeImage: 'Agrandir l’image',
    imageViewer: 'Afficher l’image agrandie',
    previousImage: 'Image précédente',
    nextImage: 'Image suivante',
    zoomOut: 'Réduire',
    resetView: 'Réinitialiser la vue',
    zoomIn: 'Agrandir',
    audioPlay: 'Lire l’audio',
    audioPause: 'Mettre en pause',
    audioSeek: 'Position de lecture',
    audioError: 'L’audio n’a pas pu être lu.'
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
    mapLoading: 'Ładowanie mapy…',
    locate: 'Pokaż moją lokalizację',
    locationError: 'Nie udało się ustalić lokalizacji.',
    locationUnavailable: 'Lokalizacja nie jest obsługiwana.',
    currentLocation: 'Właśnie tutaj',
    showOnMap: 'Pokaż na mapie',
    collectionsTitle: 'Kolekcje',
    collectionsSubtitle: 'Ścieżki tematyczne przez teren cmentarza.',
    sitesCount: 'miejsc',
    nearest: 'Najbliższe:',
    away: 'stąd',
    loadingEntry: 'Ładowanie wpisu…',
    loadingCollection: 'Ładowanie kolekcji…',
    loadingCollections: 'Ładowanie kolekcji…',
    notFoundTitle: 'Nie znaleziono',
    pageNotFoundBody: 'Żądana strona nie istnieje.',
    redirecting: 'Przekierowywanie…',
    poiNotFound: 'Nie znaleziono tego wpisu.',
    collectionNotFound: 'Nie znaleziono tej kolekcji.',
    loadErrorTitle: 'Nie udało się wczytać danych',
    loadErrorBody: 'Sprawdź połączenie i spróbuj ponownie. Dane offline zostaną użyte, jeśli są dostępne.',
    retry: 'Spróbuj ponownie',
    backToMap: 'Wróć do mapy',
    backToCollections: 'Wróć do kolekcji',
    collectionPlaces: 'Miejsca w tej kolekcji',
    collectionMap: 'Mapa kolekcji',
    typeGrab: 'Grób',
    typeBauwerk: 'Budowla',
    typeBereich: 'Sekcja',
    typeDenkmal: 'Pomnik',
    typeMausoleum: 'Mauzoleum',
    typeGedenkanlage: 'Miejsce pamięci',
    locationHint: 'Położenie',
    learnMore: 'Dowiedz się więcej',
    dateRange: 'do',
    dateBorn: 'urodzenie',
    dateDied: 'śmierć',
    dateBuilt: 'zbudowany',
    dateCreated: 'powstał',
    dateUntil: 'do',
    sources: 'Źródła',
    poiFeedbackText: 'Brakuje informacji lub któraś z nich jest nieprawidłowa?',
    poiFeedbackLink: 'Przekaż uwagę dotyczącą tego wpisu',
    close: 'Zamknij',
    enlargeImage: 'Powiększ obraz',
    imageViewer: 'Wyświetl powiększony obraz',
    previousImage: 'Poprzedni obraz',
    nextImage: 'Następny obraz',
    zoomOut: 'Pomniejsz',
    resetView: 'Zresetuj widok',
    zoomIn: 'Powiększ',
    audioPlay: 'Odtwórz dźwięk',
    audioPause: 'Wstrzymaj dźwięk',
    audioSeek: 'Pozycja odtwarzania',
    audioError: 'Nie udało się odtworzyć dźwięku.'
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
    mapLoading: 'Карта загружается…',
    locate: 'Показать моё местоположение',
    locationError: 'Не удалось определить местоположение.',
    locationUnavailable: 'Определение местоположения не поддерживается.',
    currentLocation: 'Прямо здесь',
    showOnMap: 'Показать на карте',
    collectionsTitle: 'Коллекции',
    collectionsSubtitle: 'Тематические маршруты по территории памятника.',
    sitesCount: 'мест',
    nearest: 'Ближайшее:',
    away: 'от вас',
    loadingEntry: 'Запись загружается…',
    loadingCollection: 'Коллекция загружается…',
    loadingCollections: 'Коллекции загружаются…',
    notFoundTitle: 'Не найдено',
    pageNotFoundBody: 'Запрошенная страница не существует.',
    redirecting: 'Перенаправление…',
    poiNotFound: 'Эта запись не найдена.',
    collectionNotFound: 'Эта коллекция не найдена.',
    loadErrorTitle: 'Не удалось загрузить данные',
    loadErrorBody: 'Проверьте соединение и повторите попытку. Сохранённые офлайн-данные используются автоматически.',
    retry: 'Повторить',
    backToMap: 'Вернуться к карте',
    backToCollections: 'Вернуться к коллекциям',
    collectionPlaces: 'Места этой коллекции',
    collectionMap: 'Карта коллекции',
    typeGrab: 'Могила',
    typeBauwerk: 'Сооружение',
    typeBereich: 'Участок',
    typeDenkmal: 'Памятник',
    typeMausoleum: 'Мавзолей',
    typeGedenkanlage: 'Мемориал',
    locationHint: 'Местоположение',
    learnMore: 'Узнать больше',
    dateRange: 'по',
    dateBorn: 'рождение',
    dateDied: 'смерть',
    dateBuilt: 'построено',
    dateCreated: 'создано',
    dateUntil: 'до',
    sources: 'Источники',
    poiFeedbackText: 'Не хватает информации или какие-либо сведения указаны неверно?',
    poiFeedbackLink: 'Сообщить об этом объекте',
    close: 'Закрыть',
    enlargeImage: 'Увеличить изображение',
    imageViewer: 'Показать увеличенное изображение',
    previousImage: 'Предыдущее изображение',
    nextImage: 'Следующее изображение',
    zoomOut: 'Уменьшить',
    resetView: 'Сбросить вид',
    zoomIn: 'Увеличить',
    audioPlay: 'Воспроизвести аудио',
    audioPause: 'Приостановить аудио',
    audioSeek: 'Позиция воспроизведения',
    audioError: 'Не удалось воспроизвести аудио.'
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
    mapLoading: 'Kartan laddas…',
    locate: 'Visa min plats',
    locationError: 'Din plats kunde inte fastställas.',
    locationUnavailable: 'Platstjänster stöds inte.',
    currentLocation: 'Precis här',
    showOnMap: 'Visa på kartan',
    collectionsTitle: 'Samlingar',
    collectionsSubtitle: 'Tematiska spår över kulturarvsplatsen.',
    sitesCount: 'platser',
    nearest: 'Närmaste:',
    away: 'bort',
    loadingEntry: 'Posten laddas…',
    loadingCollection: 'Samlingen laddas…',
    loadingCollections: 'Samlingar laddas…',
    notFoundTitle: 'Hittades inte',
    pageNotFoundBody: 'Den begärda sidan finns inte.',
    redirecting: 'Omdirigerar…',
    poiNotFound: 'Den här posten hittades inte.',
    collectionNotFound: 'Den här samlingen hittades inte.',
    loadErrorTitle: 'Data kunde inte laddas',
    loadErrorBody: 'Kontrollera anslutningen och försök igen. Sparade offlinedata används automatiskt när de finns.',
    retry: 'Försök igen',
    backToMap: 'Tillbaka till kartan',
    backToCollections: 'Tillbaka till samlingar',
    collectionPlaces: 'Platser i samlingen',
    collectionMap: 'Samlingskarta',
    typeGrab: 'Grav',
    typeBauwerk: 'Byggnad',
    typeBereich: 'Sektion',
    typeDenkmal: 'Minnesmärke',
    typeMausoleum: 'Mausoleum',
    typeGedenkanlage: 'Minnesplats',
    locationHint: 'Läge',
    learnMore: 'Läs mer',
    dateRange: 'till',
    dateBorn: 'född',
    dateDied: 'död',
    dateBuilt: 'uppförd',
    dateCreated: 'skapad',
    dateUntil: 'till',
    sources: 'Källor',
    poiFeedbackText: 'Saknas information eller är någon uppgift felaktig?',
    poiFeedbackLink: 'Lämna information om denna post',
    close: 'Stäng',
    enlargeImage: 'Förstora bild',
    imageViewer: 'Visa förstorad bild',
    previousImage: 'Föregående bild',
    nextImage: 'Nästa bild',
    zoomOut: 'Zooma ut',
    resetView: 'Återställ vy',
    zoomIn: 'Zooma in',
    audioPlay: 'Spela upp ljud',
    audioPause: 'Pausa ljud',
    audioSeek: 'Uppspelningsposition',
    audioError: 'Ljudet kunde inte spelas upp.'
  }
}

export function useDictionary(locale: SupportedLocale): UIDictionary {
  return ui[locale] || ui.de
}
