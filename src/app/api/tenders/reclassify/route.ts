// src/app/api/tenders/reclassify/route.ts
import { NextResponse } from 'next/server';
import { ReclassificationSweep } from '@/modules/public-tenders/services/reclassification-sweep';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST() {
  try {
    const result = await ReclassificationSweep.execute();
    return NextResponse.json({
      status: 'COMPLETED',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Reclassification sweep failed:', err);
    return NextResponse.json(
      {
        status: 'FAILED',
        error: 'Reclassification sweep failed',
        message: err.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET requests must never mutate data or trigger reclassification sweeps.
 * Enforces RFC 9110 Method Not Allowed semantics.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Reclassification sweep mutates state and must be triggered via POST.',
    },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    }
  );
}
