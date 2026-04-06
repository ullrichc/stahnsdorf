import { AuthGate } from '@/components/admin/AuthGate';
import AdminSidebar from '@/components/admin/AdminSidebar';
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
      <div className="admin-shell">
        <AdminSidebar />
        <div className="admin-main">
          {children}
        </div>
      </div>
    </AuthGate>
  );
}
