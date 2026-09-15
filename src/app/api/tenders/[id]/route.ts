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
    let tender = await tendersRepo.findResilient(id);

    // Dynamic fallback: If not found in local repo, check notice pattern
    if (!tender) {
      if (/^\d{6}-\d{4}$/.test(id.trim())) {
        try {
          const { FindATenderConnector } = await import('@/modules/public-tenders/connectors/find-a-tender');
          const connector = new FindATenderConnector();
          const notice = await connector.fetchNotice(id.trim());
          if (notice) {
            tender = await tendersRepo.save({
              ...notice,
              canonicalReference: notice.noticeId,
              discoveredAt: new Date().toISOString(),
              lastVerifiedAt: new Date().toISOString(),
            });
          }
        } catch (fetchErr: any) {
          console.warn(`[Api/Tenders/${id}] Dynamic FTS fallback fetch failed:`, fetchErr.message);
        }
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(id.trim())) {
        try {
          const { ContractsFinderConnector } = await import('@/modules/public-tenders/connectors/contracts-finder');
          const connector = new ContractsFinderConnector();
          const notice = await connector.fetchNotice(id.trim());
          if (notice) {
            tender = await tendersRepo.save({
              ...notice,
              canonicalReference: notice.noticeId,
              discoveredAt: new Date().toISOString(),
              lastVerifiedAt: new Date().toISOString(),
            });
          }
        } catch (fetchErr: any) {
          console.warn(`[Api/Tenders/${id}] Dynamic CF fallback fetch failed:`, fetchErr.message);
        }
      }
    }

    if (!tender) {
      return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
    }

    // Auto-enrich actionable tenders on open if missing deep enrichment or completeness
    const isActionable = tender.qualification === 'STRONG' || tender.qualification === 'POSSIBLE' || tender.bidDecisionState === 'BID' || tender.bidDecisionState === 'WATCH';
    const hasDeepEnrichment = Boolean(tender.enrichment?.factModel && tender.enrichment?.completeness);

    if (isActionable && !hasDeepEnrichment) {
      try {
        const { DetailEnrichmentService } = await import('@/modules/public-tenders/services/detail-enrichment');
        const enrichmentService = new DetailEnrichmentService();
        const enrichment = await enrichmentService.enrichTender(tender);
        tender.procurementStage = enrichment.procurementStage;
        tender.requirements = enrichment.requirements;
        tender.documents = enrichment.documents;
        tender.evaluationCriteria = enrichment.evaluationCriteria;
        tender.enrichment = enrichment;
        tender.completeness = enrichment.completeness;
        tender.criticalFlags = enrichment.criticalFlags;
        tender.keyDeliverables = enrichment.scopeAndSpec?.buyerKeyDeliverables || enrichment.scopeAndSpec?.keyDeliverables;
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
