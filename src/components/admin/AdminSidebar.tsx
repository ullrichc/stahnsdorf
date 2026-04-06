'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from './AuthGate';

const navItems = [
  { href: '/admin', icon: 'grid_view', label: 'Übersicht', exact: true },
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
        <h1 className="admin-sidebar-title">The Eternal Archive</h1>
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
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <span className="material-symbols-outlined">account_circle</span>
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
          <span className="material-symbols-outlined">logout</span>
          Abmelden
        </button>
      </div>
    </aside>
  );
}
