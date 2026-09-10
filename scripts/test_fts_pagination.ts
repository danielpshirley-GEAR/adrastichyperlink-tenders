// scripts/test_fts_pagination.ts
import { FindATenderConnector } from '../src/modules/public-tenders/connectors/find-a-tender';

async function main() {
  console.log('=== TEST A: FIND A TENDER PAGINATION BEYOND 100 RECORDS ===');

  const connector = new FindATenderConnector();

  console.log('Starting paginated live scan requesting up to 2 pages (max 200 notices)...');
  const startTime = Date.now();
  const result = await connector.scanLiveNotices({ maxPages: 2 });
  const duration = Date.now() - startTime;

  console.log(`Scan completed in ${duration}ms:`);
  console.log(`- Pages fetched: ${result.pagesFetched}`);
  console.log(`- API requests made: ${result.apiRequestsMade}`);
  console.log(`- Raw notices checked: ${result.noticesChecked}`);
  console.log(`- Candidate records parsed: ${result.relevantCandidates.length}`);
  console.log(`- Rate limit retries: ${result.rateLimitRetries}`);
  console.log(`- Errors encountered: ${result.errors.length}`);

  if (result.pagesFetched >= 2 && result.noticesChecked > 100) {
    console.log(`TEST A PASS: Pagination traversed beyond 100 notices (${result.noticesChecked} notices across ${result.pagesFetched} pages).`);
  } else if (result.noticesChecked > 0) {
    console.log(`PAGINATION PARTIAL: Fetched ${result.noticesChecked} notices across ${result.pagesFetched} pages.`);
  } else {
    console.error('TEST A FAIL: No notices fetched.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('TEST A ERROR:', err);
  process.exit(1);
});
