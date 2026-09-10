// scripts/test_direct_notice.ts
import { FindATenderConnector } from '../src/modules/public-tenders/connectors/find-a-tender';

async function main() {
  console.log('=== TEST D: DIRECT NOTICE RETRIEVAL ===');
  const connector = new FindATenderConnector();

  console.log('Testing direct notice retrieval by notice ID (085808-2026)...');
  const notice = await connector.fetchNotice('085808-2026');
  if (!notice) {
    throw new Error('Expected notice 085808-2026 to be found, got null');
  }
  console.log(`- Found notice ID: ${notice.noticeId}`);
  console.log(`- Title: ${notice.title}`);
  console.log(`- Buyer: ${notice.buyerName}`);
  console.log(`- Published: ${notice.publishedAt}`);
  console.log(`- Deadline: ${notice.submissionDeadline}`);
  console.log(`- Official URL: ${notice.officialNoticeUrl}`);

  if (notice.title === 'Notice 085808-2026' || notice.buyerName === 'Unknown Buyer') {
    throw new Error('FAIL: Returned fabricated dummy shell record!');
  }

  console.log('Testing direct notice retrieval by OCID (ocds-h6vhtk-06f6a4)...');
  const ocidNotice = await connector.fetchNotice('ocds-h6vhtk-06f6a4');
  if (!ocidNotice) {
    throw new Error('Expected notice with OCID ocds-h6vhtk-06f6a4 to be found, got null');
  }
  console.log(`- Found via OCID: ${ocidNotice.noticeId} (${ocidNotice.title})`);

  console.log('Testing non-existent notice ID (999999-2099)...');
  const bogus = await connector.fetchNotice('999999-2099');
  if (bogus !== null) {
    throw new Error(`FAIL: Expected null for non-existent notice, got: ${JSON.stringify(bogus)}`);
  }
  console.log('- Non-existent notice correctly returned null (no fabricated shell).');

  console.log('TEST D PASS: Direct notice retrieval works accurately with official OCDS endpoint.');
}

main().catch((err) => {
  console.error('TEST D ERROR:', err);
  process.exit(1);
});
