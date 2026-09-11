// src/app/api/tenders/route.ts
import { NextResponse } from 'next/server';
import { getTendersRepository } from '@/shared/database/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
  try {
    const tendersRepo = getTendersRepository();
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'ALL';

    const [tenders, counts] = await Promise.all([
      tendersRepo.getAll(tab),
      tendersRepo.countByTab(),
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
