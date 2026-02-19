import { initializeApp as initAdmin } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

/** Recursively strip undefined values (Firestore rejects them). */
function stripUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(stripUndefined);
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) result[k] = stripUndefined(v);
    }
    return result;
  }
  return obj;
}

// --- Step 1: Read from emulator ---
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const emulatorApp = initAdmin({ projectId: 'my-business-planning' }, 'emulator');
const emulatorDb = getFirestore(emulatorApp);

console.log('Reading from emulator...');

const emulatorBusinesses = await emulatorDb.collection('businesses').get();
const allData = [];

for (const bDoc of emulatorBusinesses.docs) {
  const bData = bDoc.data();
  const businessId = bDoc.id;
  console.log(`  Business: ${businessId} - ${bData.profile?.name || 'unnamed'}`);

  const sections = {};
  const sectionsSnap = await bDoc.ref.collection('sections').get();
  for (const sec of sectionsSnap.docs) {
    sections[sec.id] = sec.data();
    console.log(`    Section: ${sec.id}`);
  }

  const scenarios = {};
  const scenariosSnap = await bDoc.ref.collection('scenarios').get();
  for (const sc of scenariosSnap.docs) {
    scenarios[sc.id] = sc.data();
    console.log(`    Scenario: ${sc.id}`);
  }

  const states = {};
  const stateSnap = await bDoc.ref.collection('state').get();
  for (const st of stateSnap.docs) {
    states[st.id] = st.data();
    console.log(`    State: ${st.id}`);
  }

  allData.push({ businessId, businessData: bData, sections, scenarios, states });
}

// --- Fix product-service: convert packages → offerings ---
for (const entry of allData) {
  const ps = entry.sections['product-service'];
  if (!ps) continue;

  const offerings = ps.offerings || [];
  const packages = ps.packages || [];

  if (offerings.length === 0 && packages.length > 0) {
    console.log(`\nFixing product-service: converting ${packages.length} packages → offerings`);
    ps.offerings = packages.map(pkg => {
      let description = pkg.description || '';
      if (pkg.includes && pkg.includes.length > 0) {
        const bullets = pkg.includes.map(item => `• ${item}`).join('\n');
        description = description ? `${description}\n${bullets}` : bullets;
      }
      return {
        id: randomUUID(),
        name: pkg.name,
        description,
        price: pkg.price,
        priceLabel: pkg.duration || '',
        addOnIds: [],
      };
    });
    delete ps.packages;
    console.log('Converted:', ps.offerings.map(o => o.name).join(', '));
  }
}

// --- Step 2: Write to production ---
delete process.env.FIRESTORE_EMULATOR_HOST;
const prodApp = initAdmin({ projectId: 'my-business-planning' }, 'production');
const prodDb = getFirestore(prodApp);

console.log('\nWriting to production...');

for (const entry of allData) {
  const { businessId, businessData, sections, scenarios, states } = entry;

  console.log(`  Business: ${businessId}`);
  await prodDb.collection('businesses').doc(businessId).set(stripUndefined(businessData), { merge: true });

  for (const [secId, secData] of Object.entries(sections)) {
    console.log(`    Section: ${secId}`);
    await prodDb
      .collection('businesses').doc(businessId)
      .collection('sections').doc(secId)
      .set(stripUndefined(secData), { merge: true });
  }

  for (const [scId, scData] of Object.entries(scenarios)) {
    console.log(`    Scenario: ${scId}`);
    await prodDb
      .collection('businesses').doc(businessId)
      .collection('scenarios').doc(scId)
      .set(stripUndefined(scData), { merge: true });
  }

  for (const [stId, stData] of Object.entries(states)) {
    console.log(`    State: ${stId}`);
    await prodDb
      .collection('businesses').doc(businessId)
      .collection('state').doc(stId)
      .set(stripUndefined(stData), { merge: true });
  }
}

// --- Step 3: Verify ---
console.log('\nVerifying production...');
const prodBusinesses = await prodDb.collection('businesses').get();
for (const bDoc of prodBusinesses.docs) {
  const bData = bDoc.data();
  console.log(`  Business: ${bDoc.id} - ${bData.profile?.name}`);
  const sectionsSnap = await bDoc.ref.collection('sections').get();
  console.log(`  Sections: ${sectionsSnap.size}`);
  for (const sec of sectionsSnap.docs) {
    const d = sec.data();
    console.log(`    ${sec.id} (${Object.keys(d).join(', ')})`);
    if (sec.id === 'product-service') {
      for (const o of (d.offerings || [])) {
        console.log(`      → ${o.name} | $${o.price}`);
      }
    }
  }
}

console.log('\nDone!');
