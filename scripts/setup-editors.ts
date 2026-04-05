/**
 * Erstellt Editor-Dokumente in Firestore: config/editors/{email}
 *
 * Aufruf:
 *   npx tsx scripts/setup-editors.ts editor1@gmail.com editor2@gmail.com
 *
 * Verwendet das Firebase Admin SDK, um Sicherheitsregeln zu umgehen.
 */

import * as admin from "firebase-admin";
import { existsSync } from "fs";
import { resolve } from "path";
import * as dotenv from "dotenv";

// Lade .env.local falls vorhanden
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "stahnsdorf-90e03";

// Prüfe ob Emulator verwendet werden soll
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
}

admin.initializeApp({
  projectId: PROJECT_ID,
});

const db = admin.firestore();

const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.error("❌ Keine Email-Adressen angegeben.");
  console.error("   Aufruf: npx tsx scripts/setup-editors.ts editor@gmail.com");
  process.exit(1);
}

async function main() {
  console.log(`🔑 Editor-Dokumente anlegen in ${useEmulator ? 'LOKALEM EMULATOR' : 'PRODUKTION'}...`);
  console.log(`   Projekt: ${PROJECT_ID}`);
  console.log("");

  for (const email of emails) {
    try {
      await db.collection("editors").doc(email).set({
        role: "editor",
        angelegt_am: new Date().toISOString(),
      });
      console.log(`   ✅ ${email}`);
    } catch (err: any) {
      console.error(`   ❌ ${email}: ${err.message}`);
    }
  }

  console.log("");
  console.log("✅ Fertig!");
  process.exit(0);
}

main().catch(err => {
  console.error("\n❌ Fehler beim Setup:", err);
  process.exit(1);
});
