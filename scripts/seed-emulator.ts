/**
 * Seed-Skript: data/pois.json + data/collections.json → lokaler Firestore Emulator
 * 
 * Verwendet das Firebase Admin SDK, um Sicherheitsregeln im Emulator zu umgehen.
 *
 * Ausführung:
 *   npx tsx scripts/seed-emulator.ts
 */

import * as admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import * as dotenv from "dotenv";

// Lade .env.local falls vorhanden (enthält NEXT_PUBLIC_FIREBASE_PROJECT_ID)
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stahnsdorf-90e03";

// WICHTIG: Mit dem lokalen Emulator verbinden
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({
  projectId: PROJECT_ID,
});

const db = admin.firestore();
const now = admin.firestore.Timestamp.now();
const MIGRATION_AUTHOR = "seed";

async function main() {
  console.log(`🌱 Befülle lokalen Firestore Emulator (${PROJECT_ID}) mit Testdaten...`);

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
    
    // Admin SDK verwendet .doc().set() oder .add()
    await db.collection("pois").doc(poi.id).set(firestoreDoc);
    
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
    
    await db.collection("collections").doc(col.id).set(firestoreDoc);
    
    colCount++;
    process.stdout.write(`\r  Collections: ${colCount}/${collections.length}`);
  }
  
  console.log("\n✅ Testdaten erfolgreich in den lokalen Emulator geladen!\n");
  process.exit(0);
}

main().catch(err => {
  console.error("\n❌ Fehler beim Seeding:", err);
  process.exit(1);
});
