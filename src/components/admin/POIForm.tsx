'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, collection as fbCollection, getDocs, query, Timestamp, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/admin/AuthGate';
import { t } from '@/lib/i18n';
import { makePOIIdCandidate } from '@/lib/slug';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import POIImagesEditor from './POIImagesEditor';
import type {
  FirestorePOI,
  PoiTyp,
  PublishStatus,
  Status,
  LocalizedText,
  KoordinatenQuelleTyp,
  KoordinatenGenauigkeit,
  Koordinaten,
  Bild,
} from '@/lib/types';
import { adminPoiEditHref } from '@/lib/redirect';
import { parseCoordinatePair } from '@/lib/geo';
import { normalizeImageForFirestore, assertAtomicWriteLimit } from '@/lib/admin-data';
import { formatHistoricalDate, parseGermanDate } from '@/lib/poi-display';

const TYP_OPTIONS: { value: PoiTyp; label: string }[] = [
  { value: 'grab', label: 'Grab' },
  { value: 'bauwerk', label: 'Bauwerk' },
  { value: 'denkmal', label: 'Denkmal' },
  { value: 'mausoleum', label: 'Mausoleum' },
  { value: 'gedenkanlage', label: 'Gedenkanlage' },
  { value: 'bereich', label: 'Bereich' },
];

const KOORDINATEN_QUELLE_OPTIONS: { value: KoordinatenQuelleTyp; label: string }[] = [
  { value: 'osm', label: 'OpenStreetMap' },
  { value: 'wo-sie-ruhen', label: 'wo-sie-ruhen' },
  { value: 'manuell-osmand', label: 'Manuell OsmAnd' },
  { value: 'manuell-kamera', label: 'Manuell Kamera/EXIF' },
  { value: 'redaktionell', label: 'Redaktionell' },
  { value: 'altbestand', label: 'Altbestand' },
  { value: 'unbekannt', label: 'Unbekannt' },
];

const KOORDINATEN_GENAUIGKEIT_OPTIONS: { value: KoordinatenGenauigkeit; label: string }[] = [
  { value: 'hoch', label: 'hoch' },
  { value: 'mittel', label: 'mittel' },
  { value: 'niedrig', label: 'niedrig' },
];

const defaultPOI: Partial<FirestorePOI> = {
  id: '',
  typ: 'grab',
  name: { de: '' },
  koordinaten: null,
  koordinaten_quelle: null,
  lagehinweis: '',
  lagehinweis_quelle: '',
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
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [coordinateSourceDateInput, setCoordinateSourceDateInput] = useState('');

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
          setDateFromInput(formatHistoricalDate(data.datum_von));
          setDateToInput(formatHistoricalDate(data.datum_bis));
          setCoordinateSourceDateInput(formatHistoricalDate(data.koordinaten_quelle?.datum));
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

    try {
      const nextCoordinates = parseCoordinatePair(currLat, currLng);
      if (!nextCoordinates) {
        setFormData((prev) => ({ ...prev, koordinaten: null, koordinaten_quelle: null }));
        return;
      }

      const originalCoordinates = originalData?.koordinaten;
      const matchesOriginal = !!originalCoordinates
        && originalCoordinates.lat === nextCoordinates.lat
        && originalCoordinates.lng === nextCoordinates.lng;
      setCoordinateSourceDateInput(matchesOriginal
        ? formatHistoricalDate(originalData?.koordinaten_quelle?.datum)
        : '');
      setFormData((prev) => ({
        ...prev,
        koordinaten: nextCoordinates,
        koordinaten_quelle: matchesOriginal
          ? originalData?.koordinaten_quelle ?? null
          : {
          typ: 'redaktionell',
          beleg: 'Admin-Editor',
          genauigkeit: 'mittel',
        },
      }));
    } catch {
      // Raw inputs are validated on save; keep the last complete pair meanwhile.
    }
  }

  function setCoordinateSourceField(
    key: 'typ' | 'beleg' | 'datum' | 'genauigkeit',
    value: string
  ) {
    setFormData((prev) => {
      const current = prev.koordinaten_quelle ?? {
        typ: 'redaktionell' as KoordinatenQuelleTyp,
        beleg: 'Admin-Editor',
        genauigkeit: 'mittel' as KoordinatenGenauigkeit,
      };
      const next = { ...current, [key]: value };
      if (key === 'datum' && !value.trim()) delete next.datum;
      if (key === 'genauigkeit' && !value.trim()) delete next.genauigkeit;
      return { ...prev, koordinaten_quelle: next };
    });
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

    let parsedCoordinates: Koordinaten | null;
    let parsedDateFrom: string | null;
    let parsedDateTo: string | null;
    let parsedCoordinateSourceDate: string | null;
    try {
      parsedCoordinates = parseCoordinatePair(latInput, lngInput);
      parsedDateFrom = parseGermanDate(dateFromInput);
      parsedDateTo = parseGermanDate(dateToInput);
      parsedCoordinateSourceDate = parsedCoordinates
        ? parseGermanDate(coordinateSourceDateInput)
        : null;
    } catch (coordinateError: any) {
      setError(coordinateError.message);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const now = Timestamp.now();
      const docData: any = {
        ...formData,
        koordinaten: parsedCoordinates,
        datum_von: parsedDateFrom,
        datum_bis: parsedDateTo,
        bilder: (formData.bilder ?? []).map(normalizeImageForFirestore),
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
      if (!docData.koordinaten) docData.koordinaten_quelle = null;
      if (docData.koordinaten_quelle) {
        if (parsedCoordinateSourceDate) {
          docData.koordinaten_quelle.datum = parsedCoordinateSourceDate;
        } else {
          delete docData.koordinaten_quelle.datum;
        }
        if (!docData.koordinaten_quelle.genauigkeit) delete docData.koordinaten_quelle.genauigkeit;
      }
      if (!docData.lagehinweis) delete docData.lagehinweis;
      if (!docData.lagehinweis_quelle) delete docData.lagehinweis_quelle;
      docData.quellen = (docData.quellen ?? []).filter((q: string) => q.trim());

      let savedId = poiId!;
      if (isNew) {
        savedId = await runTransaction(db, async (transaction) => {
          for (let attempt = 1; attempt <= 100; attempt++) {
            const candidate = makePOIIdCandidate(name, attempt);
            const candidateRef = doc(db, 'pois', candidate);
            const existing = await transaction.get(candidateRef);
            if (!existing.exists()) {
              transaction.set(candidateRef, { ...docData, id: candidate });
              return candidate;
            }
          }
          throw new Error('Für diesen Namen konnte keine freie POI-ID erzeugt werden.');
        });
      } else {
        await setDoc(doc(db, 'pois', savedId), { ...docData, id: savedId });
      }

      router.push(isNew ? adminPoiEditHref(savedId) : '/admin');
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
      const colSnap = await getDocs(query(fbCollection(db, 'collections')));
      const referencingCollections = colSnap.docs.filter((colDoc) => {
        const data = colDoc.data();
        return Array.isArray(data.pois) && data.pois.includes(poiId);
      });
      assertAtomicWriteLimit(referencingCollections.length + 1);

      const batch = writeBatch(db);
      const now = Timestamp.now();
      for (const colDoc of referencingCollections) {
        const data = colDoc.data();
        const updatedPois = data.pois.filter((id: string) => id !== poiId);
        batch.update(colDoc.ref, {
          pois: updatedPois,
          geaendert_von: user?.email ?? 'unbekannt',
          geaendert_am: now,
        });
      }
      batch.delete(doc(db, 'pois', poiId));
      await batch.commit();

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
        setFormData((prev) => ({
          ...prev,
          koordinaten: { lat, lng },
          koordinaten_quelle: {
            typ: 'redaktionell',
            beleg: 'Admin-Editor Browser-Geolocation',
            genauigkeit: 'mittel',
          },
        }));
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
                  value={dateFromInput}
                  onChange={(e) => setDateFromInput(e.target.value)}
                  placeholder="TT.MM.JJJJ"
                />
                <div className="hint">Geburtsdatum oder Baudatum</div>
              </div>
              <div className="admin-field">
                <label>Datum bis</label>
                <input
                  type="text"
                  value={dateToInput}
                  onChange={(e) => setDateToInput(e.target.value)}
                  placeholder="TT.MM.JJJJ"
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

          {/* Bilder */}
          <div className="admin-section">
            <div className="admin-section-title">Bilder</div>
            <POIImagesEditor
              poiId={poiId}
              bilder={(formData.bilder ?? []) as Bild[]}
              editorEmail={user?.email}
              onChange={(nextImages) => setField('bilder', nextImages)}
            />
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
              <>
                <div className="admin-field">
                  <label>Koordinaten-Herkunft</label>
                  <select
                    value={formData.koordinaten_quelle?.typ ?? 'redaktionell'}
                    onChange={(e) => setCoordinateSourceField('typ', e.target.value)}
                  >
                    {KOORDINATEN_QUELLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>Beleg</label>
                  <input
                    type="text"
                    value={formData.koordinaten_quelle?.beleg ?? ''}
                    onChange={(e) => setCoordinateSourceField('beleg', e.target.value)}
                    placeholder="z.B. OpenStreetMap: node 123"
                  />
                </div>
                <div className="admin-row">
                  <div className="admin-field">
                    <label>Erfassungsdatum</label>
                    <input
                      type="text"
                      value={coordinateSourceDateInput}
                      onChange={(e) => setCoordinateSourceDateInput(e.target.value)}
                      placeholder="TT.MM.JJJJ"
                    />
                  </div>
                  <div className="admin-field">
                    <label>Genauigkeit</label>
                    <select
                      value={formData.koordinaten_quelle?.genauigkeit ?? ''}
                      onChange={(e) => setCoordinateSourceField('genauigkeit', e.target.value)}
                    >
                      <option value="">–</option>
                      {KOORDINATEN_GENAUIGKEIT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  className="admin-btn-secondary"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, koordinaten: null, koordinaten_quelle: null }));
                    setLatInput('');
                    setLngInput('');
                    setCoordinateSourceDateInput('');
                  }}
                >
                  Koordinaten entfernen
                </button>
              </>
            ) : (
              <div className="hint" style={{ marginTop: '4px' }}>
                Keine Koordinaten — POI erscheint nicht auf der Karte
              </div>
            )}

            <div className="admin-field" style={{ marginTop: '16px' }}>
              <label>Lagehinweis</label>
              <textarea
                rows={3}
                value={formData.lagehinweis ?? ''}
                onChange={(e) => setField('lagehinweis', e.target.value)}
                placeholder="z.B. Block Lietzensee, Feld 22, Wahlstelle 115"
              />
            </div>
            <div className="admin-field">
              <label>Lagehinweis-Quelle</label>
              <input
                type="text"
                value={formData.lagehinweis_quelle ?? ''}
                onChange={(e) => setField('lagehinweis_quelle', e.target.value)}
                placeholder="z.B. wo-sie-ruhen.de"
              />
            </div>
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
