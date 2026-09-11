// src/app/api/scan/url/route.ts
import { NextResponse } from 'next/server';
import { UrlVerifier } from '@/modules/public-tenders/services/url-verifier';
import { SourceRegistry } from '@/modules/public-tenders/connectors/registry';
import { requireApiAuth } from '@/shared/auth/require-api-auth';

export async function POST(req: Request) {
  // Direct route-level authorization guard
  const auth = await requireApiAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const registry = SourceRegistry.getInstance();
    const connectors = registry.getAll();
    const matchedConnector = connectors.find((c) => url.startsWith(c.baseUrl));

    // Extract potential notice ID from Find a Tender URL
    const ftsMatch = url.match(/\/Notice\/([0-9a-zA-Z\-_]+)/);
    const expectedNoticeId = ftsMatch ? ftsMatch[1] : undefined;

    const verification = await UrlVerifier.verifyNoticeUrl(url, { expectedNoticeId });

    return NextResponse.json({
      url,
      sourceId: matchedConnector?.id || 'external',
      sourceName: matchedConnector?.name || 'External Public Portal',
      verification,
      message: `Verified URL via live HTTP check. Grade: ${verification.grade} (HTTP ${verification.httpStatus || 0}). ${verification.notes}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to analyze URL', message: error.message },
      { status: 500 }
    );
  }
}
