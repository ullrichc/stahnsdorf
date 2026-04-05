import poisData from '../../../../../data/pois.json'
import EditPOIClient from './EditPOIClient'

export function generateStaticParams() {
  return (poisData as any[]).map((poi) => ({ id: poi.id }))
}

export default async function EditPOIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditPOIClient id={id} />
}
