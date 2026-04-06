'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, deleteDoc, collection as fbCollection, getDocs, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/admin/AuthGate';
import { t } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  FirestorePOI,
  PoiTyp,
  PublishStatus,
  Status,
  LocalizedText,
  Koordinaten,
  Bild,
} from '@/lib/types';

const TYP_OPTIONS: { value: PoiTyp; label: string }[] = [
  { value: 'grab', label: 'Grab' },
  { value: 'bauwerk', label: 'Bauwerk' },
  { value: 'denkmal', label: 'Denkmal' },
  { value: 'mausoleum', label: 'Mausoleum' },
  { value: 'gedenkanlage', label: 'Gedenkanlage' },
  { value: 'bereich', label: 'Bereich' },
];

const defaultPOI: Partial<FirestorePOI> = {
  id: '',
  typ: 'grab',
  name: { de: '' },
  koordinaten: null,
  kurztext: { de: '' },
  beschreibung: { de: '' },
  datum_von: null,
  datum_bis: null,
  wikipedia_url: null,
  bilder: [],
  audio: {},
  quellen: [],
  status: 'prüfen',
  notiz: '',
  publish_status: 'entwurf',
};

type POIFormProps = {
  poiId?: string; // undefined = new POI
};

export default function POIForm({ poiId }: POIFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const isNew = !poiId;

  const [formData, setFormData] = useState<Partial<FirestorePOI>>({ ...defaultPOI });
  const [originalData, setOriginalData] = useState<FirestorePOI | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing POI
  useEffect(() => {
    if (!poiId) return;

    async function loadPOI() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'pois', poiId!));
        if (snap.exists()) {
          const data = snap.data() as FirestorePOI;
          setFormData(data);
          setOriginalData(data);
          if (data.koordinaten) {
            setLatInput(data.koordinaten.lat.toString());
            setLngInput(data.koordinaten.lng.toString());
          }
        } else {
          setError('POI nicht gefunden.');
        }
      } catch (err: any) {
        setError('Fehler beim Laden: ' + err.message);
      }
      setLoading(false);
    }
    loadPOI();
  }, [poiId]);

  // --- Field setters ---

  function setField<K extends keyof FirestorePOI>(key: K, value: FirestorePOI[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function setLocalizedField(key: 'name' | 'kurztext' | 'beschreibung', lang: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as LocalizedText), [lang]: value },
    }));
  }

  function setQuelle(index: number, value: string) {
    const quellen = [...(formData.quellen ?? [])];
    quellen[index] = value;
    setField('quellen', quellen);
  }

  function addQuelle() {
    setField('quellen', [...(formData.quellen ?? []), '']);
  }

  function removeQuelle(index: number) {
    const quellen = [...(formData.quellen ?? [])];
    quellen.splice(index, 1);
    setField('quellen', quellen);
  }

  const [latInput, setLatInput] = useState<string>('');
  const [lngInput, setLngInput] = useState<string>('');

  function handleCoordChange(type: 'lat' | 'lng', val: string) {
    if (type === 'lat') setLatInput(val);
    else setLngInput(val);

    const currLat = type === 'lat' ? val : latInput;
    const currLng = type === 'lng' ? val : lngInput;

    const latNum = parseFloat(currLat);
    const lngNum = parseFloat(currLng);

    if (!isNaN(latNum) && !isNaN(lngNum)) {
      setField('koordinaten', { lat: latNum, lng: lngNum });
    } else if (!currLat.trim() && !currLng.trim()) {
      setField('koordinaten', null);
    }
  }

  // --- Publish Workflow ---

  function handlePublishAction(newStatus: PublishStatus) {
    setField('publish_status', newStatus);
  }

  // --- Save ---

  async function handleSave() {
    const name = (formData.name as LocalizedText)?.de;
    if (!name?.trim()) {
      setError('Name (de) ist ein Pflichtfeld.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = Timestamp.now();
      const id = isNew
        ? 'poi_sws_' + name.toLowerCase().replace(/[^a-z0-9äöüß]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        : poiId!;

      const docData: any = {
        ...formData,
        id,
        geaendert_von: user?.email ?? 'unbekannt',
        geaendert_am: now,
      };

      if (isNew) {
        docData.erstellt_von = user?.email ?? 'unbekannt';
        docData.erstellt_am = now;
      } else {
        // Keep original creation data
        docData.erstellt_von = originalData?.erstellt_von ?? user?.email ?? 'unbekannt';
        docData.erstellt_am = originalData?.erstellt_am ?? now;
      }

      // Clean up empty optionals
      if (!docData.datum_von) docData.datum_von = null;
      if (!docData.datum_bis) docData.datum_bis = null;
      if (!docData.wikipedia_url) docData.wikipedia_url = null;
      if (!docData.notiz) docData.notiz = '';
      docData.quellen = (docData.quellen ?? []).filter((q: string) => q.trim());

      await setDoc(doc(db, 'pois', id), docData);

      router.push('/admin');
    } catch (err: any) {
      setError('Fehler beim Speichern: ' + err.message);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (isNew || !poiId) return;
    if (!window.confirm('POI wirklich dauerhaft löschen?')) return;
    
    setSaving(true);
    try {
      // 1. Delete POI
      await deleteDoc(doc(db, 'pois', poiId));

      // 2. Remove POI reference from all collections
      const colSnap = await getDocs(query(fbCollection(db, 'collections')));
      for (const colDoc of colSnap.docs) {
        const data = colDoc.data();
        if (data.pois && Array.isArray(data.pois) && data.pois.includes(poiId)) {
          const updatedPois = data.pois.filter((id: string) => id !== poiId);
          await setDoc(doc(db, 'collections', colDoc.id), { ...data, pois: updatedPois });
        }
      }

      router.push('/admin');
    } catch (err: any) {
      setError('Fehler beim Löschen: ' + err.message);
      setSaving(false);
    }
  }

  // --- GPS ---

  function handleLocate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1e6) / 1e6;
        const lng = Math.round(pos.coords.longitude * 1e6) / 1e6;
        setField('koordinaten', { lat, lng });
        setLatInput(lat.toString());
        setLngInput(lng.toString());
      },
      (err) => setError('GPS-Position konnte nicht ermittelt werden.'),
      { enableHighAccuracy: true }
    );
  }

  if (loading) {
    return <div className="admin-loading"><div className="admin-auth-spinner" /> POI laden…</div>;
  }

  const currentStatus = formData.publish_status ?? 'entwurf';

  return (
    <div>
      {/* Header */}
      <div className="admin-header">
        <h1>{isNew ? '+ Neuer POI' : `✏️ ${t(formData.name as LocalizedText, 'de')}`}</h1>
        <div className="admin-header-right">
          <Link href="/admin">← Zurück zur Übersicht</Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 24px', background: '#3d1a1a', color: '#e57373', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div className="admin-editor">
        {/* Left Column — Content */}
        <div className="admin-editor-left">

          {/* Grunddaten */}
          <div className="admin-section">
            <div className="admin-section-title">Grunddaten</div>

            <div className="admin-field">
              <label>Typ</label>
              <select
                value={formData.typ ?? 'grab'}
                onChange={(e) => setField('typ', e.target.value as PoiTyp)}
              >
                {TYP_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="admin-field">
              <label>Name <span className="required">*</span></label>
              <input
                type="text"
                value={(formData.name as LocalizedText)?.de ?? ''}
                onChange={(e) => setLocalizedField('name', 'de', e.target.value)}
                placeholder="z.B. Heinrich Zille"
              />
            </div>

            <div className="admin-field">
              <label>Kurztext</label>
              <input
                type="text"
                value={(formData.kurztext as LocalizedText)?.de ?? ''}
                onChange={(e) => setLocalizedField('kurztext', 'de', e.target.value)}
                placeholder="Einzeiler für die Kartenansicht"
              />
            </div>

            <div className="admin-field">
              <label>Beschreibung</label>
              <textarea
                rows={6}
                value={(formData.beschreibung as LocalizedText)?.de ?? ''}
                onChange={(e) => setLocalizedField('beschreibung', 'de', e.target.value)}
                placeholder="Inhaltliche Beschreibung…"
              />
            </div>
          </div>

          {/* Daten & Links */}
          <div className="admin-section">
            <div className="admin-section-title">Daten & Links</div>
            <div className="admin-row">
              <div className="admin-field">
                <label>Datum von</label>
                <input
                  type="text"
                  value={formData.datum_von ?? ''}
                  onChange={(e) => setField('datum_von', e.target.value || null)}
                  placeholder="YYYY-MM-DD"
                />
                <div className="hint">Geburtsdatum oder Baudatum</div>
              </div>
              <div className="admin-field">
                <label>Datum bis</label>
                <input
                  type="text"
                  value={formData.datum_bis ?? ''}
                  onChange={(e) => setField('datum_bis', e.target.value || null)}
                  placeholder="YYYY-MM-DD"
                />
                <div className="hint">Sterbedatum oder Abriss</div>
              </div>
            </div>
            <div className="admin-field">
              <label>Wikipedia-URL</label>
              <input
                type="url"
                value={formData.wikipedia_url ?? ''}
                onChange={(e) => setField('wikipedia_url', e.target.value || null)}
                placeholder="https://de.wikipedia.org/wiki/..."
              />
            </div>
          </div>

          {/* Quellen */}
          <div className="admin-section">
            <div className="admin-section-title">Quellen</div>
            <ul className="source-list">
              {(formData.quellen ?? []).map((q, i) => (
                <li key={i}>
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQuelle(i, e.target.value)}
                    placeholder="Freitext-Quellenangabe"
                  />
                  <button className="btn-remove" onClick={() => removeQuelle(i)}>✕</button>
                </li>
              ))}
            </ul>
            <button className="btn-add" onClick={addQuelle}>+ Quelle hinzufügen</button>
          </div>

        </div>

        {/* Right Column — Sidebar */}
        <div className="admin-editor-right">

          {/* Position */}
          <div className="admin-section">
            <div className="admin-section-title">Position</div>
            <div className="coord-row">
              <div className="admin-field">
                <label>Lat</label>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => handleCoordChange('lat', e.target.value)}
                  placeholder="52.xxxxx"
                />
              </div>
              <div className="admin-field">
                <label>Lng</label>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => handleCoordChange('lng', e.target.value)}
                  placeholder="13.xxxxx"
                />
              </div>
              <button className="btn-locate" onClick={handleLocate} title="Mein Standort">
                📍
              </button>
            </div>
            {formData.koordinaten ? (
              <button
                className="admin-btn-secondary"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={() => {
                  setField('koordinaten', null);
                  setLatInput('');
                  setLngInput('');
                }}
              >
                Koordinaten entfernen
              </button>
            ) : (
              <div className="hint" style={{ marginTop: '4px' }}>
                Keine Koordinaten — POI erscheint nicht auf der Karte
              </div>
            )}
          </div>

          {/* Veröffentlichung */}
          <div className="admin-section">
            <div className="admin-section-title">Veröffentlichung</div>
            <div className="publish-status">
              <div className="publish-current">
                <span className={`badge badge-${currentStatus === 'veröffentlicht' ? 'veroeffentlicht' : currentStatus === 'zur_prüfung' ? 'zur_pruefung' : 'entwurf'}`}>
                  {currentStatus === 'entwurf' && 'Entwurf'}
                  {currentStatus === 'zur_prüfung' && 'Zur Prüfung'}
                  {currentStatus === 'veröffentlicht' && 'Veröffentlicht'}
                </span>
              </div>
              <div className="workflow-btns">
                {currentStatus === 'entwurf' && (
                  <button className="btn-workflow btn-submit" onClick={() => handlePublishAction('zur_prüfung')}>
                    Zur Prüfung einreichen
                  </button>
                )}
                {currentStatus === 'zur_prüfung' && (
                  <>
                    <button className="btn-workflow btn-publish" onClick={() => handlePublishAction('veröffentlicht')}>
                      Veröffentlichen
                    </button>
                    <button className="btn-workflow btn-unpublish" onClick={() => handlePublishAction('entwurf')}>
                      Zurück zum Entwurf
                    </button>
                  </>
                )}
                {currentStatus === 'veröffentlicht' && (
                  <button className="btn-workflow btn-unpublish" onClick={() => handlePublishAction('entwurf')}>
                    Zurückziehen
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Redaktion */}
          <div className="admin-section">
            <div className="admin-section-title">Redaktion</div>
            <div className="admin-field">
              <label>Status</label>
              <select
                value={formData.status ?? 'prüfen'}
                onChange={(e) => setField('status', e.target.value as Status)}
              >
                <option value="prüfen">prüfen</option>
                <option value="bestätigt">bestätigt</option>
              </select>
            </div>
            <div className="admin-field">
              <label>Notiz (intern)</label>
              <textarea
                rows={3}
                value={formData.notiz ?? ''}
                onChange={(e) => setField('notiz', e.target.value)}
                placeholder="Lagehinweise, Unsicherheiten…"
              />
            </div>
          </div>

          {/* Metadaten */}
          {!isNew && originalData && (
            <div className="admin-section">
              <div className="admin-section-title">Metadaten</div>
              <div className="admin-meta-info">
                <div><strong>Erstellt von:</strong> {originalData.erstellt_von}</div>
                <div><strong>Erstellt am:</strong> {originalData.erstellt_am?.toDate?.()?.toLocaleDateString('de') ?? '–'}</div>
                <div><strong>Geändert von:</strong> {originalData.geaendert_von}</div>
                <div><strong>Geändert am:</strong> {originalData.geaendert_am?.toDate?.()?.toLocaleDateString('de') ?? '–'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Bar */}
      <div className="admin-save-bar">
        {!isNew && (
          <button className="admin-btn-cancel" style={{ color: '#e57373', borderColor: '#e57373' }} onClick={handleDelete} disabled={saving}>
            Löschen
          </button>
        )}
        <div className="spacer" style={{ flexGrow: 1 }} />
        <button className="admin-btn-cancel" onClick={() => router.push('/admin')}>Abbrechen</button>
        <button className="admin-btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
      </div>
    </div>
  );
}
