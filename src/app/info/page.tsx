import styles from './page.module.css'

export default function InfoPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Informationen</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>Öffnungszeiten</h2>
        <p>Der Südwestkirchhof ist täglich von Sonnenaufgang bis Sonnenuntergang geöffnet.</p>
        <p className={styles.note}>Der Einlass endet 30 Minuten vor Sonnenuntergang.</p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Anfahrt</h2>
        <p><strong>Adresse:</strong> Bahnhofstraße 2, 14532 Stahnsdorf</p>
        <ul className={styles.list}>
          <li><strong>S-Bahn:</strong> S1 bis Wannsee, dann Bus 622 bis Stahnsdorf, Friedhof</li>
          <li><strong>Bus:</strong> Linie 622 ab Wannsee oder Linie 623 ab Teltow</li>
          <li><strong>Auto:</strong> A115 Ausfahrt Kleinmachnow, dann Richtung Stahnsdorf. Parkplätze am Haupteingang vorhanden.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Barrierefreiheit</h2>
        <p>
          Die Hauptwege sind befestigt und mit Rollstuhl oder Kinderwagen befahrbar.
          Einige Nebenwege sind unbefestigte Waldwege. Bei Nässe kann es rutschig sein.
          Festes Schuhwerk wird empfohlen.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Über den Friedhof</h2>
        <p>
          Der Südwestkirchhof Stahnsdorf wurde 1909 als Waldfriedhof für die Berliner
          Kirchengemeinden angelegt. Mit über 206 Hektar gehört er zu den größten
          Friedhöfen Europas. Die Anlage zeichnet sich durch ihren einzigartigen
          Waldcharakter und die architektonisch bemerkenswerte Hauptkapelle im
          norwegischen Stabkirchenstil aus.
        </p>
        <p>
          Zahlreiche bekannte Persönlichkeiten fanden hier ihre letzte Ruhestätte,
          darunter Künstler, Wissenschaftler und Politiker. Der Friedhof ist nicht nur
          ein Ort der Trauer, sondern auch ein bedeutendes Kultur- und Naturdenkmal.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Kontakt</h2>
        <p>Förderverein Südwestkirchhof Stahnsdorf e.V.</p>
        <p>Bahnhofstraße 2</p>
        <p>14532 Stahnsdorf</p>
        <p>Telefon: 0179 3793503</p>
        <p>Telefon: 03329 614106</p>
        <p>Webseite: <a href="https://www.suedwestkirchhof.de" target="_blank" rel="noopener noreferrer">www.suedwestkirchhof.de</a></p>
      </section>
    </div>
  )
}
