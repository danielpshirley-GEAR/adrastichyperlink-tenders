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

export async function GET() {
  return POST();
}
