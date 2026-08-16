'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { POI, Collection } from './types';
import { isValidCoordinates } from './geo';

/**
 * Hook: Alle veröffentlichten POIs mit Koordinaten laden.
 * Verwendet Firestore mit IndexedDB-Cache für Offline-Nutzung.
 */
export function usePOIs() {
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'pois'),
          where('publish_status', '==', 'veröffentlicht')
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => d.data() as POI)
          .filter((poi) => isValidCoordinates(poi.koordinaten));
        if (!cancelled) setPois(data);
      } catch (err: any) {
        console.error('Fehler beim Laden der POIs:', err);
        if (!cancelled) setError('load-failed');
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [attempt]);

  return { pois, loading, error, retry };
}

/**
 * Hook: Einzelnen POI nach ID laden (auch unveröffentlichte, falls Firestore-Rules erlauben).
 */
export function usePOI(id: string) {
  const [poi, setPoi] = useState<POI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setPoi(null);
      try {
        const snap = await getDoc(doc(db, 'pois', id));
        if (snap.exists()) {
          if (!cancelled) setPoi(snap.data() as POI);
        } else {
          if (!cancelled) setNotFound(true);
        }
      } catch (err: any) {
        if (!cancelled) setError('load-failed');
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, attempt]);

  return { poi, loading, error, notFound, retry };
}

/**
 * Hook: Alle veröffentlichten Collections laden.
 */
export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, 'collections'),
          where('publish_status', '==', 'veröffentlicht')
        );
        const snap = await getDocs(q);
        if (!cancelled) setCollections(snap.docs.map((d) => d.data() as Collection));
      } catch (err: any) {
        console.error('Fehler beim Laden der Collections:', err);
        if (!cancelled) setError('load-failed');
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [attempt]);

  return { collections, loading, error, retry };
}

/**
 * Hook: Einzelne Collection nach ID laden.
 */
export function useCollection(id: string) {
  const [data, setData] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      setData(null);
      try {
        const snap = await getDoc(doc(db, 'collections', id));
        if (snap.exists()) {
          if (!cancelled) setData(snap.data() as Collection);
        } else {
          if (!cancelled) setNotFound(true);
        }
      } catch (err: any) {
        if (!cancelled) setError('load-failed');
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [id, attempt]);

  return { collection: data, loading, error, notFound, retry };
}
