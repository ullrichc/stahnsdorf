import dynamic from 'next/dynamic'
import { getAllTours, getTourById } from '@/lib/content'
import Link from 'next/link'

const TourPlayer = dynamic(() => import('@/components/TourPlayer'), { ssr: false })

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

  return <TourPlayer tour={tour} />
}
