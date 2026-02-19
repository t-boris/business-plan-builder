import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
initializeApp({ projectId: 'my-business-planning' });
const db = getFirestore();

const businesses = await db.collection('businesses').get();

for (const bDoc of businesses.docs) {
  const sections = await bDoc.ref.collection('sections').get();
  for (const sec of sections.docs) {
    if (sec.id === 'product-service') {
      const d = sec.data();
      console.log('=== product-service FULL DATA ===');
      console.log(JSON.stringify(d, null, 2));
    }
  }
}
