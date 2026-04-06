'use client';

import { useState, useRef } from 'react';
import {
  collection as fbCollection,
  getDocs,
  query,
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/admin/AuthGate';
import type { FirestorePOI, FirestoreCollection } from '@/lib/types';
import { t } from '@/lib/i18n';

type ExportMode = 'content' | 'full';

type ImportPreview = {
  newPOIs: string[];
  updatedPOIs: string[];
  unchangedPOIs: string[];
  newCollections: string[];
  updatedCollections: string[];
  invalidRefs: { collection: string; invalidPois: string[] }[];
  data: { pois: any[]; collections: any[] };
  isFullBackup: boolean;
};

export default function BackupRestore() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importStatus, setImportStatus] = useState<'entwurf' | 'veröffentlicht'>('entwurf');
  const [mergeMode, setMergeMode] = useState<'skip' | 'overwrite'>('skip');
  const [deleteMode, setDeleteMode] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Export ---

  async function handleExport(mode: ExportMode) {
    setExporting(true);
    setMessage(null);
    try {
      const [poiSnap, colSnap] = await Promise.all([
        getDocs(query(fbCollection(db, 'pois'))),
        getDocs(query(fbCollection(db, 'collections'))),
      ]);

      const pois = poiSnap.docs.map((d) => {
        const data = d.data();
        if (mode === 'content') {
          // Strip Firestore meta fields
          const { publish_status, erstellt_von, erstellt_am, geaendert_von, geaendert_am, ...clean } = data;
          return clean;
        }
        // Full backup: serialize timestamps
        return {
          ...data,
          erstellt_am: data.erstellt_am?.toDate?.()?.toISOString() ?? null,
          geaendert_am: data.geaendert_am?.toDate?.()?.toISOString() ?? null,
        };
      });

      const collections = colSnap.docs.map((d) => {
        const data = d.data();
        if (mode === 'content') {
          const { publish_status, erstellt_von, erstellt_am, geaendert_von, geaendert_am, ...clean } = data;
          return clean;
        }
        return {
          ...data,
          erstellt_am: data.erstellt_am?.toDate?.()?.toISOString() ?? null,
          geaendert_am: data.geaendert_am?.toDate?.()?.toISOString() ?? null,
        };
      });

      const output = mode === 'content'
        ? { pois, collections }
        : { _backup: true, _timestamp: new Date().toISOString(), pois, collections };

      const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
      a.href = url;
      a.download = mode === 'content'
        ? `stahnsdorf-export-${timestamp}.json`
        : `stahnsdorf-backup-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(`✅ ${mode === 'content' ? 'Inhalts-Export' : 'Vollständiges Backup'} heruntergeladen.`);
    } catch (err: any) {
      setMessage('❌ Export fehlgeschlagen: ' + err.message);
    }
    setExporting(false);
  }

  // --- Import ---

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const isFullBackup = !!data._backup;
      const importPOIs: any[] = data.pois ?? [];
      const importCols: any[] = data.collections ?? [];

      // Basic Runtime Validation
      const isValidPOI = (p: any) => p && typeof p.id === 'string' && p.id.startsWith('poi_sws_') && p.name?.de && typeof p.typ === 'string';
      const isValidCollection = (c: any) => c && typeof c.id === 'string' && c.id.startsWith('collection_sws_') && c.name?.de;

      if (!importPOIs.every(isValidPOI)) throw new Error('Das JSON enthält ungültige POI-Daten (z.B. fehlende Pflichtfelder).');
      if (!importCols.every(isValidCollection)) throw new Error('Das JSON enthält ungültige Collections.');

      // Load existing data for comparison
      const [existingPoiSnap, existingColSnap] = await Promise.all([
        getDocs(query(fbCollection(db, 'pois'))),
        getDocs(query(fbCollection(db, 'collections'))),
      ]);

      const existingPoiIds = new Set(existingPoiSnap.docs.map((d) => d.id));
      const existingColIds = new Set(existingColSnap.docs.map((d) => d.id));

      // All POI IDs that will exist after import
      const allPoiIds = new Set([...existingPoiIds, ...importPOIs.map((p: any) => p.id)]);

      // Referential integrity check
      const invalidRefs: ImportPreview['invalidRefs'] = [];
      for (const col of importCols) {
        const invalid = (col.pois ?? []).filter((pid: string) => !allPoiIds.has(pid));
        if (invalid.length > 0) {
          invalidRefs.push({ collection: col.id, invalidPois: invalid });
        }
      }

      setPreview({
        newPOIs: importPOIs.filter((p: any) => !existingPoiIds.has(p.id)).map((p: any) => p.id),
        updatedPOIs: importPOIs.filter((p: any) => existingPoiIds.has(p.id)).map((p: any) => p.id),
        unchangedPOIs: [],
        newCollections: importCols.filter((c: any) => !existingColIds.has(c.id)).map((c: any) => c.id),
        updatedCollections: importCols.filter((c: any) => existingColIds.has(c.id)).map((c: any) => c.id),
        invalidRefs,
        data: { pois: importPOIs, collections: importCols },
        isFullBackup,
      });
    } catch (err: any) {
      setMessage('❌ Datei konnte nicht gelesen werden: ' + err.message);
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  }

  async function executeImport() {
    if (!preview) return;
    setImporting(true);
    setMessage(null);

    try {
      const now = Timestamp.now();
      let poiCount = 0;
      let colCount = 0;

      const existingPoiSnap = await getDocs(query(fbCollection(db, 'pois')));
      const existingColSnap = await getDocs(query(fbCollection(db, 'collections')));
      const existingPois = new Map(existingPoiSnap.docs.map(d => [d.id, d.data()]));
      const existingCols = new Map(existingColSnap.docs.map(d => [d.id, d.data()]));

      for (const poi of preview.data.pois) {
        const isExisting = preview.updatedPOIs.includes(poi.id);
        if (isExisting && mergeMode === 'skip') continue;

        const docData: any = { ...poi };
        const existing = existingPois.get(poi.id);

        if (preview.isFullBackup) {
          // Restore timestamps from ISO strings
          if (docData.erstellt_am) docData.erstellt_am = Timestamp.fromDate(new Date(docData.erstellt_am));
          if (docData.geaendert_am) docData.geaendert_am = Timestamp.fromDate(new Date(docData.geaendert_am));
        } else {
          // Content import — add Firestore fields
          docData.publish_status = importStatus;
          docData.erstellt_am = now;
          docData.geaendert_am = now;
        }

        // --- Enforce Security Rules (Fix BUG-06, BUG-07) ---
        if (isExisting && existing) {
          docData.erstellt_von = existing.erstellt_von;
          docData.erstellt_am = existing.erstellt_am;
        } else {
          docData.erstellt_von = user?.email ?? 'import';
        }
        docData.geaendert_von = user?.email ?? 'import';

        await setDoc(doc(db, 'pois', poi.id), docData);
        poiCount++;
      }

      // All POI IDs that now exist
      const allPoiIds = new Set([
        ...preview.updatedPOIs,
        ...preview.newPOIs,
        ...(await getDocs(query(fbCollection(db, 'pois')))).docs.map((d) => d.id),
      ]);

      for (const col of preview.data.collections) {
        const isExisting = preview.updatedCollections.includes(col.id);
        if (isExisting && mergeMode === 'skip') continue;

        const docData: any = { ...col };
        const existing = existingCols.get(col.id);

        // Strip invalid POI references
        docData.pois = (docData.pois ?? []).filter((pid: string) => allPoiIds.has(pid));

        if (preview.isFullBackup) {
          if (docData.erstellt_am) docData.erstellt_am = Timestamp.fromDate(new Date(docData.erstellt_am));
          if (docData.geaendert_am) docData.geaendert_am = Timestamp.fromDate(new Date(docData.geaendert_am));
        } else {
          docData.publish_status = importStatus;
          docData.erstellt_am = now;
          docData.geaendert_am = now;
        }

        // --- Enforce Security Rules (Fix BUG-06, BUG-07) ---
        if (isExisting && existing) {
          docData.erstellt_von = existing.erstellt_von;
          docData.erstellt_am = existing.erstellt_am;
        } else {
          docData.erstellt_von = user?.email ?? 'import';
        }
        docData.geaendert_von = user?.email ?? 'import';

        await setDoc(doc(db, 'collections', col.id), docData);
        colCount++;
      }

      let deleteCount = 0;
      if (preview.isFullBackup && deleteMode) {
        // Find documents in DB that are not in backup and delete them
        const backupPoiIds = new Set(preview.data.pois.map((p: any) => p.id));
        const backupColIds = new Set(preview.data.collections.map((c: any) => c.id));

        for (const pd of existingPoiSnap.docs) {
          if (!backupPoiIds.has(pd.id)) {
            await deleteDoc(doc(db, 'pois', pd.id));
            deleteCount++;
          }
        }
        for (const cd of existingColSnap.docs) {
          if (!backupColIds.has(cd.id)) {
            await deleteDoc(doc(db, 'collections', cd.id));
            deleteCount++;
          }
        }
      }

      setMessage(`✅ Import abgeschlossen: ${poiCount} POIs, ${colCount} Collections.${deleteCount > 0 ? ` (${deleteCount} veraltete gelöscht)` : ''}`);
      setPreview(null);
    } catch (err: any) {
      setMessage('❌ Import fehlgeschlagen: ' + err.message);
    }
    setImporting(false);
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <h2 style={{ color: 'var(--admin-text)', marginBottom: '24px' }}>Backup & Restore</h2>

      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '6px', marginBottom: '16px',
          background: message.startsWith('✅') ? '#1d3d2f' : '#3d1a1a',
          color: message.startsWith('✅') ? '#6ad4a7' : '#e57373',
          fontSize: '14px',
        }}>
          {message}
        </div>
      )}

      {/* Export */}
      <div className="admin-section">
        <div className="admin-section-title">Export</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="admin-btn-new"
            onClick={() => handleExport('content')}
            disabled={exporting}
            title="Exportiert saubere JSON (POIs und Sammlungen) ohne interne Metadaten wie Autoren oder Status."
          >
            📄 Inhalte exportieren
          </button>
          <button
            className="admin-btn-secondary"
            onClick={() => handleExport('full')}
            disabled={exporting}
            style={{ padding: '8px 16px' }}
            title="Exportiert ein exaktes Abbild der Datenbank, um es bei Bedarf vollständig und ohne Datenverlust wiederherzustellen."
          >
            💾 Backup herunterladen
          </button>
        </div>
      </div>

      {/* Import */}
      <div className="admin-section">
        <div className="admin-section-title">Import</div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          className="admin-btn-secondary"
          onClick={() => fileRef.current?.click()}
          style={{ padding: '8px 16px' }}
          title="Fügt Daten hinzu oder überschreibt bestehende. Ihre aktuelle Datenbank wird dabei nicht gelöscht (außer bei explizitem Backup-Restore)."
        >
          📂 Aus JSON importieren
        </button>
      </div>

      {/* Import Preview */}
      {preview && (
        <div style={{
          background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
          borderRadius: '8px', padding: '20px', marginTop: '16px',
        }}>
          <h3 style={{ color: 'var(--admin-text)', marginBottom: '16px' }}>
            Import-Vorschau {preview.isFullBackup && '(Backup)'}
          </h3>

          <div style={{ fontSize: '14px', color: 'var(--admin-text)', lineHeight: '1.8' }}>
            <div>🆕 <strong>{preview.newPOIs.length}</strong> neue POIs</div>
            <div>✏️ <strong>{preview.updatedPOIs.length}</strong> bestehende POIs</div>
            <div>📂 <strong>{preview.newCollections.length}</strong> neue Collections</div>
            <div>✏️ <strong>{preview.updatedCollections.length}</strong> bestehende Collections</div>
          </div>

          {preview.invalidRefs.length > 0 && (
            <div style={{
              background: '#3d3520', border: '1px solid #4d4520',
              borderRadius: '6px', padding: '12px', marginTop: '12px',
              fontSize: '13px', color: '#d4d46a',
            }}>
              ⚠️ <strong>Ungültige Referenzen</strong> (werden beim Import entfernt):
              {preview.invalidRefs.map((r) => (
                <div key={r.collection} style={{ marginTop: '4px' }}>
                  Collection <code>{r.collection}</code>: {r.invalidPois.join(', ')}
                </div>
              ))}
            </div>
          )}

          {/* Import Options */}
          {!preview.isFullBackup && (
            <div className="admin-field" style={{ marginTop: '16px' }}>
              <label>Publish-Status für importierte Einträge:</label>
              <select
                value={importStatus}
                onChange={(e) => setImportStatus(e.target.value as any)}
              >
                <option value="entwurf">Entwurf</option>
                <option value="veröffentlicht">Veröffentlicht</option>
              </select>
            </div>
          )}

          {(preview.updatedPOIs.length > 0 || preview.updatedCollections.length > 0) && (
            <div className="admin-field" style={{ marginTop: '12px' }}>
              <label>Bei bestehenden Einträgen:</label>
              <select value={mergeMode} onChange={(e) => setMergeMode(e.target.value as any)}>
                <option value="skip">Überspringen</option>
                <option value="overwrite">Überschreiben</option>
              </select>
            </div>
          )}

          {preview.isFullBackup && (
            <div className="admin-field" style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e57373' }}>
                <input 
                  type="checkbox" 
                  checked={deleteMode} 
                  onChange={(e) => setDeleteMode(e.target.checked)} 
                  style={{ accentColor: '#e57373', width: '16px', height: '16px', minWidth: '16px' }}
                />
                Zusätzliche Einträge aus der Onlinedatenbank komplett löschen (Destruktiv)
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="admin-btn-cancel" onClick={() => setPreview(null)}>Abbrechen</button>
            <button className="admin-btn-save" onClick={executeImport} disabled={importing}>
              {importing ? 'Importieren…' : 'Jetzt importieren'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
