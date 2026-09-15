// src/app/api/tenders/[id]/decision/route.ts
import { NextResponse } from 'next/server';
import { getTendersRepository, getApplicationsRepository } from '@/shared/database/db';
import { BidDecisionType } from '@/modules/public-tenders/types/tender';
import { requireApiAuth } from '@/shared/auth/require-api-auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Direct route-level authorization guard
  const auth = await requireApiAuth(req);
  if (!auth.authenticated) {
    return auth.response;
  }

  try {
    const tendersRepo = getTendersRepository();
    const applicationsRepo = getApplicationsRepository();

    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const decision = body.decision as BidDecisionType;
    const reasoning = body.reasoning as string | undefined;

    if (!['BID', 'PASS', 'WATCH', 'PARTNER', 'UNDECIDED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision type' }, { status: 400 });
    }

    const success = await tendersRepo.setBidDecision(id, decision, reasoning);
    if (!success) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

    const updated = await tendersRepo.getById(id);

    let application = null;
    if (decision === 'BID' && updated) {
      // Create or retrieve application shell
      application = await applicationsRepo.createShellForTender(updated.id);
    }

    return NextResponse.json({
      tender: updated,
      application,
      message: `Tender ${updated?.canonicalReference || id} marked as ${decision}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to record bid decision', message: err.message }, { status: 500 });
  }
}
