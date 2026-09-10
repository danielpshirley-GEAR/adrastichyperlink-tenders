// scripts/test_classifier.ts
import { TenderClassifier } from '../src/modules/public-tenders/services/tender-classifier';

async function run() {
  console.log('=== TEST: TENDER CLASSIFIER ACCEPTANCE ===');

  // Test 1: Genuine Creative Tender
  console.log('\nTesting Case 1: Motion Design & Brand Guidelines...');
  const res1 = await TenderClassifier.classify({
    title: 'Dynamic Motion Graphics & Brand Guidelines Framework',
    buyer: 'Arts Council England',
    description: 'Procurement of creative partner to deliver 2D/3D animation, social video toolkits, and brand motion guidelines.',
    cpvCodes: ['79822500', '92111250'],
    noticeType: 'tender',
    valueAmount: 140000
  });
  console.log('Result 1:', res1);
  if (res1.relevance === 'REJECT') {
    throw new Error('Creative tender should NOT be rejected!');
  }
  console.log('Case 1 PASS: Creative tender accepted with relevance:', res1.relevance);

  // Test 2: CCTV / Surveillance Tender
  console.log('\nTesting Case 2: Video Surveillance & CCTV...');
  const res2 = await TenderClassifier.classify({
    title: 'City Centre CCTV Video Surveillance System Upgrades',
    buyer: 'Metropolitan Police Service',
    description: 'Supply, installation, and maintenance of high definition CCTV surveillance cameras and recording equipment.',
    cpvCodes: ['35125300'],
    noticeType: 'tender',
    valueAmount: 500000
  });
  console.log('Result 2:', res2);
  if (res2.relevance !== 'REJECT') {
    throw new Error('CCTV tender MUST be rejected!');
  }
  console.log('Case 2 PASS: CCTV tender successfully REJECTED.');

  // Test 3: Sign Manufacturing Tender
  console.log('\nTesting Case 3: Highway Sign Manufacture...');
  const res3 = await TenderClassifier.classify({
    title: 'Framework for Road & Directional Sign Manufacture and Erection',
    buyer: 'Highways Agency',
    description: 'Fabrication of metal directional signs, reflective backing, and roadside posts.',
    cpvCodes: ['34928470'],
    noticeType: 'tender',
    valueAmount: 850000
  });
  console.log('Result 3:', res3);
  if (res3.relevance !== 'REJECT') {
    throw new Error('Sign manufacture tender MUST be rejected!');
  }
  console.log('Case 3 PASS: Sign manufacture tender successfully REJECTED.');

  console.log('\nALL CLASSIFIER TESTS PASSED!');
}

run().catch(err => {
  console.error('Classifier test error:', err);
  process.exit(1);
});
