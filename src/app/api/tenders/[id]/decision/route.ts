// src/app/api/tenders/[id]/decision/route.ts
import { NextResponse } from 'next/server';
import { TendersRepository } from '@/shared/database/repositories/tenders';
import { ApplicationsRepository } from '@/shared/database/repositories/applications';
import { BidDecisionType } from '@/modules/public-tenders/types/tender';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const decision = body.decision as BidDecisionType;
    const reasoning = body.reasoning as string | undefined;

    if (!['BID', 'PASS', 'WATCH', 'PARTNER', 'UNDECIDED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision type' }, { status: 400 });
    }

    const success = await TendersRepository.setBidDecision(id, decision, reasoning);
    if (!success) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

    const updated = await TendersRepository.getById(id);

    let application = null;
    if (decision === 'BID' && updated) {
      // Create or retrieve application shell
      application = await ApplicationsRepository.createShellForTender(updated.id);
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
