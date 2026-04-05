/**
 * Erstellt Editor-Dokumente in Firestore: config/editors/{email}
 *
 * Aufruf:
 *   npx tsx scripts/setup-editors.ts editor1@gmail.com editor2@gmail.com
 *
 * Voraussetzung: .env.local Variablen geladen
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error("❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID nicht gesetzt.");
  console.error("   Lade zuerst die .env.local Variablen.");
  process.exit(1);
}

const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.error("❌ Keine Email-Adressen angegeben.");
  console.error("   Aufruf: npx tsx scripts/setup-editors.ts editor@gmail.com");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  console.log("🔑 Editor-Dokumente anlegen...");
  console.log(`   Projekt: ${firebaseConfig.projectId}`);
  console.log("");

  for (const email of emails) {
    try {
      await setDoc(doc(db, "editors", email), {
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

main();
