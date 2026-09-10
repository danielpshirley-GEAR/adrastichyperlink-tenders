// scripts/test_fts_live.ts
import { FindATenderConnector } from '../src/modules/public-tenders/connectors/find-a-tender';
import { UrlVerifier } from '../src/modules/public-tenders/services/url-verifier';

async function run() {
  console.log('=== TEST: LIVE FIND A TENDER SCAN & VERIFICATION ===');
  const connector = new FindATenderConnector();

  console.log('Fetching live releases from Find a Tender OCDS endpoint...');
  const result = await connector.scanLiveNotices();

  console.log(`Scan completed at: ${result.scannedAt}`);
  console.log(`Notices checked: ${result.noticesChecked}`);
  console.log(`Parsed candidates: ${result.relevantCandidates.length}`);
  console.log(`Errors count: ${result.errors.length}`);

  if (result.noticesChecked === 0 || result.relevantCandidates.length === 0) {
    throw new Error('FAIL: No notices returned from live Find a Tender API!');
  }
  console.log('TEST A PASS: Real scan retrieved actual notices from live government source.');

  // Select first valid candidate
  const sample = result.relevantCandidates[0];
  console.log('\n--- SAMPLE REAL TENDER RECORD (TEST B) ---');
  console.log('Notice ID:', sample.noticeId);
  console.log('OCID:', sample.ocid);
  console.log('Title:', sample.title);
  console.log('Buyer:', sample.buyerName);
  console.log('Published At:', sample.publishedAt);
  console.log('Deadline:', sample.submissionDeadline || 'None specified');
  console.log('Value:', sample.valueAmount ? `£${sample.valueAmount.toLocaleString()} ${sample.valueCurrency}` : 'Unspecified');
  console.log('CPV Codes:', sample.cpvCodes.join(', ') || 'None');
  console.log('Official Notice URL:', sample.officialNoticeUrl);

  if (!sample.noticeId || !sample.title || !sample.officialNoticeUrl) {
    throw new Error('FAIL: Required tender fields missing from real record!');
  }
  console.log('TEST B PASS: Real record parsed accurately with genuine fields.');

  // Test C: Live URL Verification
  console.log('\n--- VERIFYING OFFICIAL NOTICE URL (TEST C) ---');
  console.log(`Calling live HTTP GET on ${sample.officialNoticeUrl}...`);
  const verification = await UrlVerifier.verifyNoticeUrl(sample.officialNoticeUrl, {
    expectedNoticeId: sample.noticeId,
    expectedTitle: sample.title,
    expectedBuyer: sample.buyerName,
    expectedDeadline: sample.submissionDeadline,
  });

  console.log('Verification Result:', {
    grade: verification.grade,
    isValid: verification.isValid,
    httpStatus: verification.httpStatus,
    finalRedirectUrl: verification.finalRedirectUrl,
    titleMatches: verification.titleMatches,
    buyerMatches: verification.buyerMatches,
    notes: verification.notes
  });

  if (verification.httpStatus !== 200 || !verification.isValid) {
    throw new Error(`FAIL: URL verification failed with HTTP ${verification.httpStatus}`);
  }
  console.log('TEST C PASS: Live official notice URL successfully verified with HTTP 200.');

  // Test D: Raw payload integrity
  console.log('\n--- RAW DATA INTEGRITY (TEST D) ---');
  const hasRawPayload = Boolean(sample.rawPayload && typeof sample.rawPayload === 'object' && Object.keys(sample.rawPayload).length > 0);
  console.log('Raw payload preserved:', hasRawPayload);
  if (!hasRawPayload) {
    throw new Error('FAIL: Raw OCDS payload was not preserved!');
  }
  console.log('TEST D PASS: Original raw OCDS notice payload preserved.');

  console.log('\nALL FIND A TENDER LIVE TESTS PASSED!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
