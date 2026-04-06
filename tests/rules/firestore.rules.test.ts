/**
 * Firestore Security Rules Unit Tests (SEC-01 to SEC-11)
 *
 * Uses @firebase/rules-unit-testing to validate firestore.rules
 * against the Firebase Emulator. No browser needed.
 *
 * Run: npm run test:rules
 */
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { setDoc, getDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';

const PROJECT_ID = 'stahnsdorf-90e03';
const EDITOR_EMAIL = 'editor@test.com';
const NON_EDITOR_EMAIL = 'stranger@test.com';

let testEnv: RulesTestEnvironment;

// ─── Valid POI document (all required fields for create) ───
function validPOI(overrides: Record<string, any> = {}) {
  return {
    id: 'poi_sws_test',
    typ: 'grab',
    name: { de: 'Test POI' },
    kurztext: { de: 'Kurz' },
    beschreibung: { de: 'Beschreibung' },
    koordinaten: { lat: 52.39, lng: 13.19 },
    datum_von: null,
    datum_bis: null,
    wikipedia_url: null,
    bilder: [],
    audio: {},
    quellen: [],
    status: 'prüfen',
    notiz: '',
    publish_status: 'entwurf',
    erstellt_von: EDITOR_EMAIL,
    erstellt_am: Timestamp.now(),
    geaendert_von: EDITOR_EMAIL,
    geaendert_am: Timestamp.now(),
    ...overrides,
  };
}

// ─── Valid Collection document ───
function validCollection(overrides: Record<string, any> = {}) {
  return {
    id: 'collection_sws_test',
    name: { de: 'Test Collection' },
    beschreibung: { de: 'Beschreibung' },
    kurztext: { de: 'Kurz' },
    pois: [],
    publish_status: 'entwurf',
    erstellt_von: EDITOR_EMAIL,
    erstellt_am: Timestamp.now(),
    geaendert_von: EDITOR_EMAIL,
    geaendert_am: Timestamp.now(),
    ...overrides,
  };
}

beforeAll(async () => {
  const rulesPath = resolve(__dirname, '../../firestore.rules');
  const rules = readFileSync(rulesPath, 'utf-8');

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  // Seed the editors whitelist BEFORE tests run (bypasses rules)
  // Without this, isEditor() would always return false because
  // exists(/databases/.../editors/{email}) would fail.
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'editors', EDITOR_EMAIL), {
      role: 'editor',
      angelegt_am: new Date().toISOString(),
    });
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-01: Öffentliches Lesen nur für veröffentlichte POIs
// ═══════════════════════════════════════════════════════════
describe('SEC-01: Public read only for published POIs', () => {
  it('allows unauthenticated read of published POI', async () => {
    // Seed a published POI
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'pois', 'poi_sws_pub'), validPOI({
        id: 'poi_sws_pub',
        publish_status: 'veröffentlicht',
      }));
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(unauth.firestore(), 'pois', 'poi_sws_pub')));
  });

  it('denies unauthenticated read of draft POI', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'pois', 'poi_sws_draft'), validPOI({
        id: 'poi_sws_draft',
        publish_status: 'entwurf',
      }));
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), 'pois', 'poi_sws_draft')));
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-02: Öffentliches Lesen nur für veröffentlichte Collections
// ═══════════════════════════════════════════════════════════
describe('SEC-02: Public read only for published Collections', () => {
  it('allows unauthenticated read of published Collection', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'collections', 'collection_sws_pub'), validCollection({
        id: 'collection_sws_pub',
        publish_status: 'veröffentlicht',
      }));
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertSucceeds(getDoc(doc(unauth.firestore(), 'collections', 'collection_sws_pub')));
  });

  it('denies unauthenticated read of draft Collection', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'collections', 'collection_sws_draft'), validCollection({
        id: 'collection_sws_draft',
        publish_status: 'entwurf',
      }));
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(unauth.firestore(), 'collections', 'collection_sws_draft')));
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-03: Editor kann alle POIs lesen (auch Entwürfe)
// ═══════════════════════════════════════════════════════════
describe('SEC-03: Editor can read all POIs', () => {
  it('allows editor to read draft POI', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'pois', 'poi_sws_draft'), validPOI({
        id: 'poi_sws_draft',
        publish_status: 'entwurf',
      }));
    });

    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });
    await assertSucceeds(getDoc(doc(editor.firestore(), 'pois', 'poi_sws_draft')));
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-04: Nicht-Editor kann nicht schreiben
// ═══════════════════════════════════════════════════════════
describe('SEC-04: Non-editor cannot write', () => {
  it('denies authenticated non-editor to create POI', async () => {
    const nonEditor = testEnv.authenticatedContext(NON_EDITOR_EMAIL, {
      email: NON_EDITOR_EMAIL,
    });

    await assertFails(
      setDoc(doc(nonEditor.firestore(), 'pois', 'poi_sws_new'), validPOI({
        id: 'poi_sws_new',
        erstellt_von: NON_EDITOR_EMAIL,
        geaendert_von: NON_EDITOR_EMAIL,
      })),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-05: Create — erstellt_von muss eigene Email sein
// ═══════════════════════════════════════════════════════════
describe('SEC-05: Create requires erstellt_von = own email', () => {
  it('allows create with own email', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    await assertSucceeds(
      setDoc(doc(editor.firestore(), 'pois', 'poi_sws_new'), validPOI({
        id: 'poi_sws_new',
      })),
    );
  });

  it('denies create with foreign email in erstellt_von', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    await assertFails(
      setDoc(doc(editor.firestore(), 'pois', 'poi_sws_foreign'), validPOI({
        id: 'poi_sws_foreign',
        erstellt_von: 'other@test.com',
      })),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-06: Update — erstellt_von darf nicht geändert werden
// ═══════════════════════════════════════════════════════════
describe('SEC-06: Update must not change erstellt_von', () => {
  it('denies update that changes erstellt_von', async () => {
    // Seed a POI
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'pois', 'poi_sws_existing'), validPOI({
        id: 'poi_sws_existing',
      }));
    });

    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    // Try to change erstellt_von — must fail
    await assertFails(
      setDoc(doc(editor.firestore(), 'pois', 'poi_sws_existing'), validPOI({
        id: 'poi_sws_existing',
        erstellt_von: 'tamperer@test.com',
      })),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-07: Update — erstellt_am darf nicht geändert werden
// ═══════════════════════════════════════════════════════════
describe('SEC-07: Update must not change erstellt_am', () => {
  it('denies update that changes erstellt_am', async () => {
    const originalTimestamp = Timestamp.fromDate(new Date('2024-01-01'));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'pois', 'poi_sws_ts'), validPOI({
        id: 'poi_sws_ts',
        erstellt_am: originalTimestamp,
      }));
    });

    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    // Try to change erstellt_am — must fail
    await assertFails(
      setDoc(doc(editor.firestore(), 'pois', 'poi_sws_ts'), validPOI({
        id: 'poi_sws_ts',
        erstellt_am: Timestamp.now(), // different from original
      })),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-08: Update — geaendert_von muss eigene Email sein
// ═══════════════════════════════════════════════════════════
describe('SEC-08: Update requires geaendert_von = own email', () => {
  it('allows update with correct geaendert_von', async () => {
    const originalTimestamp = Timestamp.fromDate(new Date('2024-01-01'));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'pois', 'poi_sws_upd'), validPOI({
        id: 'poi_sws_upd',
        erstellt_am: originalTimestamp,
      }));
    });

    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    // Valid update: keep erstellt_von/erstellt_am, set geaendert_von to self
    await assertSucceeds(
      setDoc(doc(editor.firestore(), 'pois', 'poi_sws_upd'), validPOI({
        id: 'poi_sws_upd',
        erstellt_am: originalTimestamp, // unchanged
        name: { de: 'Updated Name' },
      })),
    );
  });

  it('denies update with foreign geaendert_von', async () => {
    const originalTimestamp = Timestamp.fromDate(new Date('2024-01-01'));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'pois', 'poi_sws_upd2'), validPOI({
        id: 'poi_sws_upd2',
        erstellt_am: originalTimestamp,
      }));
    });

    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    await assertFails(
      setDoc(doc(editor.firestore(), 'pois', 'poi_sws_upd2'), validPOI({
        id: 'poi_sws_upd2',
        erstellt_am: originalTimestamp,
        geaendert_von: 'other@test.com',
      })),
    );
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-09: Editor-Whitelist — eigenes Dokument lesen
// ═══════════════════════════════════════════════════════════
describe('SEC-09: Editor can read own whitelist doc', () => {
  it('allows editor to read editors/{own-email}', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    await assertSucceeds(getDoc(doc(editor.firestore(), 'editors', EDITOR_EMAIL)));
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-10: Editor-Whitelist — fremdes Dokument lesen
// ═══════════════════════════════════════════════════════════
describe('SEC-10: User cannot read other\'s whitelist doc', () => {
  it('denies reading another editor\'s whitelist doc', async () => {
    const other = testEnv.authenticatedContext(NON_EDITOR_EMAIL, {
      email: NON_EDITOR_EMAIL,
    });

    await assertFails(getDoc(doc(other.firestore(), 'editors', EDITOR_EMAIL)));
  });
});

// ═══════════════════════════════════════════════════════════
// SEC-11: Editor-Whitelist — Schreiben verboten
// ═══════════════════════════════════════════════════════════
describe('SEC-11: Nobody can write to editors collection', () => {
  it('denies editor from writing to editors collection', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    await assertFails(
      setDoc(doc(editor.firestore(), 'editors', 'neweditor@test.com'), {
        role: 'editor',
      }),
    );
  });

  it('denies editor from deleting own whitelist doc', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, {
      email: EDITOR_EMAIL,
    });

    await assertFails(deleteDoc(doc(editor.firestore(), 'editors', EDITOR_EMAIL)));
  });
});
