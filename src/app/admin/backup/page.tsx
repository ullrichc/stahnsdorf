'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/admin/AuthGate';
import BackupRestore from '@/components/admin/BackupRestore';

export default function BackupPage() {
  const { user } = useAuth();

  return (
    <div className="admin-table-container">
      <div className="admin-header">
        <h1>🌲 Südwestkirchhof — Backup & Restore</h1>
        <div className="admin-header-right">
          <a href="/admin">← POI-Tabelle</a>
          <a href="/admin/collections">Sammlungen</a>
          <span>{user?.email}</span>
          <a href="#" onClick={(e) => { e.preventDefault(); signOut(auth); }}>Abmelden</a>
        </div>
      </div>
      <BackupRestore />
    </div>
  );
}
