'use client';

import { use } from 'react';
import POIForm from '@/components/admin/POIForm';

export default function EditPOIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <POIForm poiId={id} />;
}
