'use client'

import { useLocale } from '@/lib/useLocale'
import styles from './page.module.css'
import AppIcon from '@/components/AppIcon'
import { feedbackFormUrl } from '@/lib/feedback'

const content: Record<string, Record<string, string>> = {
  title: { de: 'Information', en: 'Information', fr: 'Informations', pl: 'Informacje', ru: 'Информация', sv: 'Information' },
  openingTitle: { de: 'Öffnungszeiten', en: 'Opening Hours', fr: 'Horaires d\'ouverture', pl: 'Godziny otwarcia', ru: 'Часы работы', sv: 'Öppettider' },
  aboutTitle: { de: 'Über den Friedhof', en: 'About the Cemetery', fr: 'À propos du cimetière', pl: 'O cmentarzu', ru: 'О кладбище', sv: 'Om kyrkogården' },
  aboutText1: {
    de: 'Der Südwestkirchhof Stahnsdorf wurde 1909 als Waldfriedhof für die Berliner Kirchengemeinden angelegt. Mit über 206 Hektar gehört er zu den größten Friedhöfen Europas. Die Anlage zeichnet sich durch ihren einzigartigen Waldcharakter und die architektonisch bemerkenswerte Hauptkapelle im norwegischen Stabkirchenstil aus.',
    en: 'Südwestkirchhof Stahnsdorf was established in 1909 as a woodland cemetery for Berlin\'s church congregations. Covering more than 206 hectares, it is one of the largest cemeteries in Europe. The grounds are distinguished by their unique woodland character and the architecturally remarkable main chapel, designed in the style of a Norwegian stave church.',
    fr: 'Le Südwestkirchhof Stahnsdorf a été aménagé en 1909 comme cimetière forestier destiné aux paroisses berlinoises. Avec plus de 206 hectares, il compte parmi les plus grands cimetières d’Europe. Le site se distingue par son caractère boisé unique et par sa remarquable chapelle principale, inspirée des églises norvégiennes en bois debout.',
    pl: 'Südwestkirchhof Stahnsdorf założono w 1909 roku jako cmentarz leśny dla berlińskich parafii. Zajmuje ponad 206 hektarów i należy do największych cmentarzy w Europie. Teren wyróżnia się wyjątkowym leśnym charakterem oraz niezwykłą kaplicą główną, wzorowaną na norweskich kościołach klepkowych.',
    ru: 'Юго-Западное кладбище Штансдорф было основано в 1909 году как лесное кладбище для берлинских приходов. Его площадь превышает 206 гектаров, что делает его одним из крупнейших кладбищ Европы. Территория отличается уникальным лесным обликом и примечательной главной часовней в стиле норвежской ставкирки.',
    sv: 'Südwestkirchhof Stahnsdorf anlades 1909 som en skogskyrkogård för Berlins församlingar. Med sina drygt 206 hektar är den en av Europas största kyrkogårdar. Området präglas av sin unika skogskaraktär och det arkitektoniskt särpräglade huvudkapellet i norsk stavkyrkostil.'
  },
  aboutText2: {
    de: 'Zahlreiche bekannte Persönlichkeiten fanden hier ihre letzte Ruhestätte, darunter Künstler, Wissenschaftler und Politiker. Der Friedhof ist nicht nur ein Ort der Trauer, sondern auch ein bedeutendes Kultur- und Naturdenkmal.',
    en: 'Many notable figures found their final resting place here, including artists, scientists, and politicians. The cemetery is both a place of remembrance and an important cultural and natural monument.',
    fr: 'De nombreuses personnalités y ont trouvé leur dernière demeure, notamment des artistes, des scientifiques et des responsables politiques. Le cimetière est à la fois un lieu de recueillement et un important site du patrimoine culturel et naturel.',
    pl: 'Wiele znanych osobistości znalazło tu miejsce ostatniego spoczynku, wśród nich artyści, naukowcy i politycy. Cmentarz jest nie tylko miejscem zadumy, lecz także ważnym zabytkiem kultury i przyrody.',
    ru: 'Здесь нашли последнее пристанище многие известные люди, в том числе деятели искусства, учёные и политики. Кладбище является не только местом скорби и памяти, но и важным памятником культуры и природы.',
    sv: 'Många kända personer har fått sin sista vila här, bland dem konstnärer, forskare och politiker. Kyrkogården är inte bara en plats för sorg och minnen, utan också ett betydelsefullt kultur- och naturminne.'
  },
  didYouKnowTitle: { de: 'Wussten Sie?', en: 'Did you know?', fr: 'Le saviez-vous ?', pl: 'Czy wiesz, że?', ru: 'Знаете ли вы?', sv: 'Visste du?' },
  didYouKnow: {
    de: 'Der Friedhof beherbergt die berühmte Holzkapelle, die nach norwegischen Stabkirchen gestaltet und 1911 fertiggestellt wurde.',
    en: 'The cemetery is home to its famous wooden chapel, modeled on Norwegian stave churches and completed in 1911.',
    fr: 'Le cimetière abrite une célèbre chapelle en bois, inspirée des églises norvégiennes en bois debout et achevée en 1911.',
    pl: 'Na terenie cmentarza znajduje się słynna drewniana kaplica, wzorowana na norweskich kościołach klepkowych i ukończona w 1911 roku.',
    ru: 'На кладбище находится знаменитая деревянная часовня, созданная по образцу норвежских ставкирок и завершённая в 1911 году.',
    sv: 'På kyrkogården finns det berömda träkapellet, som utformades efter norska stavkyrkor och stod färdigt 1911.'
  },
  contactTitle: { de: 'Kontakt', en: 'Contact', fr: 'Contact', pl: 'Kontakt', ru: 'Контакты', sv: 'Kontakt' },
  createdBy: {
    de: 'App erstellt von Dr. Carsten Ullrich',
    en: 'App created by Dr. Carsten Ullrich',
    fr: 'Application créée par le Dr Carsten Ullrich',
    pl: 'Aplikację stworzył dr Carsten Ullrich',
    ru: 'Приложение разработал д-р Карстен Ульрих',
    sv: 'Appen skapades av dr Carsten Ullrich'
  },
  legalLink: {
    de: 'Impressum & Datenschutz',
    en: 'Legal notice & privacy policy',
    fr: 'Mentions légales et protection des données',
    pl: 'Nota prawna i polityka prywatności',
    ru: 'Правовая информация и защита данных',
    sv: 'Juridisk information och dataskydd'
  },
  accessibilityTitle: { de: 'Besucherhinweis', en: 'Visitor Notice', fr: 'Avis aux visiteurs', pl: 'Informacje dla odwiedzających', ru: 'Информация для посетителей', sv: 'Besöksinformation' },
  accessibilityText: {
    de: 'Bitte verhalten Sie sich den Verstorbenen und dem Ort angemessen. Hunde sind an der Leine zu führen, und das Befahren mit Fahrrädern ist nur auf den Hauptwegen gestattet. Vielen Dank für Ihren Beitrag zur Erhaltung dieser historischen Stätte.',
    en: 'Please show respect for the deceased and the dignity of the grounds. Dogs must be kept on a leash, and cycling is permitted only on the main paths. Thank you for helping preserve this historic site.',
    fr: 'Veuillez respecter les défunts et la dignité du lieu. Les chiens doivent être tenus en laisse et les vélos ne sont autorisés que sur les allées principales. Merci de contribuer à la préservation de ce site historique.',
    pl: 'Prosimy o zachowanie szacunku dla zmarłych i powagi tego miejsca. Psy należy prowadzić na smyczy, a jazda na rowerze jest dozwolona wyłącznie na głównych alejach. Dziękujemy za pomoc w zachowaniu tego historycznego miejsca.',
    ru: 'Просим уважительно относиться к памяти усопших и к этому месту. Собак следует держать на поводке, а катание на велосипедах разрешено только по главным аллеям. Спасибо за помощь в сохранении этого исторического памятника.',
    sv: 'Vänligen visa hänsyn till de avlidna och platsens värdighet. Hundar ska hållas kopplade och cykling är endast tillåten på huvudvägarna. Tack för att du hjälper till att bevara denna historiska plats.'
  },
  dailyOpen: {
    de: 'Täglich geöffnet, auch an Feiertagen.',
    en: 'Open daily, including public holidays.',
    fr: 'Ouvert tous les jours, y compris les jours fériés.',
    pl: 'Otwarte codziennie, również w dni świąteczne.',
    ru: 'Открыто ежедневно, включая праздничные дни.',
    sv: 'Öppet dagligen, även på helgdagar.'
  },
  routePlan: { de: 'Route planen', en: 'Get directions', fr: 'Itinéraire', pl: 'Wyznacz trasę', ru: 'Проложить маршрут', sv: 'Hitta hit' },
  feedbackText: {
    de: 'Haben Sie Hinweise, Korrekturen oder Anregungen zur App? Wir freuen uns über Ihre Rückmeldung.',
    en: 'Do you have comments, corrections or suggestions about the app? We welcome your feedback.',
    fr: 'Vous avez des remarques, des corrections ou des suggestions concernant l’application ? Nous serons heureux de recevoir votre avis.',
    pl: 'Czy mają Państwo uwagi, poprawki lub sugestie dotyczące aplikacji? Chętnie poznamy Państwa opinię.',
    ru: 'У вас есть замечания, исправления или предложения по приложению? Будем рады вашим отзывам.',
    sv: 'Har du synpunkter, rättelser eller förslag som rör appen? Vi tar gärna emot din återkoppling.'
  },
  feedbackLink: {
    de: 'Rückmeldung zur App geben',
    en: 'Give feedback on the app',
    fr: 'Donner votre avis sur l’application',
    pl: 'Przekaż opinię o aplikacji',
    ru: 'Оставить отзыв о приложении',
    sv: 'Lämna synpunkter på appen'
  },
}

const openingHours = [
  { season: { de: 'Winter (Nov.–Feb.)', en: 'Winter (Nov–Feb)', fr: 'Hiver (nov.–févr.)', pl: 'Zima (lis–lut)', ru: 'Зима (нояб.–февр.)', sv: 'Vinter (nov–feb)' }, time: '08:00 – 16:00' },
  { season: { de: 'Frühjahr (März–Apr.)', en: 'Spring (Mar–Apr)', fr: 'Printemps (mars–avr.)', pl: 'Wiosna (mar–kwi)', ru: 'Весна (март–апр.)', sv: 'Vår (mars–apr)' }, time: '08:00 – 18:00' },
  { season: { de: 'Sommer (Mai–Aug.)', en: 'Summer (May–Aug)', fr: 'Été (mai–août)', pl: 'Lato (maj–sie)', ru: 'Лето (май–авг.)', sv: 'Sommar (maj–aug)' }, time: '08:00 – 20:00' },
  { season: { de: 'Herbst (Sept.–Okt.)', en: 'Autumn (Sep–Oct)', fr: 'Automne (sept.–oct.)', pl: 'Jesień (wrz–paź)', ru: 'Осень (сент.–окт.)', sv: 'Höst (sep–okt)' }, time: '08:00 – 18:00' },
]

export default function InfoPage() {
  const locale = useLocale()
  const c = (key: keyof typeof content) => content[key][locale] || content[key].de || ''

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{c('title')}</h1>

      {/* About Section */}
      <section className={styles.section}>
        <h2 className={styles.heading}>
          <AppIcon name="history_edu" className={styles.headingIcon} />
          {c('aboutTitle')}
        </h2>
        <p>{c('aboutText1')}</p>
        <p>{c('aboutText2')}</p>
      </section>

      <section className={styles.section}>
        <p>{c('feedbackText')}</p>
        <a
          href={feedbackFormUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.feedbackLink}
        >
          {c('feedbackLink')}
          <AppIcon name="open_in_new" />
        </a>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>
          <AppIcon name="auto_awesome" className={styles.headingIcon} />
          {c('didYouKnowTitle')}
        </h2>
        <p>{c('didYouKnow')}</p>
      </section>

      {/* Opening Hours */}
      <section className={styles.section}>
        <h2 className={styles.heading}>
          <AppIcon name="schedule" className={styles.headingIcon} />
          {c('openingTitle')}
        </h2>
        {openingHours.map((h, i) => (
          <div key={i} className={styles.hoursRow}>
            <span className={styles.hoursSeason}>{h.season[locale] || h.season.de}</span>
            <span className={styles.hoursTime}>{h.time}</span>
          </div>
        ))}
        <p className={styles.hoursNote}>{c('dailyOpen')}</p>
      </section>

      {/* Contact */}
      <div className={styles.contactCard}>
        <h2 className={styles.heading}>
          <AppIcon name="contact_support" className={styles.headingIcon} />
          {c('contactTitle')}
        </h2>

        <div className={styles.contactRow}>
          <AppIcon name="location_on" className={styles.contactIcon} />
          <div className={styles.contactText}>
            <strong>Förderverein Südwestkirchhof Stahnsdorf e.V.</strong>
            Bahnhofstraße 2, 14532 Stahnsdorf
          </div>
        </div>

        <div className={styles.contactRow}>
          <AppIcon name="call" className={styles.contactIcon} />
          <div className={styles.contactText}>
            <a href="tel:+491793793503">0179 3793503</a>
            <span className={styles.contactSeparator} aria-hidden="true">·</span>
            <a href="tel:+493329614106">03329 614106</a>
          </div>
        </div>

        <div className={styles.contactRow}>
          <AppIcon name="language" className={styles.contactIcon} />
          <div className={styles.contactText}>
            <a href="https://www.suedwestkirchhof.de" target="_blank" rel="noopener noreferrer">
              www.suedwestkirchhof.de
            </a>
          </div>
        </div>

        <div className={styles.contactRow}>
          <AppIcon name="code" className={styles.contactIcon} />
          <div className={styles.contactText}>
            <a
              href="https://www.carstenullrich.net/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.legalLink}
            >
              {c('createdBy')}
              <AppIcon name="open_in_new" />
            </a>
          </div>
        </div>

        <div className={styles.contactRow}>
          <AppIcon name="history_edu" className={styles.contactIcon} />
          <div className={styles.contactText}>
            <a
              href="https://www.suedwestkirchhof.de/impressum.html"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.legalLink}
            >
              {c('legalLink')}
              <AppIcon name="open_in_new" />
            </a>
          </div>
        </div>

        <div className={styles.contactRow}>
          <AppIcon name="directions_walk" className={styles.contactIcon} />
          <div className={styles.contactText}>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=52.389506,13.180954"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.legalLink}
            >
              {c('routePlan')}
              <AppIcon name="open_in_new" />
            </a>
          </div>
        </div>
      </div>

      {/* Visitor Notice */}
      <section className={styles.section}>
        <h2 className={styles.heading}>
          <AppIcon name="info" className={styles.headingIcon} />
          {c('accessibilityTitle')}
        </h2>
        <p>{c('accessibilityText')}</p>
      </section>

    </div>
  )
}
