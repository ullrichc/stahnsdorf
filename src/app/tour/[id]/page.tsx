import { getAllTours, getTourById } from '@/lib/content'
import Link from 'next/link'
import TourPlayerLoader from '@/components/TourPlayerLoader'

export function generateStaticParams() {
  return getAllTours().map((tour) => ({ id: tour.id }))
}

export default function TourPage({ params }: { params: { id: string } }) {
  const tour = getTourById(params.id)

  if (!tour) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h2>Tour nicht gefunden</h2>
        <Link href="/tours">Zurück zu den Touren</Link>
      </div>
    )
  }

  return <TourPlayerLoader tour={tour} />
}
