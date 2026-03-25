'use client'

import { useLocale } from '@/lib/useLocale'
import styles from './page.module.css'

const content = {
  title: { de: 'Informationen', en: 'Information', fr: 'Informations' },
  openingTitle: { de: 'Öffnungszeiten', en: 'Opening Hours', fr: 'Horaires d\'ouverture' },
  openingText: {
    de: 'Der Südwestkirchhof ist täglich von Sonnenaufgang bis Sonnenuntergang geöffnet.',
    en: 'The Südwestkirchhof is open daily from sunrise to sunset.',
    fr: 'Le Südwestkirchhof est ouvert tous les jours du lever au coucher du soleil.',
  },
  openingNote: {
    de: 'Der Einlass endet 30 Minuten vor Sonnenuntergang.',
    en: 'Admission ends 30 minutes before sunset.',
    fr: 'L\'entrée se termine 30 minutes avant le coucher du soleil.',
  },
  directionsTitle: { de: 'Anfahrt', en: 'Directions', fr: 'Accès' },
  address: { de: 'Adresse:', en: 'Address:', fr: 'Adresse :' },
  sbahn: {
    de: 'S-Bahn: S1 bis Wannsee, dann Bus 622 bis Stahnsdorf, Friedhof',
    en: 'S-Bahn: S1 to Wannsee, then Bus 622 to Stahnsdorf, Friedhof',
    fr: 'S-Bahn : S1 jusqu\'à Wannsee, puis Bus 622 jusqu\'à Stahnsdorf, Friedhof',
  },
  bus: {
    de: 'Bus: Linie 622 ab Wannsee oder Linie 623 ab Teltow',
    en: 'Bus: Line 622 from Wannsee or Line 623 from Teltow',
    fr: 'Bus : Ligne 622 depuis Wannsee ou Ligne 623 depuis Teltow',
  },
  car: {
    de: 'Auto: A115 Ausfahrt Kleinmachnow, dann Richtung Stahnsdorf. Parkplätze am Haupteingang vorhanden.',
    en: 'Car: A115 exit Kleinmachnow, then towards Stahnsdorf. Parking available at the main entrance.',
    fr: 'Voiture : A115 sortie Kleinmachnow, puis direction Stahnsdorf. Parking disponible à l\'entrée principale.',
  },
  accessibilityTitle: { de: 'Barrierefreiheit', en: 'Accessibility', fr: 'Accessibilité' },
  accessibilityText: {
    de: 'Die Hauptwege sind befestigt und mit Rollstuhl oder Kinderwagen befahrbar. Einige Nebenwege sind unbefestigte Waldwege. Bei Nässe kann es rutschig sein. Festes Schuhwerk wird empfohlen.',
    en: 'The main paths are paved and accessible by wheelchair or stroller. Some side paths are unpaved forest trails. It can be slippery when wet. Sturdy footwear is recommended.',
    fr: 'Les chemins principaux sont pavés et accessibles en fauteuil roulant ou poussette. Certains chemins secondaires sont des sentiers forestiers non pavés. Il peut être glissant par temps humide. Des chaussures solides sont recommandées.',
  },
  aboutTitle: { de: 'Über den Friedhof', en: 'About the Cemetery', fr: 'À propos du cimetière' },
  aboutText1: {
    de: 'Der Südwestkirchhof Stahnsdorf wurde 1909 als Waldfriedhof für die Berliner Kirchengemeinden angelegt. Mit über 206 Hektar gehört er zu den größten Friedhöfen Europas. Die Anlage zeichnet sich durch ihren einzigartigen Waldcharakter und die architektonisch bemerkenswerte Hauptkapelle im norwegischen Stabkirchenstil aus.',
    en: 'The Südwestkirchhof Stahnsdorf was established in 1909 as a woodland cemetery for Berlin\'s church congregations. At over 206 hectares, it is one of the largest cemeteries in Europe. The grounds are distinguished by their unique forest character and the architecturally remarkable main chapel in Norwegian stave church style.',
    fr: 'Le Südwestkirchhof Stahnsdorf a été créé en 1909 comme cimetière forestier pour les paroisses de Berlin. Avec plus de 206 hectares, c\'est l\'un des plus grands cimetières d\'Europe. Le site se distingue par son caractère forestier unique et sa chapelle principale remarquable de style église en bois debout norvégien.',
  },
  aboutText2: {
    de: 'Zahlreiche bekannte Persönlichkeiten fanden hier ihre letzte Ruhestätte, darunter Künstler, Wissenschaftler und Politiker. Der Friedhof ist nicht nur ein Ort der Trauer, sondern auch ein bedeutendes Kultur- und Naturdenkmal.',
    en: 'Numerous notable figures found their final resting place here, including artists, scientists, and politicians. The cemetery is not only a place of mourning but also an important cultural and natural monument.',
    fr: 'De nombreuses personnalités y ont trouvé leur dernière demeure, notamment des artistes, des scientifiques et des politiciens. Le cimetière n\'est pas seulement un lieu de deuil, mais aussi un important monument culturel et naturel.',
  },
  contactTitle: { de: 'Kontakt', en: 'Contact', fr: 'Contact' },
  phone: { de: 'Telefon:', en: 'Phone:', fr: 'Téléphone :' },
  website: { de: 'Webseite:', en: 'Website:', fr: 'Site web :' },
}

export default function InfoPage() {
  const locale = useLocale()
  const c = (key: keyof typeof content) => content[key][locale] || content[key].de || ''

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{c('title')}</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>{c('openingTitle')}</h2>
        <p>{c('openingText')}</p>
        <p className={styles.note}>{c('openingNote')}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{c('directionsTitle')}</h2>
        <p><strong>{c('address')}</strong> Bahnhofstraße 2, 14532 Stahnsdorf</p>
        <ul className={styles.list}>
          <li><strong>S-Bahn:</strong> {c('sbahn')}</li>
          <li><strong>Bus:</strong> {c('bus')}</li>
          <li><strong>Auto:</strong> {c('car')}</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{c('accessibilityTitle')}</h2>
        <p>{c('accessibilityText')}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{c('aboutTitle')}</h2>
        <p>{c('aboutText1')}</p>
        <p>{c('aboutText2')}</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{c('contactTitle')}</h2>
        <p>Förderverein Südwestkirchhof Stahnsdorf e.V.</p>
        <p>Bahnhofstraße 2</p>
        <p>14532 Stahnsdorf</p>
        <p>{c('phone')} 0179 3793503</p>
        <p>{c('phone')} 03329 614106</p>
        <p>{c('website')} <a href="https://www.suedwestkirchhof.de" target="_blank" rel="noopener noreferrer">www.suedwestkirchhof.de</a></p>
      </section>
    </div>
  )
}
