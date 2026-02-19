import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: 'my-business-planning' });
const db = getFirestore();

// Check all businesses
const businesses = await db.collection('businesses').get();
console.log('Total businesses:', businesses.size);

for (const bDoc of businesses.docs) {
  const bData = bDoc.data();
  console.log('\n=== Business:', bDoc.id, '===');
  console.log('    Full data:', JSON.stringify(bData, null, 2));

  const sections = await bDoc.ref.collection('sections').get();
  console.log('    Sections count:', sections.size);
  for (const sec of sections.docs) {
    const d = sec.data();
    const keys = d ? Object.keys(d) : [];
    console.log('    Section:', sec.id, '- keys:', keys.join(', '));
    if (sec.id === 'product-service') {
      console.log('      FULL DATA:', JSON.stringify(d, null, 2).substring(0, 2000));
    }
  }

  // Check subcollections
  const subcollections = await bDoc.ref.listCollections();
  console.log('    Subcollections:', subcollections.map(c => c.id).join(', '));
}

// Check if there's a "users" collection with business data
const users = await db.collection('users').get();
console.log('\nTotal users:', users.size);
for (const uDoc of users.docs) {
  console.log('  User:', uDoc.id);
  const uData = uDoc.data();
  console.log('    Data keys:', Object.keys(uData).join(', '));
  if (uData.businesses) {
    console.log('    Businesses:', JSON.stringify(uData.businesses));
  }
  const uSub = await uDoc.ref.listCollections();
  console.log('    Subcollections:', uSub.map(c => c.id).join(', '));
}
