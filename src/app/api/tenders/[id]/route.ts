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
    let tender = await tendersRepo.getById(id);
    if (!tender) {
      tender = await tendersRepo.getByCanonicalReference(id);
    }
    if (!tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

    // Auto-enrich actionable tenders on open if not yet enriched
    const isActionable = tender.qualification === 'STRONG' || tender.qualification === 'POSSIBLE' || tender.bidDecisionState === 'BID' || tender.bidDecisionState === 'WATCH';
    const isEnriched = Boolean(tender.enrichment && tender.enrichment.scopeAndSpec && tender.enrichment.scopeAndSpec.whatBuyerWants);

    if (isActionable && !isEnriched) {
      try {
        const { DetailEnrichmentService } = await import('@/modules/public-tenders/services/detail-enrichment');
        const enrichmentService = new DetailEnrichmentService();
        const enrichment = await enrichmentService.enrichTender(tender);
        tender.procurementStage = enrichment.procurementStage;
        tender.requirements = enrichment.requirements;
        tender.documents = enrichment.documents;
        tender.evaluationCriteria = enrichment.evaluationCriteria;
        tender.enrichment = enrichment;
        tender = await tendersRepo.save(tender);
      } catch (enrichErr: any) {
        console.warn(`[Api/Tenders/${id}] Auto-enrichment failed:`, enrichErr.message);
      }
    }

    return NextResponse.json({ tender });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch tender', message: err.message }, { status: 500 });
  }
}
