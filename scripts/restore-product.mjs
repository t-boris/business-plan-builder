import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

delete process.env.FIRESTORE_EMULATOR_HOST;
initializeApp({ projectId: 'my-business-planning' });
const db = getFirestore();

const businessId = 'djP1uxLG6WFeZ6AlJJKU';
const ref = db.collection('businesses').doc(businessId).collection('sections').doc('product-service');

// Restore product data — convert from legacy packages
const productData = {
  overview: '',
  offerings: [
    {
      id: randomUUID(),
      name: 'Guitar Pickup Single G1',
      description: 'Single G1',
      price: 500,
      priceLabel: '',
      addOnIds: [],
    },
  ],
  addOns: [],
  updatedAt: new Date().toISOString(),
};

await ref.set(productData);

// Verify
const snap = await ref.get();
const d = snap.data();
console.log('Restored product-service:');
console.log('  Offerings:', d.offerings.length);
for (const o of d.offerings) {
  console.log(`    - ${o.name} | $${o.price}`);
}
console.log('Done!');
