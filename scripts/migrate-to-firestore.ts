/**
 * Einmalige Migration: data/pois.json + data/collections.json → Firestore
 *
 * Voraussetzungen:
 *   1. Firebase-Projekt konfiguriert (.env.local mit NEXT_PUBLIC_FIREBASE_* Werten)
 *   2. `npm install` ausgeführt
 *
 * Ausführung:
 *   npx tsx scripts/migrate-to-firestore.ts
 *
 * Was passiert:
 *   - Liest pois.json und collections.json (neues Schema mit deutschen Feldnamen)
 *   - Schreibt jedes Dokument einzeln nach Firestore
 *   - Setzt publish_status = "veröffentlicht" für alle
 *   - Setzt alle 4 Audit-Felder (erstellt_von/am, geaendert_von/am)
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

// Firebase config aus Umgebungsvariablen
// Beim Ausführen via `npx tsx` werden .env.local Werte NICHT automatisch geladen.
// Daher dotenv verwenden oder Variablen manuell setzen.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error(
    "❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID nicht gesetzt.\n" +
      "   Setze die Umgebungsvariablen oder lade .env.local:\n" +
      "   $env:NEXT_PUBLIC_FIREBASE_PROJECT_ID='stahnsdorf-90e03'\n" +
      "   oder installiere dotenv und lade die Datei."
  );
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const now = Timestamp.now();
const MIGRATION_AUTHOR = "migration";

interface MigrationResult {
  pois: number;
  collections: number;
  errors: string[];
}

async function migratePOIs(): Promise<{ count: number; errors: string[] }> {
  const filePath = resolve(__dirname, "../data/pois.json");
  const raw = readFileSync(filePath, "utf-8");
  const pois: any[] = JSON.parse(raw);

  let count = 0;
  const errors: string[] = [];

  for (const poi of pois) {
    try {
      const firestoreDoc = {
        ...poi,
        publish_status: "veröffentlicht",
        erstellt_von: MIGRATION_AUTHOR,
        erstellt_am: now,
        geaendert_von: MIGRATION_AUTHOR,
        geaendert_am: now,
      };

      await setDoc(doc(db, "pois", poi.id), firestoreDoc);
      count++;
      process.stdout.write(`\r  POIs: ${count}/${pois.length}`);
    } catch (err: any) {
      errors.push(`POI ${poi.id}: ${err.message}`);
    }
  }

  console.log(); // Newline nach Fortschrittsanzeige
  return { count, errors };
}

async function migrateCollections(): Promise<{
  count: number;
  errors: string[];
}> {
  const filePath = resolve(__dirname, "../data/collections.json");
  const raw = readFileSync(filePath, "utf-8");
  const collections: any[] = JSON.parse(raw);

  let count = 0;
  const errors: string[] = [];

  for (const col of collections) {
    try {
      const firestoreDoc = {
        ...col,
        publish_status: "veröffentlicht",
        erstellt_von: MIGRATION_AUTHOR,
        erstellt_am: now,
        geaendert_von: MIGRATION_AUTHOR,
        geaendert_am: now,
      };

      await setDoc(doc(db, "collections", col.id), firestoreDoc);
      count++;
      process.stdout.write(`\r  Collections: ${count}/${collections.length}`);
    } catch (err: any) {
      errors.push(`Collection ${col.id}: ${err.message}`);
    }
  }

  console.log();
  return { count, errors };
}

async function main() {
  console.log("🌲 Südwestkirchhof — Migration nach Firestore");
  console.log(`   Projekt: ${firebaseConfig.projectId}`);
  console.log("");

  console.log("📝 POIs migrieren...");
  const poiResult = await migratePOIs();

  console.log("📂 Collections migrieren...");
  const colResult = await migrateCollections();

  console.log("");
  console.log("✅ Fertig!");
  console.log(`   ${poiResult.count} POIs migriert`);
  console.log(`   ${colResult.count} Collections migriert`);

  const allErrors = [...poiResult.errors, ...colResult.errors];
  if (allErrors.length > 0) {
    console.log("");
    console.log(`⚠️  ${allErrors.length} Fehler:`);
    allErrors.forEach((e) => console.log(`   - ${e}`));
  }

  // Firebase App beenden damit der Prozess endet
  process.exit(allErrors.length > 0 ? 1 : 0);
}

main();
