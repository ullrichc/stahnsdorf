import { getAllCollections } from '@/lib/content'
import CollectionList from '@/components/CollectionList'

export default function SammlungenPage() {
  const collections = getAllCollections()
  return <CollectionList collections={collections} />
}
