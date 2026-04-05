'use client';

import POIForm from '@/components/admin/POIForm';

export default function EditPOIClient({ id }: { id: string }) {
  return <POIForm poiId={id} />;
}
