import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// No FIRESTORE_EMULATOR_HOST = production
delete process.env.FIRESTORE_EMULATOR_HOST;
initializeApp({ projectId: 'my-business-planning' });
const db = getFirestore();

const businesses = await db.collection('businesses').get();
console.log('Businesses:', businesses.size);

for (const bDoc of businesses.docs) {
  const bData = bDoc.data();
  console.log(`\nBusiness: ${bDoc.id} - ${bData.profile?.name}`);

  const sections = await bDoc.ref.collection('sections').get();
  console.log(`Sections: ${sections.size}`);
  for (const sec of sections.docs) {
    const d = sec.data();
    console.log(`  ${sec.id}:`);
    if (sec.id === 'product-service') {
      console.log('    FULL:', JSON.stringify(d, null, 2));
    }
  }
}
