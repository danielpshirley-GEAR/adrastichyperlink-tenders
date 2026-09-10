// scripts/test_ocid_dedupe_versioning.ts
import { TendersRepository } from '../src/shared/database/repositories/tenders';
import { SourcesRepository } from '../src/shared/database/repositories/sources';
import { getDb } from '../src/shared/database/db';

async function main() {
  console.log('=== TESTS E, F, G: OCID DEDUPE, RAW VERSIONING & TENDER LINKING ===');
  const db = getDb();

  const testOcid = 'ocds-test-procurement-12345';
  const testNotice1 = 'TEST-NOTICE-REL-01';
  const testNotice2 = 'TEST-NOTICE-REL-02';

  // Clean up
  db.prepare('DELETE FROM source_notices WHERE ocid = ? OR notice_id IN (?, ?)').run(testOcid, testNotice1, testNotice2);
  db.prepare('DELETE FROM tenders WHERE ocid = ?').run(testOcid);

  console.log('\n--- 1. Recording Release 1 for OCID ---');
  const rawPayload1 = { ocid: testOcid, id: testNotice1, title: 'Original Procurement Title', value: 100000 };
  const r1 = SourcesRepository.recordSourceNotice(
    'find_a_tender',
    testNotice1,
    rawPayload1,
    `https://www.find-tender.service.gov.uk/Notice/${testNotice1}`,
    null,
    '2026-09-01T10:00:00Z',
    '2026-10-01T12:00:00Z',
    'tender',
    testOcid
  );
  console.log(`Release 1 recorded: ID ${r1.id}, version ${r1.version}, isDuplicate: ${r1.isDuplicate}`);
  if (r1.isDuplicate || r1.version !== 1) {
    throw new Error('FAIL: Release 1 should be version 1 and not duplicate.');
  }

  console.log('\n--- 2. Rescanning Identical Unchanged Release 1 (TEST F) ---');
  const r1Rescan = SourcesRepository.recordSourceNotice(
    'find_a_tender',
    testNotice1,
    rawPayload1, // identical payload
    `https://www.find-tender.service.gov.uk/Notice/${testNotice1}`,
    null,
    '2026-09-01T10:00:00Z',
    '2026-10-01T12:00:00Z',
    'tender',
    testOcid
  );
  console.log(`Identical rescan result: ID ${r1Rescan.id}, version ${r1Rescan.version}, isDuplicate: ${r1Rescan.isDuplicate}`);
  if (!r1Rescan.isDuplicate) {
    throw new Error('FAIL: Identical rescan should be flagged as duplicate and NOT create a new row.');
  }
  const rawRowsCount1 = (db.prepare('SELECT COUNT(*) as count FROM source_notices WHERE notice_id = ?').get(testNotice1) as any).count;
  console.log(`Source notices count for ${testNotice1}: ${rawRowsCount1}`);
  if (rawRowsCount1 !== 1) {
    throw new Error(`FAIL: Expected exactly 1 row in source_notices, found ${rawRowsCount1}`);
  }
  console.log('TEST F PASS: Rescanning identical release did not create duplicate raw row.');

  console.log('\n--- 3. Creating Canonical Tender for Release 1 ---');
  const tender1 = await TendersRepository.save({
    canonicalReference: testNotice1,
    ocid: testOcid,
    title: 'Original Procurement Title',
    buyerName: 'Crown Procurement Test',
    publishedAt: '2026-09-01T10:00:00Z',
    submissionDeadline: '2026-10-01T12:00:00Z',
    qualification: 'POSSIBLE',
    verificationGrade: 'A',
    officialNoticeUrl: `https://www.find-tender.service.gov.uk/Notice/${testNotice1}`,
  });
  console.log(`Canonical Tender created with ID: ${tender1.id}`);

  console.log('\n--- 4. Verifying Traceability Link (TEST G) ---');
  SourcesRepository.linkSourceNoticesToTender(tender1.id, testNotice1, testOcid);
  const linkedNotice1 = db.prepare('SELECT tender_id FROM source_notices WHERE notice_id = ?').get(testNotice1) as any;
  console.log(`Linked source_notice.tender_id: ${linkedNotice1.tender_id}`);
  if (linkedNotice1.tender_id !== tender1.id) {
    throw new Error(`FAIL: Raw notice tender_id (${linkedNotice1.tender_id}) does not match canonical tender id (${tender1.id})`);
  }
  console.log('TEST G PASS: Raw release successfully linked to canonical tender.');

  console.log('\n--- 5. Ingesting Release 2 with SAME OCID (Lifecycle Update) (TEST E) ---');
  const rawPayload2 = { ocid: testOcid, id: testNotice2, title: 'Updated Procurement Title — Clarification Notice', value: 120000 };
  const r2 = SourcesRepository.recordSourceNotice(
    'find_a_tender',
    testNotice2,
    rawPayload2,
    `https://www.find-tender.service.gov.uk/Notice/${testNotice2}`,
    tender1.id,
    '2026-09-05T10:00:00Z',
    '2026-10-01T12:00:00Z',
    'tender',
    testOcid
  );
  console.log(`Release 2 recorded: ID ${r2.id}, version ${r2.version}`);

  const tender2 = await TendersRepository.save({
    canonicalReference: testNotice2,
    ocid: testOcid, // Same OCID!
    title: 'Updated Procurement Title — Clarification Notice',
    buyerName: 'Crown Procurement Test',
    publishedAt: '2026-09-05T10:00:00Z',
    submissionDeadline: '2026-10-01T12:00:00Z',
    qualification: 'STRONG',
    verificationGrade: 'A',
    officialNoticeUrl: `https://www.find-tender.service.gov.uk/Notice/${testNotice2}`,
  });
  console.log(`Canonical Tender ID after Release 2 save: ${tender2.id}`);
  if (tender2.id !== tender1.id) {
    throw new Error(`FAIL: OCID deduplication failed! Created duplicate tender with id ${tender2.id} instead of updating ${tender1.id}`);
  }
  if (tender2.title !== 'Updated Procurement Title — Clarification Notice') {
    throw new Error('FAIL: Canonical tender did not update title from latest release.');
  }

  const ocidTenderCount = (db.prepare('SELECT COUNT(*) as count FROM tenders WHERE ocid = ?').get(testOcid) as any).count;
  console.log(`Total canonical tenders for OCID ${testOcid}: ${ocidTenderCount}`);
  if (ocidTenderCount !== 1) {
    throw new Error(`FAIL: Expected 1 canonical tender for OCID, found ${ocidTenderCount}`);
  }
  console.log('TEST E PASS: OCID correctly deduplicated across different notice IDs into 1 canonical tender.');

  // Clean up test rows (delete child source_notices first)
  db.prepare('DELETE FROM source_notices WHERE notice_id IN (?, ?)').run(testNotice1, testNotice2);
  db.prepare('DELETE FROM tenders WHERE id = ?').run(tender1.id);

  console.log('\nALL TESTS E, F, G PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
