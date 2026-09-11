// src/app/api/tenders/route.ts
import { NextResponse } from 'next/server';
import { getTendersRepository } from '@/shared/database/db';
import { requireApiAuth } from '@/shared/auth/require-api-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: Request) {
  // Direct route-level authorization guard
  const auth = await requireApiAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

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
