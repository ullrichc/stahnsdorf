'use client'

import { useLocale } from '@/lib/useLocale'
import styles from './page.module.css'

const content: Record<string, Record<string, string>> = {
  title: { de: 'Information', en: 'Information', fr: 'Informations', pl: 'Informacje', ru: 'Информация', sv: 'Information' },
  openingTitle: { de: 'Öffnungszeiten', en: 'Opening Hours', fr: 'Horaires d\'ouverture', pl: 'Godziny otwarcia', ru: 'Часы работы', sv: 'Öppettider' },
  aboutTitle: { de: 'Über den Friedhof', en: 'About the Cemetery', fr: 'À propos du cimetière', pl: 'O cmentarzu', ru: 'О кладбище', sv: 'Om kyrkogården' },
  aboutText1: {
    de: 'Der Südwestkirchhof Stahnsdorf wurde 1909 als Waldfriedhof für die Berliner Kirchengemeinden angelegt. Mit über 206 Hektar gehört er zu den größten Friedhöfen Europas. Die Anlage zeichnet sich durch ihren einzigartigen Waldcharakter und die architektonisch bemerkenswerte Hauptkapelle im norwegischen Stabkirchenstil aus.',
    en: 'The Südwestkirchhof Stahnsdorf was established in 1909 as a woodland cemetery for Berlin\'s church congregations. At over 206 hectares, it is one of the largest cemeteries in Europe. The grounds are distinguished by their unique forest character and the architecturally remarkable main chapel in Norwegian stave church style.',
    fr: 'Le Südwestkirchhof Stahnsdorf a été créé en 1909 comme cimetière forestier pour les paroisses de Berlin. Avec plus de 206 hectares, c\'est l\'un des plus grands cimetières d\'Europe.',
    pl: 'Südwestkirchhof Stahnsdorf został założony w 1909 roku jako cmentarz leśny dla berlińskich parafii. Z powierzchnią ponad 206 hektarów jest jednym z największych cmentarzy w Europie. Obiekt wyróżnia się unikalnym leśnym charakterem i niezwykłą architekturą głównej kaplicy w stylu norweskiego kościoła klepkowego.',
    ru: 'Юго-западное кладбище (Штансдорф) было основано в 1909 году как лесное кладбище для берлинских приходов. Имея площадь более 206 гектаров, оно является одним из крупнейших кладбищ в Европе. Территория отличается уникальным лесным характером и примечательной архитектурой главной часовни в стиле норвежской ставкирки.',
    sv: 'Sydvästra kyrkogården i Stahnsdorf (Südwestkirchhof Stahnsdorf) anlades 1909 som en skogskyrkogård för Berlins församlingar. Med sina över 206 hektar är den en av Europas största kyrkogårdar. Platsen kännetecknas av sin unika skogskaraktär och den arkitektoniskt anmärkningsvärda huvudkapellet i norsk stavkyrkostil.'
  },
  aboutText2: {
    de: 'Zahlreiche bekannte Persönlichkeiten fanden hier ihre letzte Ruhestätte, darunter Künstler, Wissenschaftler und Politiker. Der Friedhof ist nicht nur ein Ort der Trauer, sondern auch ein bedeutendes Kultur- und Naturdenkmal.',
    en: 'Numerous notable figures found their final resting place here, including artists, scientists, and politicians. The cemetery is not only a place of mourning but also an important cultural and natural monument.',
    fr: 'De nombreuses personnalités y ont trouvé leur dernière demeure, notamment des artistes, des scientifiques et des politiciens.',
    pl: 'Liczne znane osobistości znalazły tu miejsce ostatniego spoczynku, w tym artyści, naukowcy i politycy. Cmentarz to nie tylko miejsce żałoby, ale również ważny zabytek kultury i przyrody.',
    ru: 'Многие известные личности нашли здесь свое последнее пристанище, среди них художники, ученые и политики. Кладбище является не только местом скорби, но и важным памятником культуры и природы.',
    sv: 'Många kända personligheter har funnit sin sista vila här, däribland konstnärer, vetenskapsmän och politiker. Kyrkogården är inte bara en plats för sorg, utan också ett betydande kultur- och naturminne.'
  },
  didYouKnow: {
    de: 'Der Friedhof beherbergt die berühmte Holzkapelle, die nach norwegischen Stabkirchen gestaltet und 1911 fertiggestellt wurde.',
    en: 'The cemetery is home to the famous wooden chapel, modeled after Norwegian stave churches, completed in 1911.',
    fr: 'Le cimetière abrite la célèbre chapelle en bois, inspirée des églises en bois debout norvégiennes, achevée en 1911.',
    pl: 'Na terenie cmentarza znajduje się słynna drewniana kaplica, wzorowana na norweskich kościołach klepkowych, oddana do użytku w 1911 roku.',
    ru: 'На кладбище находится знаменитая деревянная часовня, построенная по образцу норвежских ставкирок и завершенная в 1911 году.',
    sv: 'På kyrkogården finns det berömda träkapellet, som är utformat efter norska stavkyrkor och färdigställdes 1911.'
  },
  contactTitle: { de: 'Kontakt', en: 'Contact', fr: 'Contact', pl: 'Kontakt', ru: 'Контакты', sv: 'Kontakt' },
  accessibilityTitle: { de: 'Besucherhinweis', en: 'Visitor Notice', fr: 'Avis aux visiteurs', pl: 'Informacje dla odwiedzających', ru: 'Информация для посетителей', sv: 'Besöksinformation' },
  accessibilityText: {
    de: 'Bitte verhalten Sie sich den Verstorbenen und dem Ort angemessen. Hunde sind an der Leine zu führen, und das Befahren mit Fahrrädern ist nur auf den Hauptwegen gestattet. Vielen Dank für Ihren Beitrag zur Erhaltung dieser historischen Stätte.',
    en: 'Please behave respectfully towards the deceased and the grounds. Dogs must be kept on a leash, and cycling is only permitted on main paths. Thank you for contributing to the preservation of this historic site.',
    fr: 'Veuillez vous comporter de manière respectueuse. Les chiens doivent être tenus en laisse. Merci de contribuer à la préservation de ce site.',
    pl: 'Prosimy o zachowanie odpowiednie do powagi miejsca. Psy należy trzymać na smyczy, a jazda na rowerze jest dozwolona tylko na głównych ścieżkach. Dziękujemy za wkład w ochronę tego historycznego miejsca.',
    ru: 'Пожалуйста, ведите себя подобающим образом по отношению к умершим и этому месту. Собак следует держать на поводке, а катание на велосипедах разрешено только по главным аллеям. Спасибо за ваш вклад в сохранение этого исторического памятника.',
    sv: 'Vänligen uppträd respektfullt mot de avlidna och platsen. Hundar måste hållas i koppel, och cykling är endast tillåten på huvudvägarna. Tack för ditt bidrag till att bevara denna historiska plats.'
  },
  dailyOpen: {
    de: 'Täglich geöffnet, auch an Feiertagen.',
    en: 'Open daily, including public holidays.',
    fr: 'Ouvert tous les jours, y compris les jours fériés.',
    pl: 'Otwarte codziennie, również w dni świąteczne.',
    ru: 'Открыто ежедневно, включая праздничные дни.',
    sv: 'Öppet dagligen, även på helgdagar.'
  },
  routePlan: { de: 'Route planen', en: 'Plan route', fr: 'Planifier l\'itinéraire', pl: 'Planuj trasę', ru: 'Проложить маршрут', sv: 'Planera rutt' },
}

const openingHours = [
  { season: { de: 'Winter (Nov - Feb)', en: 'Winter (Nov - Feb)', fr: 'Hiver (Nov - Fév)', pl: 'Zima (Lis - Lut)', ru: 'Зима (Ноя - Фев)', sv: 'Vinter (Nov - Feb)' }, time: '08:00 – 16:00' },
  { season: { de: 'Frühjahr (März - April)', en: 'Spring (Mar - Apr)', fr: 'Printemps (Mars - Avr)', pl: 'Wiosna (Mar - Kwi)', ru: 'Весна (Мар - Апр)', sv: 'Vår (Mar - Apr)' }, time: '08:00 – 18:00' },
  { season: { de: 'Sommer (Mai - Aug)', en: 'Summer (May - Aug)', fr: 'Été (Mai - Août)', pl: 'Lato (Maj - Sie)', ru: 'Лето (Май - Авг)', sv: 'Sommar (Maj - Aug)' }, time: '08:00 – 20:00' },
  { season: { de: 'Herbst (Sept - Okt)', en: 'Autumn (Sep - Oct)', fr: 'Automne (Sep - Oct)', pl: 'Jesień (Wrz - Paź)', ru: 'Осень (Сен - Окт)', sv: 'Höst (Sep - Okt)' }, time: '08:00 – 18:00' },
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
          <span className={`material-symbols-outlined ${styles.headingIcon}`}>history_edu</span>
          {c('aboutTitle')}
        </h2>
        <p>{c('aboutText1')}</p>
        <p>{c('aboutText2')}</p>
      </section>

      {/* Did You Know */}
      <section className={styles.section}>
        <h2 className={styles.heading}>
          <span className={`material-symbols-outlined ${styles.headingIcon}`} style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>auto_awesome</span>
          {locale === 'en' ? 'Did you know?' : locale === 'fr' ? 'Le saviez-vous ?' : 'Wussten Sie?'}
        </h2>
        <p>{c('didYouKnow')}</p>
      </section>

      {/* Opening Hours */}
      <section className={styles.section}>
        <h2 className={styles.heading}>
          <span className={`material-symbols-outlined ${styles.headingIcon}`}>schedule</span>
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
          <span className={`material-symbols-outlined ${styles.headingIcon}`}>contact_support</span>
          {c('contactTitle')}
        </h2>

        <div className={styles.contactRow}>
          <span className={`material-symbols-outlined ${styles.contactIcon}`}>location_on</span>
          <div className={styles.contactText}>
            <strong>Förderverein Südwestkirchhof Stahnsdorf e.V.</strong>
            Bahnhofstraße 2<br />
            14532 Stahnsdorf
          </div>
        </div>

        <div className={styles.contactRow}>
          <span className={`material-symbols-outlined ${styles.contactIcon}`}>call</span>
          <div className={styles.contactText}>
            0179 3793503<br />
            03329 614106
          </div>
        </div>

        <div className={styles.contactRow}>
          <span className={`material-symbols-outlined ${styles.contactIcon}`}>language</span>
          <div className={styles.contactText}>
            <a href="https://www.suedwestkirchhof.de" target="_blank" rel="noopener noreferrer">
              www.suedwestkirchhof.de
            </a>
          </div>
        </div>

        <a
          href="https://www.google.com/maps/dir/?api=1&destination=52.389506,13.180954"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.routeBtn}
        >
          {c('routePlan')}
        </a>
      </div>

      {/* Visitor Notice */}
      <section className={styles.section}>
        <h2 className={styles.heading}>
          <span className={`material-symbols-outlined ${styles.headingIcon}`}>info</span>
          {c('accessibilityTitle')}
        </h2>
        <p>{c('accessibilityText')}</p>
      </section>
    </div>
  )
}
