import { getAllTours } from '@/lib/content'
import TourList from '@/components/TourList'

export default function ToursPage() {
  const tours = getAllTours()
  return <TourList tours={tours} />
}
