import Link from 'next/link'
import { Tour } from '@/lib/types'
import { t } from '@/lib/i18n'
import styles from './TourList.module.css'

type Props = {
  tours: Tour[]
}

export default function TourList({ tours }: Props) {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Touren</h1>
      <div className={styles.list}>
        {tours.map((tour) => (
          <Link key={tour.id} href={`/tour/${tour.id}`} className={styles.card}>
            <h2 className={styles.name}>{t(tour.name)}</h2>
            <p className={styles.description}>{t(tour.description)}</p>
            <div className={styles.meta}>
              <span>{'\u{1F551}'} {tour.duration}</span>
              <span>{'\u{1F4CF}'} {tour.distance}</span>
              <span>{'\u{1F4CD}'} {tour.stops.length} Halte</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
