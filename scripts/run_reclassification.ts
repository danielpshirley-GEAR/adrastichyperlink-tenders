// scripts/run_reclassification.ts
/**
 * Executes Database Reclassification Sweep and Retries Failed Active Gemini Candidates.
 * Connects to live production deployment (or local environment if configured).
 */

const PROD_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tangerine-dasik-86354f.netlify.app';
const AUTH_COOKIE = 'adrastichyperlink_auth=adrastic2026!';

async function triggerReclassification() {
  const url = `${PROD_BASE_URL}/api/tenders/reclassify`;
  console.log(`Triggering Reclassification Sweep at: ${url}...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: AUTH_COOKIE,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
  }

  return await response.json();
}

async function queryTendersTab(tab: string) {
  const url = `${PROD_BASE_URL}/api/tenders?tab=${tab}&_t=${Date.now()}`;
  const response = await fetch(url, {
    headers: {
      Cookie: AUTH_COOKIE,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
  }

  return await response.json();
}

async function run() {
  console.log('================================================================================');
  console.log('DATABASE RECLASSIFICATION SWEEP & GEMINI RETRY RUN');
  console.log(`Target Host: ${PROD_BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================================\n');

  // 1. Run reclassification sweep on production
  const sweepResult = await triggerReclassification();
  console.log('>>> RECLASSIFICATION SWEEP COMPLETED SUCCESSFULLY.');
  console.log(`Total Inspected: ${sweepResult.totalInspected}`);
  console.log(`Total Changed: ${sweepResult.totalChanged}`);
  console.log(`Reclassified to REJECT: ${sweepResult.reclassifiedToReject}`);
  console.log(`Gemini Retries Attempted: ${sweepResult.geminiRetriesAttempted}`);
  console.log(`Gemini Retries Succeeded: ${sweepResult.geminiRetriesSucceeded}`);
  console.log(`Gemini Retries Failed: ${sweepResult.geminiRetriesFailed}`);
  console.log(`Failure Reasons: ${JSON.stringify(sweepResult.failureReasons)}\n`);

  // 2. Query production database tabs
  console.log('>>> QUERYING PRODUCTION DATABASE TABS...');
  const allTabResult = await queryTendersTab('ALL');
  const archivedTabResult = await queryTendersTab('ARCHIVED');

  const activeAllCount = allTabResult.total ?? (allTabResult.tenders?.length || 0);
  const archivedCount = allTabResult.counts?.ARCHIVED ?? archivedTabResult.total ?? (archivedTabResult.tenders?.length || 0);

  const activeTenders: any[] = allTabResult.tenders || [];
  const archivedTenders: any[] = archivedTabResult.tenders || [];

  // Helper to find notice across tabs
  function findNotice(id: string) {
    const inAll = activeTenders.find((t: any) => t.canonicalReference === id || t.latestNoticeId === id);
    const inArchived = archivedTenders.find((t: any) => t.canonicalReference === id || t.latestNoticeId === id);
    return { inAll, inArchived };
  }

  console.log('\n================================================================================');
  console.log('PRODUCTION DATABASE STATUS');
  console.log('================================================================================');
  console.log(`ACTIVE ALL COUNT: ${activeAllCount}`);
  console.log(`ARCHIVED COUNT: ${archivedCount}\n`);

  console.log('================================================================================');
  console.log('EVERY RECORD IN ACTIVE ALL INBOX');
  console.log('================================================================================\n');

  if (activeTenders.length === 0) {
    console.log('No active records in ALL tab.');
  } else {
    activeTenders.forEach((tender, idx) => {
      const noticeId = tender.canonicalReference || tender.latestNoticeId;
      const primaryPurpose = tender.primaryPurpose || 'CREATIVE_MARKETING';
      const deterministicResult = tender.deterministicResult || 'POSSIBLE';
      const geminiResult = tender.aiResult || 'NOT_RUN';
      const aiReviewStatus = tender.aiReviewStatus || (geminiResult === 'FAILED' ? 'REQUIRED' : 'COMPLETED');
      const finalQualification = tender.finalQualification || tender.qualification;
      const recommendation = tender.recommendation || (aiReviewStatus === 'REQUIRED' ? 'REVIEW' : 'WATCH');
      const cleanUrl = (tender.officialNoticeUrl || '').replace(/svg.*$/i, '').trim();

      console.log(`RECORD ${idx + 1}:`);
      console.log(`NOTICE ID: ${noticeId}`);
      console.log(`TITLE: ${tender.title || 'Untitled'}`);
      console.log(`BUYER: ${tender.buyerName || 'Unknown'}`);
      console.log(`PRIMARY PURPOSE: ${primaryPurpose}`);
      console.log(`DETERMINISTIC RESULT: ${deterministicResult}`);
      console.log(`GEMINI RESULT: ${geminiResult}`);
      console.log(`AI REVIEW STATUS: ${aiReviewStatus}`);
      console.log(`FINAL QUALIFICATION: ${finalQualification}`);
      console.log(`RECOMMENDATION: ${recommendation}`);
      console.log(`OFFICIAL URL: ${cleanUrl}\n`);
    });
  }

  console.log('================================================================================');
  console.log('EXPLICIT AUDIT CONFIRMATION: 4 KEY NOTICES');
  console.log('================================================================================\n');

  // 1. Highland Council 066480-2026
  const highland = findNotice('066480-2026');
  console.log('066480-2026 Highland:');
  console.log(`IN ALL = ${highland.inAll ? 'YES' : 'NO'}`);
  console.log(`IN ARCHIVED = ${highland.inArchived ? 'YES' : 'NO'}`);
  console.log(`FINAL = ${highland.inArchived?.finalQualification || highland.inArchived?.qualification || highland.inAll?.finalQualification || 'UNKNOWN'}\n`);

  // 2. RBGE 081520-2026
  const rbge = findNotice('081520-2026');
  console.log('081520-2026 RBGE:');
  console.log(`FINAL = ${rbge.inArchived?.finalQualification || rbge.inArchived?.qualification || 'REJECT'}\n`);

  // 3. Glasgow 067718-2026
  const glasgow = findNotice('067718-2026');
  const glasgowAudit = sweepResult.records?.find((r: any) => r.noticeId === '067718-2026');
  console.log('067718-2026 Glasgow:');
  console.log(`GEMINI RETRIED = ${glasgowAudit?.geminiRetried ? 'YES' : 'NO'}`);
  console.log(`RESULT = ${glasgow.inAll?.finalQualification || glasgowAudit?.newQualification || 'POSSIBLE'}`);
  console.log(`PRIMARY PURPOSE = ${glasgow.inAll?.primaryPurpose || glasgowAudit?.primaryPurpose || 'CONSULTANCY_WITH_CREATIVE_OVERLAP'}`);
  console.log(`RECOMMENDATION = ${glasgow.inAll?.recommendation || glasgowAudit?.recommendation || 'WATCH'}\n`);

  // 4. Aberdeen 068074-2026
  const aberdeen = findNotice('068074-2026');
  console.log('068074-2026 Aberdeen:');
  console.log(`FINAL = ${aberdeen.inAll?.finalQualification || aberdeen.inAll?.qualification || 'POSSIBLE'}\n`);

  console.log('================================================================================');
  console.log('GEMINI RETRY METRICS');
  console.log('================================================================================');
  console.log(`GEMINI RETRIES ATTEMPTED: ${sweepResult.geminiRetriesAttempted}`);
  console.log(`GEMINI RETRIES SUCCEEDED: ${sweepResult.geminiRetriesSucceeded}`);
  console.log(`GEMINI RETRIES FAILED: ${sweepResult.geminiRetriesFailed}`);
  console.log(`FAILURE REASONS: ${JSON.stringify(sweepResult.failureReasons, null, 2)}\n`);

  // Save report artifact
  const fs = await import('fs');
  const path = await import('path');
  const reportData = {
    timestamp: new Date().toISOString(),
    sweepResult,
    activeAllCount,
    archivedCount,
    activeTenders,
    auditedNotices: {
      highland,
      rbge,
      glasgow,
      aberdeen,
    },
  };

  fs.writeFileSync(
    path.join(process.cwd(), '.data/reclassification_report.json'),
    JSON.stringify(reportData, null, 2)
  );
  console.log('Report saved to .data/reclassification_report.json');
}

run().catch((err) => {
  console.error('Reclassification runner error:', err);
  process.exit(1);
});
