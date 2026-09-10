// scripts/test_persistence.ts
import { getSqliteDb } from '../src/shared/database/sqlite';
import { TendersRepository } from '../src/shared/database/repositories/tenders';
import { ApplicationsRepository } from '../src/shared/database/repositories/applications';
import { SourcesRepository } from '../src/shared/database/repositories/sources';

async function run() {
  console.log('=== TEST: PERSISTENCE & REPOSITORIES ===');
  
  // 1. Initialize DB
  const db = getSqliteDb();
  console.log('Database initialized successfully.');

  // 2. Sources verification
  const sources = SourcesRepository.getAll();
  console.log(`Sources count: ${sources.length}`);
  const fts = sources.find(s => s.id === 'find_a_tender');
  console.log('Find a Tender source:', { id: fts?.id, health: fts?.healthStatus, active: fts?.isActive });
  const otherSources = sources.filter(s => s.id !== 'find_a_tender');
  const allOthersNotImplemented = otherSources.every(s => s.healthStatus === 'not_implemented' && !s.isActive);
  console.log('All other sources NOT IMPLEMENTED:', allOthersNotImplemented);

  // 3. Insert a real tender via repository
  const testRef = 'FTS-TEST-' + Date.now();
  const savedTender = await TendersRepository.save({
    canonicalReference: testRef,
    ocid: 'ocds-test-ref-01',
    title: 'Brand Identity & Motion Guidelines for National Arts Programme',
    plainEnglishSummary: 'Comprehensive motion design system and brand toolkit.',
    buyerName: 'National Arts Council',
    valueAmount: 180000,
    valueCurrency: 'GBP',
    valueDescription: '£180,000 fixed price',
    publishedAt: '2026-09-08T10:00:00Z',
    submissionDeadline: '2026-10-15T12:00:00Z',
    qualification: 'STRONG',
    verificationGrade: 'A',
    officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/085808-2026',
    serviceTags: ['motion', 'brand_strategy', 'graphic_design']
  });

  console.log('Tender saved to DB with ID:', savedTender.id);

  // 4. Test Bid Decision: WATCH
  console.log('Setting decision to WATCH...');
  const watched = await TendersRepository.setBidDecision(savedTender.id, 'WATCH');
  console.log('Tender bidDecisionState after WATCH:', watched?.bidDecisionState);

  // 5. Test Bid Decision: BID & Application shell creation
  console.log('Setting decision to BID...');
  const bidded = await TendersRepository.setBidDecision(savedTender.id, 'BID');
  console.log('Tender bidDecisionState after BID:', bidded?.bidDecisionState);

  const appShell = await ApplicationsRepository.createShellForTender(savedTender.id);
  console.log('Application shell created:', {
    id: appShell.id,
    tenderId: appShell.tenderId,
    buyer: appShell.buyerName,
    deadline: appShell.submissionDeadline,
    status: appShell.status
  });

  // 6. Test Counts by Tab
  const counts = await TendersRepository.countByTab();
  console.log('Counts by Tab:', counts);

  // 7. Verify persistence by re-fetching
  const retrieved = await TendersRepository.getById(savedTender.id);
  if (!retrieved || retrieved.bidDecisionState !== 'BID') {
    throw new Error('Persistence verification failed!');
  }
  console.log('Verification PASSED: Tender persisted and retrievable with correct BID decision state.');

  // Clean up test tender
  db.prepare('DELETE FROM applications WHERE id = ?').run(appShell.id);
  db.prepare('DELETE FROM tenders WHERE id = ?').run(savedTender.id);
  console.log('Test records cleaned up. ALL CHECKS PASSED!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
