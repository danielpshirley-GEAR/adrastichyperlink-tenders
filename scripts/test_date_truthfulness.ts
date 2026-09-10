// scripts/test_date_truthfulness.ts
import { TendersRepository } from '../src/shared/database/repositories/tenders';
import { getDb } from '../src/shared/database/db';

async function main() {
  console.log('=== TEST B & C: DATE TRUTHFULNESS & ZERO FALLBACK INVENTIONS ===');

  const db = getDb();
  const testRef = 'TEST-NODATE-2026';

  // Clean up any prior test
  db.prepare('DELETE FROM tenders WHERE canonical_reference = ?').run(testRef);

  console.log('Saving tender with explicit NULL publishedAt and submissionDeadline...');
  const saved = await TendersRepository.save({
    canonicalReference: testRef,
    title: 'Test Creative Tender Without Published Dates',
    buyerName: 'Ministry of Truth',
    publishedAt: null,
    submissionDeadline: null,
    qualification: 'POSSIBLE',
    verificationGrade: 'B',
    officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/TEST-NODATE-2026',
  });

  console.log(`Saved tender ID: ${saved.id}`);
  console.log(`- publishedAt: ${saved.publishedAt}`);
  console.log(`- submissionDeadline: ${saved.submissionDeadline}`);
  console.log(`- daysRemaining: ${saved.daysRemaining}`);

  if (saved.publishedAt !== null && saved.publishedAt !== undefined) {
    throw new Error(`FAIL: publishedAt was invented: ${saved.publishedAt}`);
  }

  if (saved.submissionDeadline !== null && saved.submissionDeadline !== undefined) {
    throw new Error(`FAIL: submissionDeadline was invented: ${saved.submissionDeadline}`);
  }

  // Check raw database row
  const rawRow = db.prepare('SELECT published_at, submission_deadline FROM tenders WHERE id = ?').get(saved.id) as any;
  console.log(`- Raw SQLite published_at: ${rawRow.published_at}`);
  console.log(`- Raw SQLite submission_deadline: ${rawRow.submission_deadline}`);

  if (rawRow.published_at !== null) {
    throw new Error(`FAIL: Database stored non-null published_at: ${rawRow.published_at}`);
  }
  if (rawRow.submission_deadline !== null) {
    throw new Error(`FAIL: Database stored non-null submission_deadline: ${rawRow.submission_deadline}`);
  }

  // Clean up
  db.prepare('DELETE FROM tenders WHERE id = ?').run(saved.id);

  console.log('TEST B & C PASS: Zero fallback dates generated. Genuinely stores NULL for missing dates.');
}

main().catch((err) => {
  console.error('TEST B & C ERROR:', err);
  process.exit(1);
});
