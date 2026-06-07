'use client';

import { useRef, useState } from 'react';
import { doc, Timestamp, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import {
  buildPOIImageStoragePaths,
  DEFAULT_IMAGE_CREDIT,
  extractCredit,
  getImageDisplayUrl,
  optimizeImageForUpload,
  readBrowserImageMetadata,
  validateImageFile,
} from '@/lib/images';
import type { Bild } from '@/lib/types';

type Props = {
  poiId?: string;
  bilder: Bild[];
  editorEmail?: string | null;
  onChange: (bilder: Bild[]) => void;
};

export default function POIImagesEditor({ poiId, bilder, editorEmail, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canUpload = !!poiId;

  async function persist(next: Bild[]) {
    if (!poiId) return;
    await updateDoc(doc(db, 'pois', poiId), {
      bilder: next,
      geaendert_von: editorEmail ?? 'unbekannt',
      geaendert_am: Timestamp.now(),
    });
    onChange(next);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !poiId) return;
    setBusy(true);
    setMessage(null);

    try {
      let nextImages = [...bilder];

      for (const file of Array.from(files)) {
        const validation = validateImageFile(file);
        if (!validation.ok) {
          setMessage(validation.message);
          continue;
        }

        const metadata = await readBrowserImageMetadata(file).catch(() => ({}));
        const credit = extractCredit(metadata);
        const optimized = await optimizeImageForUpload(file);
        const paths = buildPOIImageStoragePaths(poiId, `${Date.now()}-${file.name}`);
        const displayRef = ref(storage, paths.display);
        const thumbRef = ref(storage, paths.thumb);

        try {
          await uploadBytes(displayRef, optimized.display, { contentType: optimized.mimeType });
          await uploadBytes(thumbRef, optimized.thumb, { contentType: optimized.mimeType });

          const [displayUrl, thumbUrl] = await Promise.all([
            getDownloadURL(displayRef),
            getDownloadURL(thumbRef),
          ]);

          const image: Bild = {
            datei: displayUrl,
            storage_pfad: paths.display,
            breite: optimized.width,
            hoehe: optimized.height,
            mime_type: optimized.mimeType,
            vorschau_datei: thumbUrl,
            vorschau_storage_pfad: paths.thumb,
            vorschau_breite: optimized.thumbWidth,
            vorschau_hoehe: optimized.thumbHeight,
            nachweis: credit || DEFAULT_IMAGE_CREDIT,
          };

          const updated = [...nextImages, image];
          await persist(updated);
          nextImages = updated;
        } catch (err) {
          await Promise.allSettled([deleteObject(displayRef), deleteObject(thumbRef)]);
          throw err;
        }
      }
    } catch (err: any) {
      setMessage(`Bild konnte nicht gespeichert werden: ${err.message}`);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function updateImage(index: number, patch: Partial<Bild>) {
    const next = bilder.map((image, i) => (i === index ? { ...image, ...patch } : image));
    onChange(next);
    if (!poiId) return;

    setBusy(true);
    setMessage(null);
    try {
      await persist(next);
    } catch (err: any) {
      setMessage(`Bilddaten konnten nicht gespeichert werden: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= bilder.length) return;
    const next = [...bilder];
    [next[index], next[target]] = [next[target], next[index]];

    setBusy(true);
    setMessage(null);
    try {
      await persist(next);
    } catch (err: any) {
      setMessage(`Reihenfolge konnte nicht gespeichert werden: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(index: number, removeStorageFile: boolean) {
    const image = bilder[index];
    const next = bilder.filter((_, i) => i !== index);

    setBusy(true);
    setMessage(null);
    try {
      await persist(next);
      if (removeStorageFile) {
        const paths = [image.storage_pfad, image.vorschau_storage_pfad].filter(Boolean) as string[];
        await Promise.allSettled(paths.map((path) => deleteObject(ref(storage, path))));
      }
    } catch (err: any) {
      setMessage(`Bild konnte nicht entfernt werden: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-images-editor">
      {!canUpload && (
        <div className="admin-images-empty">
          Bilder können hinzugefügt werden, sobald der POI einmal gespeichert wurde.
        </div>
      )}

      {canUpload && (
        <div className="admin-images-upload">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            disabled={busy}
            onChange={(event) => handleFiles(event.target.files)}
          />
          <div className="hint">JPEG oder PNG, maximal 20 MB. Uploads werden automatisch optimiert.</div>
        </div>
      )}

      {message && <div className="admin-images-message">{message}</div>}

      {bilder.length === 0 && canUpload && (
        <div className="admin-images-empty">Noch keine Bilder vorhanden.</div>
      )}

      <div className="admin-images-list">
        {bilder.map((image, index) => {
          const imageUrl = getImageDisplayUrl(image);
          return (
            <div className="admin-image-item" key={`${image.storage_pfad ?? image.datei}-${index}`}>
              <div className="admin-image-thumb">
                {imageUrl ? <img src={imageUrl} alt={image.beschriftung?.de ?? image.nachweis} /> : <span>Kein Bild</span>}
              </div>
              <div className="admin-image-fields">
                <div className="admin-field">
                  <label>Nachweis</label>
                  <input
                    value={image.nachweis}
                    onChange={(event) => updateImage(index, { nachweis: event.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>Nachweis-URL</label>
                  <input
                    value={image.nachweis_url ?? ''}
                    onChange={(event) => updateImage(index, { nachweis_url: event.target.value || undefined })}
                  />
                </div>
                <div className="admin-field">
                  <label>Beschriftung (de)</label>
                  <input
                    value={image.beschriftung?.de ?? ''}
                    onChange={(event) => updateImage(index, { beschriftung: { ...(image.beschriftung ?? { de: '' }), de: event.target.value } })}
                  />
                </div>
                <div className="admin-image-actions">
                  <button type="button" disabled={busy || index === 0} onClick={() => moveImage(index, -1)}>↑</button>
                  <button type="button" disabled={busy || index === bilder.length - 1} onClick={() => moveImage(index, 1)}>↓</button>
                  <button type="button" disabled={busy} onClick={() => removeImage(index, false)}>Referenz entfernen</button>
                  <button type="button" disabled={busy} onClick={() => removeImage(index, true)}>Datei aus Storage entfernen</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
