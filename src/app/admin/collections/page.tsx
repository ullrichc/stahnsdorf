'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection as fbCollection,
  getDocs,
  query,
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { useAuth } from '@/components/admin/AuthGate';
import { t } from '@/lib/i18n';
import type {
  FirestoreCollection,
  FirestorePOI,
  PublishStatus,
  Status,
  LocalizedText,
} from '@/lib/types';

const PUBLISH_LABEL: Record<PublishStatus, string> = {
  entwurf: 'Entwurf',
  zur_prüfung: 'Zur Prüfung',
  veröffentlicht: 'Veröffentlicht',
};

type EditingCollection = Partial<FirestoreCollection> & { _isNew?: boolean };

export default function CollectionsPage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<FirestoreCollection[]>([]);
  const [allPOIs, setAllPOIs] = useState<FirestorePOI[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingCollection | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poiSearch, setPoiSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [colSnap, poiSnap] = await Promise.all([
        getDocs(query(fbCollection(db, 'collections'))),
        getDocs(query(fbCollection(db, 'pois'))),
      ]);
      setCollections(colSnap.docs.map((d) => d.data() as FirestoreCollection));
      setAllPOIs(poiSnap.docs.map((d) => d.data() as FirestorePOI));
    } catch (err) {
      console.error('Error loading data:', err);
    }
    setLoading(false);
  }

  // --- Edit ---

  function startEdit(col: FirestoreCollection) {
    setEditing({ ...col });
    setError(null);
  }

  function startNew() {
    setEditing({
      id: '',
      name: { de: '' },
      kurztext: { de: '' },
      beschreibung: { de: '' },
      pois: [],
      status: 'prüfen',
      notiz: '',
      publish_status: 'entwurf',
      _isNew: true,
    });
    setError(null);
  }

  function setEditField(key: string, value: any) {
    setEditing((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function setEditLocalized(key: string, value: string) {
    setEditing((prev) =>
      prev ? { ...prev, [key]: { ...(prev[key as keyof EditingCollection] as any ?? {}), de: value } } : prev
    );
  }

  function togglePOI(poiId: string) {
    const current = editing?.pois ?? [];
    if (current.includes(poiId)) {
      setEditField('pois', current.filter((id) => id !== poiId));
    } else {
      setEditField('pois', [...current, poiId]);
    }
  }

  async function handleSave() {
    if (!editing) return;
    const name = (editing.name as LocalizedText)?.de;
    if (!name?.trim()) {
      setError('Name (de) ist ein Pflichtfeld.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = Timestamp.now();
      const id = editing._isNew
        ? 'col_sws_' + name.toLowerCase().replace(/[^a-z0-9äöüß]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        : editing.id!;

      const { _isNew, ...rest } = editing;
      const docData: any = {
        ...rest,
        id,
        geaendert_von: user?.email ?? 'unbekannt',
        geaendert_am: now,
      };

      if (_isNew) {
        docData.erstellt_von = user?.email ?? 'unbekannt';
        docData.erstellt_am = now;
      }

      await setDoc(doc(db, 'collections', id), docData);
      setEditing(null);
      await loadData();
    } catch (err: any) {
      setError('Fehler beim Speichern: ' + err.message);
    }
    setSaving(false);
  }

  // Filtered POIs for selection
  const filteredPOIs = useMemo(() => {
    if (!poiSearch) return allPOIs;
    const s = poiSearch.toLowerCase();
    return allPOIs.filter((p) => t(p.name, 'de').toLowerCase().includes(s));
  }, [allPOIs, poiSearch]);

  if (loading) {
    return <div className="admin-loading"><div className="admin-auth-spinner" /> Collections laden…</div>;
  }

  return (
    <div className="admin-table-container">
      {/* Header */}
      <div className="admin-header">
        <h1>🌲 Südwestkirchhof — Sammlungen</h1>
        <div className="admin-header-right">
          <a href="/admin">← POI-Tabelle</a>
          <span>{user?.email}</span>
          <a href="#" onClick={(e) => { e.preventDefault(); signOut(auth); }}>Abmelden</a>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 24px', background: '#3d1a1a', color: '#e57373', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#e0e0e0', fontSize: '18px' }}>{collections.length} Sammlungen</h2>
          <button className="admin-btn-new" onClick={startNew}>+ Neue Sammlung</button>
        </div>

        {/* Collection List */}
        <div style={{ display: 'grid', gap: '12px' }}>
          {collections.map((col) => (
            <div
              key={col.id}
              onClick={() => startEdit(col)}
              style={{
                background: 'var(--admin-surface)',
                border: '1px solid var(--admin-border)',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--admin-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--admin-border)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: 'var(--admin-text)' }}>{t(col.name, 'de')}</strong>
                  <span style={{ color: 'var(--admin-muted)', marginLeft: '12px', fontSize: '13px' }}>
                    {col.pois?.length ?? 0} POIs
                  </span>
                </div>
                <span className={`badge badge-${col.publish_status === 'veröffentlicht' ? 'veroeffentlicht' : col.publish_status === 'zur_prüfung' ? 'zur_pruefung' : 'entwurf'}`}>
                  {PUBLISH_LABEL[col.publish_status] ?? col.publish_status}
                </span>
              </div>
              {col.kurztext && (
                <p style={{ color: 'var(--admin-muted)', fontSize: '13px', marginTop: '6px' }}>
                  {t(col.kurztext, 'de')}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Edit Modal (inline) */}
        {editing && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000,
          }}>
            <div style={{
              background: 'var(--admin-surface)', borderRadius: '12px',
              padding: '32px', width: '640px', maxHeight: '80vh', overflowY: 'auto',
              border: '1px solid var(--admin-border)',
            }}>
              <h2 style={{ color: 'var(--admin-text)', marginBottom: '20px' }}>
                {editing._isNew ? '+ Neue Sammlung' : `✏️ ${t(editing.name as LocalizedText, 'de')}`}
              </h2>

              <div className="admin-field">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={(editing.name as LocalizedText)?.de ?? ''}
                  onChange={(e) => setEditLocalized('name', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Kurztext</label>
                <input
                  type="text"
                  value={(editing.kurztext as LocalizedText)?.de ?? ''}
                  onChange={(e) => setEditLocalized('kurztext', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Beschreibung</label>
                <textarea
                  rows={4}
                  value={(editing.beschreibung as LocalizedText)?.de ?? ''}
                  onChange={(e) => setEditLocalized('beschreibung', e.target.value)}
                />
              </div>

              <div className="admin-field">
                <label>Publish-Status</label>
                <select
                  value={editing.publish_status ?? 'entwurf'}
                  onChange={(e) => setEditField('publish_status', e.target.value)}
                >
                  <option value="entwurf">Entwurf</option>
                  <option value="zur_prüfung">Zur Prüfung</option>
                  <option value="veröffentlicht">Veröffentlicht</option>
                </select>
              </div>

              <div className="admin-field">
                <label>Notiz (intern)</label>
                <textarea
                  rows={2}
                  value={editing.notiz ?? ''}
                  onChange={(e) => setEditField('notiz', e.target.value)}
                />
              </div>

              {/* POI Selection */}
              <div className="admin-section">
                <div className="admin-section-title">
                  POIs ({(editing.pois ?? []).length} ausgewählt)
                </div>
                <input
                  type="search"
                  placeholder="POI suchen…"
                  value={poiSearch}
                  onChange={(e) => setPoiSearch(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--admin-input-bg)',
                    border: '1px solid var(--admin-border)', color: 'var(--admin-text)',
                    padding: '8px 12px', borderRadius: '6px', marginBottom: '8px',
                  }}
                />
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredPOIs.map((poi) => (
                    <label key={poi.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '4px 0', cursor: 'pointer', fontSize: '14px',
                      color: 'var(--admin-text)',
                    }}>
                      <input
                        type="checkbox"
                        checked={(editing.pois ?? []).includes(poi.id)}
                        onChange={() => togglePOI(poi.id)}
                        style={{ accentColor: 'var(--admin-green)' }}
                      />
                      {t(poi.name, 'de')}
                      <span style={{ color: 'var(--admin-muted)', fontSize: '12px' }}>
                        ({poi.typ})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="admin-btn-cancel" onClick={() => setEditing(null)}>Abbrechen</button>
                <button className="admin-btn-save" onClick={handleSave} disabled={saving}>
                  {saving ? 'Speichern…' : 'Speichern'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
