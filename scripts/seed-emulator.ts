/**
 * Seed-Skript: data/pois.json + data/collections.json → lokaler Firestore Emulator
 *
 * Ausführung:
 *   npx tsx scripts/seed-emulator.ts
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
  connectFirestoreEmulator
} from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve } from "path";

const firebaseConfig = {
  projectId: "stahnsdorf-90e03", // Fake Project ID fürs Emulator-Seeding
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// WICHTIG: Mit dem lokalen Emulator verbinden
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const now = Timestamp.now();
const MIGRATION_AUTHOR = "seed";

async function main() {
  console.log("🌱 Befülle lokalen Firestore Emulator mit Testdaten...");

  // 1. POIs
  const poiPath = resolve(__dirname, "../data/pois.json");
  const pois = JSON.parse(readFileSync(poiPath, "utf-8"));
  let poiCount = 0;
  for (const poi of pois) {
    const firestoreDoc = {
      ...poi,
      publish_status: "veröffentlicht",
      erstellt_von: MIGRATION_AUTHOR,
      erstellt_am: now,
      geaendert_von: MIGRATION_AUTHOR,
      geaendert_am: now,
    };
    await setDoc(doc(db, "pois", poi.id), firestoreDoc);
    poiCount++;
    process.stdout.write(`\r  POIs: ${poiCount}/${pois.length}`);
  }
  console.log("");

  // 2. Collections
  const colPath = resolve(__dirname, "../data/collections.json");
  const collections = JSON.parse(readFileSync(colPath, "utf-8"));
  let colCount = 0;
  for (const col of collections) {
    const firestoreDoc = {
      ...col,
      publish_status: "veröffentlicht",
      erstellt_von: MIGRATION_AUTHOR,
      erstellt_am: now,
      geaendert_von: MIGRATION_AUTHOR,
      geaendert_am: now,
    };
    await setDoc(doc(db, "collections", col.id), firestoreDoc);
    colCount++;
    process.stdout.write(`\r  Collections: ${colCount}/${collections.length}`);
  }
  console.log("\n✅ Testdaten erfolgreich in den lokalen Emulator geladen!\n");

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
