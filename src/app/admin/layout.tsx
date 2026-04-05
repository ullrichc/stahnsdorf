import { AuthGate } from '@/components/admin/AuthGate';
import './admin.css';

export const metadata = {
  title: 'Redaktion — Südwestkirchhof Stahnsdorf',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      {children}
    </AuthGate>
  );
}
