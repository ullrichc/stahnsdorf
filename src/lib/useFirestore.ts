'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { POI, Collection } from './types';

/**
 * Hook: Alle veröffentlichten POIs mit Koordinaten laden.
 * Verwendet Firestore mit IndexedDB-Cache für Offline-Nutzung.
 */
export function usePOIs() {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'pois'),
          where('publish_status', '==', 'veröffentlicht')
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => d.data() as POI)
          .filter((poi) => poi.koordinaten !== null);
        setPois(data);
      } catch (err: any) {
        console.error('Fehler beim Laden der POIs:', err);
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { pois, loading, error };
}

/**
 * Hook: Einzelnen POI nach ID laden (auch unveröffentlichte, falls Firestore-Rules erlauben).
 */
export function usePOI(id: string) {
  const [poi, setPoi] = useState<POI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'pois', id));
        if (snap.exists()) {
          setPoi(snap.data() as POI);
        } else {
          setError('POI nicht gefunden.');
        }
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  return { poi, loading, error };
}

/**
 * Hook: Alle veröffentlichten Collections laden.
 */
export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, 'collections'),
          where('publish_status', '==', 'veröffentlicht')
        );
        const snap = await getDocs(q);
        setCollections(snap.docs.map((d) => d.data() as Collection));
      } catch (err: any) {
        console.error('Fehler beim Laden der Collections:', err);
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { collections, loading, error };
}

/**
 * Hook: Einzelne Collection nach ID laden.
 */
export function useCollection(id: string) {
  const [data, setData] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'collections', id));
        if (snap.exists()) {
          setData(snap.data() as Collection);
        } else {
          setError('Sammlung nicht gefunden.');
        }
      } catch (err: any) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  return { collection: data, loading, error };
}
