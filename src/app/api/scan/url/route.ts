// src/app/api/scan/url/route.ts
import { NextResponse } from 'next/server';
import { SourceRegistry } from '@/modules/public-tenders/connectors/registry';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const registry = SourceRegistry.getInstance();
    const connectors = registry.getAll();
    const matchedConnector = connectors.find((c) => url.startsWith(c.baseUrl));

    if (!matchedConnector) {
      return NextResponse.json({
        isValid: false,
        grade: 'D',
        message: 'URL does not match any of the 7 configured UK procurement sources.',
      });
    }

    const verification = await matchedConnector.verifyNotice(url);

    return NextResponse.json({
      sourceId: matchedConnector.id,
      sourceName: matchedConnector.name,
      verification,
      message: `Verified URL against ${matchedConnector.name}. Grade: ${verification.grade}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze URL' },
      { status: 500 }
    );
  }
}
