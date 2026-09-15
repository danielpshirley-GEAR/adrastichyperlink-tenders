// src/app/api/tenders/[id]/analyse/route.ts
import { NextResponse } from 'next/server';
import { getTendersRepository } from '@/shared/database/db';
import { requireApiAuth } from '@/shared/auth/require-api-auth';
import { DetailEnrichmentService } from '@/modules/public-tenders/services/detail-enrichment';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    const enrichmentService = new DetailEnrichmentService();
    const enrichment = await enrichmentService.enrichTender(tender);

    tender.procurementStage = enrichment.procurementStage;
    tender.requirements = enrichment.requirements;
    tender.documents = enrichment.documents;
    tender.evaluationCriteria = enrichment.evaluationCriteria;
    tender.enrichment = enrichment;

    const saved = await tendersRepo.save(tender);

    return NextResponse.json({
      success: true,
      tender: saved,
      enrichment,
    });
  } catch (err: any) {
    console.error(`[Api/Tenders/${params.id}/analyse] Enrichment error:`, err);
    return NextResponse.json(
      { error: 'Failed to enrich tender', message: err.message },
      { status: 500 }
    );
  }
}
