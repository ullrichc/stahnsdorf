'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/components/admin/AuthGate';
import type { FirestorePOI, PoiTyp, PublishStatus, Status } from '@/lib/types';
import { t } from '@/lib/i18n';
import Link from 'next/link';

const TYP_LABEL: Record<PoiTyp, string> = {
  grab: 'Grab',
  bauwerk: 'Bauwerk',
  denkmal: 'Denkmal',
  bereich: 'Bereich',
  mausoleum: 'Mausoleum',
  gedenkanlage: 'Gedenkanlage',
};

const PUBLISH_LABEL: Record<PublishStatus, string> = {
  entwurf: 'Entwurf',
  zur_prüfung: 'Zur Prüfung',
  veröffentlicht: 'Veröffentlicht',
};

type SortKey = 'name' | 'typ' | 'status' | 'publish_status' | 'datum_von';
type SortDir = 'asc' | 'desc';

export default function AdminPage() {
  const { user } = useAuth();
  const [pois, setPois] = useState<FirestorePOI[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterTyp, setFilterTyp] = useState<string>('');
  const [filterPublish, setFilterPublish] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [onlyNoCoords, setOnlyNoCoords] = useState(false);

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    loadPOIs();
  }, []);

  async function loadPOIs() {
    setLoading(true);
    try {
      const q = query(collection(db, 'pois'));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => d.data() as FirestorePOI);
      setPois(data);
    } catch (err) {
      console.error('Error loading POIs:', err);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = [...pois];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p) =>
        t(p.name, 'de').toLowerCase().includes(s)
      );
    }
    if (filterTyp) result = result.filter((p) => p.typ === filterTyp);
    if (filterPublish) result = result.filter((p) => p.publish_status === filterPublish);
    if (filterStatus) result = result.filter((p) => p.status === filterStatus);
    if (onlyNoCoords) result = result.filter((p) => !p.koordinaten);

    // Sort
    result.sort((a, b) => {
      let aVal = '';
      let bVal = '';
      switch (sortKey) {
        case 'name':
          aVal = t(a.name, 'de');
          bVal = t(b.name, 'de');
          break;
        case 'typ':
          aVal = a.typ;
          bVal = b.typ;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'publish_status':
          aVal = a.publish_status;
          bVal = b.publish_status;
          break;
        case 'datum_von':
          aVal = a.datum_von ?? '';
          bVal = b.datum_von ?? '';
          break;
      }
      const cmp = aVal.localeCompare(bVal, 'de');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [pois, search, filterTyp, filterPublish, filterStatus, onlyNoCoords, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const stats = useMemo(() => ({
    total: pois.length,
    withCoords: pois.filter((p) => p.koordinaten).length,
    zurPruefung: pois.filter((p) => p.publish_status === 'zur_prüfung').length,
    entwuerfe: pois.filter((p) => p.publish_status === 'entwurf').length,
  }), [pois]);

  if (loading) {
    return <div className="admin-loading"><div className="admin-auth-spinner" /> POIs laden…</div>;
  }

  return (
    <div className="admin-table-container">
      {/* Header */}
      <div className="admin-header">
        <h1>🌲 Südwestkirchhof — Redaktion</h1>
        <div className="admin-header-right">
          <a href="/admin/collections">Sammlungen</a>
          <a href="/admin/backup">Backup</a>
          <span>{user?.email}</span>
          <a href="#" onClick={(e) => { e.preventDefault(); signOut(auth); }}>Abmelden</a>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="🔍 Name suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterTyp} onChange={(e) => setFilterTyp(e.target.value)}>
          <option value="">Alle Typen</option>
          {Object.entries(TYP_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterPublish} onChange={(e) => setFilterPublish(e.target.value)}>
          <option value="">Alle Publish-Status</option>
          {Object.entries(PUBLISH_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Alle Status</option>
          <option value="bestätigt">bestätigt</option>
          <option value="prüfen">prüfen</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={onlyNoCoords}
            onChange={(e) => setOnlyNoCoords(e.target.checked)}
          />
          Nur ohne Koordinaten
        </label>
        <div className="spacer" />
        <Link href="/admin/poi/new" className="admin-btn-new" style={{ textDecoration: 'none' }}>
          + Neuer POI
        </Link>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <span>{stats.total}</span> POIs · <span>{stats.withCoords}</span> mit Koordinaten · <span>{stats.zurPruefung}</span> zur Prüfung · <span>{stats.entwuerfe}</span> Entwürfe
      </div>

      {/* Table */}
      <table className="admin-table">
        <thead>
          <tr>
            <th className={sortKey === 'name' ? 'sorted' : ''} onClick={() => handleSort('name')}>
              Name {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
            </th>
            <th className={sortKey === 'typ' ? 'sorted' : ''} onClick={() => handleSort('typ')}>Typ</th>
            <th className={sortKey === 'status' ? 'sorted' : ''} onClick={() => handleSort('status')}>Status</th>
            <th className={sortKey === 'publish_status' ? 'sorted' : ''} onClick={() => handleSort('publish_status')}>Publish</th>
            <th>📍</th>
            <th className={sortKey === 'datum_von' ? 'sorted' : ''} onClick={() => handleSort('datum_von')}>Zeitraum</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((poi) => (
            <tr key={poi.id}>
              <td className="name-cell">
                <Link href={`/admin/poi/${poi.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {t(poi.name, 'de')}
                </Link>
              </td>
              <td>
                <span className={`badge badge-${poi.typ}`}>
                  {TYP_LABEL[poi.typ] ?? poi.typ}
                </span>
              </td>
              <td>
                <span className={`badge badge-${poi.status === 'bestätigt' ? 'bestaetigt' : 'pruefen'}`}>
                  {poi.status}
                </span>
              </td>
              <td>
                <span className={`badge badge-${poi.publish_status === 'veröffentlicht' ? 'veroeffentlicht' : poi.publish_status === 'zur_prüfung' ? 'zur_pruefung' : 'entwurf'}`}>
                  {PUBLISH_LABEL[poi.publish_status] ?? poi.publish_status}
                </span>
              </td>
              <td className={poi.koordinaten ? 'coord-yes' : 'coord-no'}>
                {poi.koordinaten ? '✅' : '—'}
              </td>
              <td className="dates">
                {poi.datum_von || poi.datum_bis
                  ? `${(poi.datum_von ?? '').slice(0, 4)} – ${(poi.datum_bis ?? '').slice(0, 4)}`
                  : '—'}
              </td>
              <td className="admin-actions">
                <Link href={`/admin/poi/${poi.id}`}>
                  <button title="Bearbeiten">✏️</button>
                </Link>
                <Link href={`/poi/${poi.id}`} target="_blank">
                  <button title="Vorschau">👁️</button>
                </Link>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Keine POIs gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
