import { Suspense } from 'react'
import EditPOIQueryClient from './EditPOIQueryClient'

export default function EditPOIPage() {
  return (
    <Suspense fallback={null}>
      <EditPOIQueryClient />
    </Suspense>
  )
}
