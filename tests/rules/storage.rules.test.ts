/**
 * Firebase Storage Security Rules Unit Tests.
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
import { setDoc, doc } from 'firebase/firestore';

const PROJECT_ID = 'stahnsdorf-90e03';
const BUCKET = 'stahnsdorf-90e03.appspot.com';
const EDITOR_EMAIL = 'editor@test.com';
const NON_EDITOR_EMAIL = 'stranger@test.com';
const VALID_PATH = 'poi-images/poi_sws_test/display/test.jpg';
const THUMB_PATH = 'poi-images/poi_sws_test/thumb/test.jpg';
const INVALID_PATH = 'other/poi_sws_test/display/test.jpg';

let testEnv: RulesTestEnvironment;

function storageFor(context: ReturnType<RulesTestEnvironment['authenticatedContext']> | ReturnType<RulesTestEnvironment['unauthenticatedContext']>) {
  return context.storage(`gs://${BUCKET}`);
}

function refFor(context: ReturnType<typeof storageFor>, path: string) {
  return context.ref(path);
}

function smallJpeg() {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
}

function upload(path: string, context: ReturnType<typeof storageFor>, bytes: Uint8Array, contentType: string) {
  return refFor(context, path).put(bytes, { contentType }) as unknown as Promise<unknown>;
}

beforeAll(async () => {
  const firestoreRules = readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf-8');
  const storageRules = readFileSync(resolve(__dirname, '../../storage.rules'), 'utf-8');

  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: firestoreRules,
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: storageRules,
      host: '127.0.0.1',
      port: 9199,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'editors', EDITOR_EMAIL), {
      role: 'editor',
      angelegt_am: new Date().toISOString(),
    });
  });
});

describe('Storage rules for POI images', () => {
  it('allows public read for POI images', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await upload(VALID_PATH, storageFor(context), smallJpeg(), 'image/jpeg');
    });

    const unauth = testEnv.unauthenticatedContext();
    await assertSucceeds(refFor(storageFor(unauth), VALID_PATH).getMetadata());
  });

  it('allows editors to upload and delete display and thumb JPEGs', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, { email: EDITOR_EMAIL });

    await assertSucceeds(upload(VALID_PATH, storageFor(editor), smallJpeg(), 'image/jpeg'));
    await assertSucceeds(upload(THUMB_PATH, storageFor(editor), smallJpeg(), 'image/jpeg'));
    await assertSucceeds(refFor(storageFor(editor), VALID_PATH).delete());
  });

  it('denies non-editor uploads', async () => {
    const nonEditor = testEnv.authenticatedContext(NON_EDITOR_EMAIL, { email: NON_EDITOR_EMAIL });

    await assertFails(upload(VALID_PATH, storageFor(nonEditor), smallJpeg(), 'image/jpeg'));
  });

  it('denies uploads outside poi-images paths', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, { email: EDITOR_EMAIL });

    await assertFails(upload(INVALID_PATH, storageFor(editor), smallJpeg(), 'image/jpeg'));
  });

  it('denies non-JPEG uploads', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, { email: EDITOR_EMAIL });

    await assertFails(upload(VALID_PATH, storageFor(editor), new Uint8Array([1, 2, 3]), 'image/png'));
  });

  it('denies oversized uploads', async () => {
    const editor = testEnv.authenticatedContext(EDITOR_EMAIL, { email: EDITOR_EMAIL });
    const oversized = new Uint8Array(11 * 1024 * 1024);

    await assertFails(upload(VALID_PATH, storageFor(editor), oversized, 'image/jpeg'));
  });
});
