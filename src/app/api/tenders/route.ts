// src/app/api/tenders/route.ts
import { NextResponse } from 'next/server';
import { TendersRepository } from '@/shared/database/repositories/tenders';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'ALL';
    const qualification = searchParams.get('qualification') as any;

    const [tenders, counts] = await Promise.all([
      TendersRepository.getAll({ tab, qualification }),
      TendersRepository.countByTab(),
    ]);

    return NextResponse.json({
      total: tenders.length,
      currentTab: tab,
      counts,
      tenders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch tenders', message: err.message }, { status: 500 });
  }
}
