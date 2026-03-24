'use client'
import dynamic from 'next/dynamic'
import { Tour } from '@/lib/types'

const TourPlayer = dynamic(() => import('./TourPlayer'), { ssr: false })

export default function TourPlayerLoader({ tour }: { tour: Tour }) {
  return <TourPlayer tour={tour} />
}
