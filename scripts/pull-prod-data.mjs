#!/usr/bin/env node
/**
 * Pull production Firestore data into local emulator.
 *
 * Usage:
 *   1. Start emulator:  firebase emulators:start --only firestore
 *   2. Run this script:  node scripts/pull-prod-data.mjs
 *
 * Requires:
 *   - gcloud auth application-default login (or GOOGLE_APPLICATION_CREDENTIALS)
 *   - firebase-admin package
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'my-business-planning';
const EMULATOR_HOST = 'localhost:8080';

// --- Production client (reads from real Firestore) ---
const prodApp = initializeApp(
  { credential: applicationDefault(), projectId: PROJECT_ID },
  'prod'
);
const prodDb = getFirestore(prodApp);

// --- Emulator client (writes to local emulator) ---
process.env.FIRESTORE_EMULATOR_HOST = EMULATOR_HOST;
const emulatorApp = initializeApp({ projectId: PROJECT_ID }, 'emulator');
const emulatorDb = getFirestore(emulatorApp);

async function copyCollection(srcDb, destDb, collectionPath) {
  const snapshot = await srcDb.collection(collectionPath).get();
  if (snapshot.empty) return 0;

  let count = 0;
  for (const doc of snapshot.docs) {
    // Write document to emulator
    await destDb.collection(collectionPath).doc(doc.id).set(doc.data());
    count++;

    // Recursively copy subcollections
    const subcollections = await doc.ref.listCollections();
    for (const subcol of subcollections) {
      const subPath = `${collectionPath}/${doc.id}/${subcol.id}`;
      count += await copyCollection(srcDb, destDb, subPath);
    }
  }
  return count;
}

async function main() {
  console.log(`Pulling data from prod (${PROJECT_ID}) to emulator (${EMULATOR_HOST})...\n`);

  // List all top-level collections in prod
  const collections = await prodDb.listCollections();
  const collectionIds = collections.map((c) => c.id);
  console.log(`Found top-level collections: ${collectionIds.join(', ')}\n`);

  let totalDocs = 0;
  for (const colId of collectionIds) {
    const count = await copyCollection(prodDb, emulatorDb, colId);
    console.log(`  ${colId}: ${count} documents (including subcollections)`);
    totalDocs += count;
  }

  console.log(`\nDone! Copied ${totalDocs} total documents to emulator.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (err.message.includes('Could not load the default credentials')) {
    console.error('\nRun: gcloud auth application-default login');
  }
  process.exit(1);
});
