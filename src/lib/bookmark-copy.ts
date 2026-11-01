import type { SupportedLocale } from './LocaleContext'
import type { BookmarkBrowser, BookmarkPlatform } from './bookmark-browser'

export type BookmarkCopy = {
  title: string
  body: string
  howTo: string
  close: string
  helpLink: string
  chooseOther: string
  chooseBrowser: string
  choosePlatform: string
  helpTitle: (browserName: string) => string
  genericTitle: string
  embeddedTitle: string
  embeddedSteps: string[]
  genericSteps: string[]
  browserLabel: string
  platformLabel: string
}

const copy: Record<SupportedLocale, BookmarkCopy> = {
  de: {
    title: 'Für den nächsten Besuch merken',
    body: 'Speichern Sie diese Seite als Lesezeichen oder Favorit in Ihrem Browser.',
    howTo: 'So geht’s', close: 'Schließen', helpLink: 'Seite als Lesezeichen speichern',
    chooseOther: 'Andere Anleitung', chooseBrowser: 'Browser auswählen', choosePlatform: 'Gerät auswählen',
    helpTitle: name => `So geht’s in ${name}`, genericTitle: 'Seite als Lesezeichen speichern',
    embeddedTitle: 'Zuerst im Browser öffnen', browserLabel: 'Browser', platformLabel: 'Gerät / Betriebssystem',
    embeddedSteps: ['Öffnen Sie die Seite zuerst in Ihrem Browser. Meist finden Sie diese Funktion im Menü der App.', 'Speichern Sie die Seite dort als Lesezeichen oder Favorit.'],
    genericSteps: ['Öffnen Sie das Menü Ihres Browsers.', 'Wählen Sie die Funktion zum Hinzufügen eines Lesezeichens oder Favoriten, oft mit einem Sternsymbol.', 'Bestätigen Sie das Speichern, falls Ihr Browser danach fragt.'],
  },
  en: {
    title: 'Keep this page for your next visit',
    body: 'Save this page as a bookmark or favorite in your browser.',
    howTo: 'How to do it', close: 'Close', helpLink: 'Bookmark this page',
    chooseOther: 'Other instructions', chooseBrowser: 'Choose browser', choosePlatform: 'Choose device',
    helpTitle: name => `How to do it in ${name}`, genericTitle: 'Bookmark this page',
    embeddedTitle: 'Open in your browser first', browserLabel: 'Browser', platformLabel: 'Device / operating system',
    embeddedSteps: ['Open this page in your browser first. This option is usually in the app’s menu.', 'Then save the page as a bookmark or favorite in that browser.'],
    genericSteps: ['Open your browser’s menu.', 'Look for the option to add a bookmark or favorite, often shown as a star.', 'Confirm saving if your browser asks you to.'],
  },
  fr: {
    title: 'Gardez cette page pour votre prochaine visite',
    body: 'Enregistrez cette page dans les favoris de votre navigateur.',
    howTo: 'Comment faire', close: 'Fermer', helpLink: 'Ajouter cette page aux favoris',
    chooseOther: 'Autres instructions', chooseBrowser: 'Choisir le navigateur', choosePlatform: 'Choisir l’appareil',
    helpTitle: name => `Comment faire dans ${name}`, genericTitle: 'Ajouter cette page aux favoris',
    embeddedTitle: 'Ouvrez d’abord la page dans votre navigateur', browserLabel: 'Navigateur', platformLabel: 'Appareil / système d’exploitation',
    embeddedSteps: ['Ouvrez d’abord cette page dans votre navigateur. Cette option se trouve généralement dans le menu de l’application.', 'Ajoutez ensuite la page aux favoris de ce navigateur.'],
    genericSteps: ['Ouvrez le menu de votre navigateur.', 'Cherchez l’option pour ajouter un favori ou un marque-page, souvent représentée par une étoile.', 'Confirmez l’enregistrement si le navigateur vous le demande.'],
  },
  pl: {
    title: 'Zachowaj stronę na następną wizytę',
    body: 'Zapisz tę stronę w zakładkach lub ulubionych swojej przeglądarki.',
    howTo: 'Jak to zrobić', close: 'Zamknij', helpLink: 'Dodaj stronę do zakładek',
    chooseOther: 'Inna instrukcja', chooseBrowser: 'Wybierz przeglądarkę', choosePlatform: 'Wybierz urządzenie',
    helpTitle: name => `Jak to zrobić w przeglądarce ${name}`, genericTitle: 'Dodaj stronę do zakładek',
    embeddedTitle: 'Najpierw otwórz w przeglądarce', browserLabel: 'Przeglądarka', platformLabel: 'Urządzenie / system operacyjny',
    embeddedSteps: ['Najpierw otwórz tę stronę w swojej przeglądarce. Ta opcja zwykle znajduje się w menu aplikacji.', 'Następnie zapisz stronę w zakładkach lub ulubionych tej przeglądarki.'],
    genericSteps: ['Otwórz menu przeglądarki.', 'Znajdź opcję dodania zakładki lub ulubionej strony, często oznaczoną gwiazdką.', 'Potwierdź zapis, jeśli przeglądarka o to poprosi.'],
  },
  ru: {
    title: 'Сохраните страницу для следующего посещения',
    body: 'Добавьте эту страницу в закладки или избранное вашего браузера.',
    howTo: 'Как это сделать', close: 'Закрыть', helpLink: 'Добавить страницу в закладки',
    chooseOther: 'Другая инструкция', chooseBrowser: 'Выбрать браузер', choosePlatform: 'Выбрать устройство',
    helpTitle: name => `Как это сделать в ${name}`, genericTitle: 'Добавить страницу в закладки',
    embeddedTitle: 'Сначала откройте в браузере', browserLabel: 'Браузер', platformLabel: 'Устройство / операционная система',
    embeddedSteps: ['Сначала откройте страницу в вашем браузере. Обычно эта функция находится в меню приложения.', 'Затем добавьте страницу в закладки или избранное этого браузера.'],
    genericSteps: ['Откройте меню браузера.', 'Найдите функцию добавления в закладки или избранное, часто обозначенную звёздочкой.', 'Подтвердите сохранение, если браузер попросит об этом.'],
  },
  sv: {
    title: 'Spara sidan till nästa besök',
    body: 'Spara den här sidan som bokmärke eller favorit i din webbläsare.',
    howTo: 'Så gör du', close: 'Stäng', helpLink: 'Spara sidan som bokmärke',
    chooseOther: 'Andra instruktioner', chooseBrowser: 'Välj webbläsare', choosePlatform: 'Välj enhet',
    helpTitle: name => `Så gör du i ${name}`, genericTitle: 'Spara sidan som bokmärke',
    embeddedTitle: 'Öppna först i din webbläsare', browserLabel: 'Webbläsare', platformLabel: 'Enhet / operativsystem',
    embeddedSteps: ['Öppna först sidan i din webbläsare. Det alternativet finns oftast i appens meny.', 'Spara sedan sidan som bokmärke eller favorit i den webbläsaren.'],
    genericSteps: ['Öppna webbläsarens meny.', 'Leta efter alternativet för att lägga till ett bokmärke eller en favorit, ofta markerat med en stjärna.', 'Bekräfta att du vill spara om webbläsaren frågar.'],
  },
}

// Manufacturer sources checked 2026-11-01; native menus not device-tested.
// Safari iPhone/iPad: page menu or Share/More varies by version and layout.
// https://support.apple.com/en-gb/guide/iphone/iph42ab2f3a7/27/ios/27
// https://support.apple.com/guide/ipad/bookmark-a-website-ipadc602b75b/27/ipados/27
// https://support.apple.com/en-ie/guide/ipad/ipadc602b75b/ipados
// Chrome: both platform guides independently document More > Add to bookmarks.
// https://support.google.com/chrome/answer/188842?co=GENIE.Platform%3DAndroid&hl=en
// https://support.google.com/chrome/answer/188842?co=GENIE.Platform%3DiOS&hl=en
// Firefox: Android uses Add next to Bookmarks; iOS uses the menu's star.
// https://support.mozilla.org/en-US/kb/add-delete-and-view-bookmarked-webpages-firefox-android
// https://support.mozilla.org/en-US/kb/how-add-remove-edit-and-move-bookmarks-firefox-ios
// Edge: separate Android/iOS sections both document menu > Add to favorites.
// https://support.microsoft.com/en-gb/microsoft-edge/microsoft-edge-for-mobile-faqs-29296eab-b76f-4a87-ac9c-9835da53465d
// Samsung: distinguish the address-bar bookmark star from the bookmark-list icon.
// https://www.samsung.com/us/support/answer/ANS10012958/
// Opera Android: address-bar page menu > Add bookmark (or Add to > bookmarks).
// https://help.opera.com/en/mobile/android/
// Opera iOS source documents Speed Dial, not the requested bookmark workflow;
// do not reuse legacy Opera Mini instructions. Use the generic fallback instead.
// https://help.opera.com/en/mobileios/start-page/

type StepKind = 'safari' | 'chrome' | 'firefoxAndroid' | 'firefoxIos' | 'edge' | 'samsung' | 'operaAndroid'
const steps: Record<SupportedLocale, Record<StepKind, string[]>> = {
  de: {
    safari: ['Öffnen Sie das Seitenmenü von Safari oder, je nach Ansicht, „Teilen“ (Quadrat mit Pfeil) und gegebenenfalls „Mehr“.', 'Wählen Sie „Lesezeichen hinzufügen“ oder „Lesezeichen hinzufügen zu“.', 'Wählen Sie einen Speicherort und tippen Sie auf „Sichern“.'],
    chrome: ['Öffnen Sie das Menü „Mehr“ (drei Punkte).', 'Wählen Sie „Zu Lesezeichen hinzufügen“ oder das Sternsymbol zum Speichern der Seite.'],
    firefoxAndroid: ['Öffnen Sie das Menü mit den drei Punkten.', 'Tippen Sie neben „Lesezeichen“ auf „Hinzufügen“.'],
    firefoxIos: ['Öffnen Sie das Menü von Firefox.', 'Tippen Sie auf das Sternsymbol, um die Seite als Lesezeichen zu speichern.'],
    edge: ['Öffnen Sie das Menü von Edge (drei Punkte).', 'Wählen Sie „Zu Favoriten hinzufügen“.'],
    samsung: ['Tippen Sie auf das Lesezeichen-Sternsymbol an der Adressleiste, um die Seite zu speichern.'],
    operaAndroid: ['Öffnen Sie das Seitenmenü an der Adressleiste.', 'Wählen Sie „Lesezeichen hinzufügen“. Falls stattdessen „Hinzufügen zu“ erscheint, wählen Sie dort „Lesezeichen“.'],
  },
  en: {
    safari: ['Open Safari’s page menu or, depending on the layout, Share (a square with an arrow) and More if needed.', 'Choose Add Bookmark or Add Bookmark to.', 'Choose where to keep it, then tap Save.'],
    chrome: ['Open the More menu (three dots).', 'Choose Add to Bookmarks or the star that saves the current page.'],
    firefoxAndroid: ['Open the three-dot menu.', 'Tap Add beside Bookmarks.'],
    firefoxIos: ['Open the Firefox menu.', 'Tap the star to save the page as a bookmark.'],
    edge: ['Open the Edge menu (three dots).', 'Choose Add to favorites.'],
    samsung: ['Tap the bookmark star by the address bar to save this page.'],
    operaAndroid: ['Open the page menu by the address bar.', 'Choose Add bookmark. If you see Add to instead, choose Bookmarks there.'],
  },
  fr: {
    safari: ['Ouvrez le menu de la page dans Safari ou, selon l’affichage, Partager (carré avec une flèche), puis Plus si nécessaire.', 'Choisissez Ajouter un signet ou Ajouter un signet à.', 'Choisissez un emplacement, puis touchez Enregistrer.'],
    chrome: ['Ouvrez le menu Plus (trois points).', 'Choisissez Ajouter aux favoris ou l’étoile permettant d’enregistrer la page.'],
    firefoxAndroid: ['Ouvrez le menu à trois points.', 'Touchez Ajouter à côté de Marque-pages.'],
    firefoxIos: ['Ouvrez le menu de Firefox.', 'Touchez l’étoile pour enregistrer la page comme marque-page.'],
    edge: ['Ouvrez le menu d’Edge (trois points).', 'Choisissez Ajouter aux favoris.'],
    samsung: ['Touchez l’étoile de favori près de la barre d’adresse pour enregistrer la page.'],
    operaAndroid: ['Ouvrez le menu de la page près de la barre d’adresse.', 'Choisissez Ajouter un signet. Si Ajouter à apparaît à la place, choisissez-y Signets.'],
  },
  pl: {
    safari: ['Otwórz menu strony w Safari lub, zależnie od widoku, Udostępnij (kwadrat ze strzałką), a w razie potrzeby Więcej.', 'Wybierz Dodaj zakładkę lub opcję wyboru miejsca dla nowej zakładki.', 'Wybierz miejsce i stuknij Zachowaj.'],
    chrome: ['Otwórz menu Więcej (trzy kropki).', 'Wybierz Dodaj do zakładek lub gwiazdkę zapisującą bieżącą stronę.'],
    firefoxAndroid: ['Otwórz menu z trzema kropkami.', 'Stuknij Dodaj obok pozycji Zakładki.'],
    firefoxIos: ['Otwórz menu przeglądarki Firefox.', 'Stuknij gwiazdkę, aby zapisać stronę jako zakładkę.'],
    edge: ['Otwórz menu przeglądarki Edge (trzy kropki).', 'Wybierz Dodaj do ulubionych.'],
    samsung: ['Stuknij gwiazdkę zakładki przy pasku adresu, aby zapisać stronę.'],
    operaAndroid: ['Otwórz menu strony przy pasku adresu.', 'Wybierz Dodaj zakładkę. Jeśli widzisz opcję Dodaj do, wybierz w niej Zakładki.'],
  },
  ru: {
    safari: ['Откройте меню страницы в Safari или, в зависимости от вида, «Поделиться» (квадрат со стрелкой), затем при необходимости «Ещё».', 'Выберите «Добавить закладку» или пункт выбора места для новой закладки.', 'Выберите папку и нажмите «Сохранить».'],
    chrome: ['Откройте меню «Ещё» (три точки).', 'Выберите «Добавить в закладки» или звёздочку для сохранения текущей страницы.'],
    firefoxAndroid: ['Откройте меню с тремя точками.', 'Нажмите «Добавить» рядом с пунктом «Закладки».'],
    firefoxIos: ['Откройте меню Firefox.', 'Нажмите на звёздочку, чтобы добавить страницу в закладки.'],
    edge: ['Откройте меню Edge (три точки).', 'Выберите «Добавить в избранное».'],
    samsung: ['Нажмите на звёздочку закладки у адресной строки, чтобы сохранить страницу.'],
    operaAndroid: ['Откройте меню страницы у адресной строки.', 'Выберите «Добавить закладку». Если вместо этого показан пункт «Добавить в», выберите в нём «Закладки».'],
  },
  sv: {
    safari: ['Öppna sidmenyn i Safari eller, beroende på vy, Dela (en fyrkant med en pil) och vid behov Mer.', 'Välj Lägg till bokmärke eller alternativet för att välja var bokmärket ska sparas.', 'Välj en plats och tryck på Spara.'],
    chrome: ['Öppna menyn Mer (tre punkter).', 'Välj Lägg till bokmärke eller stjärnan som sparar den aktuella sidan.'],
    firefoxAndroid: ['Öppna menyn med tre punkter.', 'Tryck på Lägg till bredvid Bokmärken.'],
    firefoxIos: ['Öppna Firefox-menyn.', 'Tryck på stjärnan för att spara sidan som bokmärke.'],
    edge: ['Öppna Edge-menyn (tre punkter).', 'Välj Lägg till i favoriter.'],
    samsung: ['Tryck på bokmärkesstjärnan vid adressfältet för att spara sidan.'],
    operaAndroid: ['Öppna sidans meny vid adressfältet.', 'Välj Lägg till bokmärke. Om Lägg till i visas i stället väljer du Bokmärken där.'],
  },
}

// Only combinations backed by the platform-specific sources above get exact steps.
const stepKinds: Record<BookmarkBrowser, Partial<Record<BookmarkPlatform, StepKind>>> = {
  safari: { ios: 'safari' },
  chrome: { ios: 'chrome', android: 'chrome' },
  firefox: { ios: 'firefoxIos', android: 'firefoxAndroid' },
  edge: { ios: 'edge', android: 'edge' },
  samsung: { android: 'samsung' },
  opera: { android: 'operaAndroid' },
  unknown: {},
}

export const browserNames: Record<Exclude<BookmarkBrowser, 'unknown'>, string> = {
  safari: 'Safari', chrome: 'Chrome', firefox: 'Firefox', edge: 'Microsoft Edge',
  samsung: 'Samsung Internet', opera: 'Opera',
}

const otherNames: Record<SupportedLocale, { browser: string; platform: string }> = {
  de: { browser: 'Anderer / unbekannter Browser', platform: 'Anderes Gerät' },
  en: { browser: 'Other / unknown browser', platform: 'Other device' },
  fr: { browser: 'Autre navigateur / inconnu', platform: 'Autre appareil' },
  pl: { browser: 'Inna / nieznana przeglądarka', platform: 'Inne urządzenie' },
  ru: { browser: 'Другой / неизвестный браузер', platform: 'Другое устройство' },
  sv: { browser: 'Annan / okänd webbläsare', platform: 'Annan enhet' },
}

export function getBookmarkCopy(locale: SupportedLocale): BookmarkCopy {
  return copy[locale]
}

export function getBookmarkSteps(browser: BookmarkBrowser, platform: BookmarkPlatform, locale: SupportedLocale): string[] {
  const kind = stepKinds[browser][platform]
  return kind ? steps[locale][kind] : copy[locale].genericSteps
}

export function getBookmarkBrowserName(browser: BookmarkBrowser, locale: SupportedLocale): string {
  return browser === 'unknown' ? otherNames[locale].browser : browserNames[browser]
}

export function getBookmarkPlatformName(platform: BookmarkPlatform, locale: SupportedLocale): string {
  if (platform === 'ios') return 'iPhone / iPad (iOS / iPadOS)'
  return platform === 'android' ? 'Android' : otherNames[locale].platform
}
