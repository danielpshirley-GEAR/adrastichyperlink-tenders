// src/app/api/tenders/[id]/route.ts
import { NextResponse } from 'next/server';
import { getTendersRepository } from '@/shared/database/db';
import { requireApiAuth } from '@/shared/auth/require-api-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  // Direct route-level authorization guard
  const auth = await requireApiAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const tendersRepo = getTendersRepository();
    const id = params.id;
    const tender = await tendersRepo.getById(id);
    if (!tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }
    return NextResponse.json({ tender });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch tender', message: err.message }, { status: 500 });
  }
}
