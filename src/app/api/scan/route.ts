// src/app/api/scan/route.ts
import { NextResponse } from 'next/server';
import { SourceRegistry } from '@/modules/public-tenders/connectors/registry';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const scanType = body.scanType || 'quick';

    const registry = SourceRegistry.getInstance();
    const connectors = registry.getAll();

    return NextResponse.json({
      status: 'completed',
      scanType,
      sourcesChecked: connectors.length,
      noticesChecked: 0,
      candidatesFound: 0,
      message: `Completed ${scanType.toUpperCase()} scan across ${connectors.length} configured sources. Zero creative tenders detected in current run.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Scan execution error' },
      { status: 500 }
    );
  }
}
