'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from './AuthGate';
import AppIcon from '@/components/AppIcon';

const navItems = [
  { href: '/admin', icon: 'museum', label: 'POIs', exact: true },
  { href: '/admin/collections', icon: 'library_books', label: 'Sammlungen', exact: false },
  { href: '/admin/backup', icon: 'backup', label: 'Backup', exact: false },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };

  return (
    <aside className="admin-sidebar">
      {/* Brand */}
      <div className="admin-sidebar-brand">
        <h1 className="admin-sidebar-title">Südwestkirchhof Stahnsdorf</h1>
        <p className="admin-sidebar-subtitle">Digital Curator Suite</p>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`admin-sidebar-link ${isActive(item.href, item.exact) ? 'active' : ''}`}
          >
            <AppIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <AppIcon name="account_circle" />
          <div>
            <span className="admin-sidebar-user-name">
              {user?.displayName || 'Admin'}
            </span>
            <span className="admin-sidebar-user-role">Archivist Mode</span>
          </div>
        </div>
        <button
          className="admin-sidebar-logout"
          onClick={() => signOut(auth)}
        >
          <AppIcon name="logout" />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
