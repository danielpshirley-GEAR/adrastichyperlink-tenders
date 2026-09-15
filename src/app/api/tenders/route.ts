// src/app/api/tenders/route.ts
import { NextResponse } from 'next/server';
import { getTendersRepository } from '@/shared/database/db';
import { requireApiAuth } from '@/shared/auth/require-api-auth';
import { TenderSummary } from '@/modules/public-tenders/types/tender';

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
    const q = searchParams.get('q')?.trim().toLowerCase() || null;
    const qualification = searchParams.get('qualification') || null;
    const stage = searchParams.get('stage')?.trim().toLowerCase() || null;
    const source = searchParams.get('source')?.trim().toLowerCase() || null;
    const cpvParam = searchParams.get('cpv') || null;
    const cpvList = cpvParam ? cpvParam.split(',').map((c) => c.trim()).filter(Boolean) : [];
    const minValue = searchParams.get('minValue') ? parseFloat(searchParams.get('minValue')!) : null;
    const maxValue = searchParams.get('maxValue') ? parseFloat(searchParams.get('maxValue')!) : null;
    const includeUnknownValue = searchParams.get('includeUnknownValue') !== 'false';
    const sme = searchParams.get('sme') === 'true';
    const vcse = searchParams.get('vcse') === 'true';
    const buyer = searchParams.get('buyer')?.trim().toLowerCase() || null;
    const buyerType = searchParams.get('buyerType')?.trim().toLowerCase() || null;
    const publishedFrom = searchParams.get('publishedFrom') || null;
    const publishedTo = searchParams.get('publishedTo') || null;
    const deadlineFrom = searchParams.get('deadlineFrom') || null;
    const deadlineTo = searchParams.get('deadlineTo') || null;
    const service = searchParams.get('service')?.trim().toLowerCase() || null;
    const sort = searchParams.get('sort') || 'relevance';
    const includeArchived = searchParams.get('includeArchived') === 'true' || tab === 'ARCHIVED';

    const [allTenders, counts] = await Promise.all([
      tendersRepo.getAll(includeArchived ? 'ARCHIVED' : (tab === 'ALL' ? 'ALL' : tab)),
      tendersRepo.countByTab(),
    ]);

    // Apply filters
    let results: TenderSummary[] = allTenders.filter((t) => {
      // 1. Archived check
      const isArchived = t.isArchived || t.lifecycleStatus === 'EXPIRED' || t.lifecycleStatus === 'REJECTED' || t.qualification === 'REJECT';
      if (!includeArchived && isArchived && tab !== 'ARCHIVED') {
        return false;
      }
      if (includeArchived && tab === 'ARCHIVED' && !isArchived) {
        return false;
      }

      // 2. Keyword query search (q)
      if (q) {
        // Extract phrases in quotes or words
        const phrases = (q.match(/"([^"]+)"/g) || []).map((p) => p.replace(/"/g, ''));
        const words = q.replace(/"[^"]+"/g, '').split(/\s+/).filter(Boolean);
        const searchCorpus = [
          t.title,
          t.buyerName,
          t.description,
          t.canonicalReference,
          t.sourceId,
          t.sourceName,
          ...(t.cpvCodes || []),
          ...(t.serviceTags || []),
          ...(t.keyDeliverables || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        for (const phrase of phrases) {
          if (!searchCorpus.includes(phrase)) return false;
        }
        for (const word of words) {
          if (!searchCorpus.includes(word)) return false;
        }
      }

      // 3. Qualification filter
      if (qualification && qualification !== 'all') {
        if (t.qualification.toUpperCase() !== qualification.toUpperCase()) {
          return false;
        }
      }

      // 4. Procurement Stage filter
      if (stage && stage !== 'all') {
        const tStage = (t.procurementStage || '').toLowerCase();
        if (stage === 'open' && !tStage.includes('open') && !tStage.includes('tender')) return false;
        if (stage === 'pipeline' && !tStage.includes('pipeline')) return false;
        if (stage === 'market_engagement' && !tStage.includes('engagement') && !tStage.includes('preliminary')) return false;
        if (stage === 'planned' && !tStage.includes('planned') && !tStage.includes('planning')) return false;
      }

      // 5. Source filter
      if (source && source !== 'all') {
        const sId = (t.sourceId || t.source || '').toLowerCase();
        if (source === 'find_a_tender' && !sId.includes('find_a_tender') && !sId.includes('fts')) return false;
        if (source === 'contracts_finder' && !sId.includes('contracts_finder')) return false;
      }

      // 6. CPV Codes filter
      if (cpvList.length > 0) {
        const tCpvs = (t.cpvCodes || []).map((c) => c.replace(/[^0-9]/g, ''));
        const hasCpvMatch = cpvList.some((filterCpv) => {
          const cleanFilter = filterCpv.replace(/[^0-9]/g, '');
          return tCpvs.some((c) => c.startsWith(cleanFilter.slice(0, 4)) || c.startsWith(cleanFilter));
        });
        if (!hasCpvMatch) return false;
      }

      // 7. Budget / Value filter
      const hasValue = typeof t.valueAmount === 'number' && !isNaN(t.valueAmount);
      if (minValue !== null || maxValue !== null) {
        if (!hasValue) {
          if (!includeUnknownValue) return false;
        } else {
          if (minValue !== null && t.valueAmount! < minValue) return false;
          if (maxValue !== null && t.valueAmount! > maxValue) return false;
        }
      }

      // 8. Suitability (SME / VCSE)
      if (sme && !t.smeSuitable) return false;
      if (vcse && !t.vcseSuitable) return false;

      // 9. Buyer Name & Type
      if (buyer && !(t.buyerName || '').toLowerCase().includes(buyer)) return false;
      if (buyerType && !(t.buyerType || '').toLowerCase().includes(buyerType)) return false;

      // 10. Dates
      if (publishedFrom && t.publishedAt && new Date(t.publishedAt) < new Date(publishedFrom)) return false;
      if (publishedTo && t.publishedAt && new Date(t.publishedAt) > new Date(publishedTo)) return false;
      if (deadlineFrom && t.submissionDeadline && new Date(t.submissionDeadline) < new Date(deadlineFrom)) return false;
      if (deadlineTo && t.submissionDeadline && new Date(t.submissionDeadline) > new Date(deadlineTo)) return false;

      // 11. Service taxonomy
      if (service && service !== 'all') {
        const hasTag = (t.serviceTags || []).some((tag) => tag.toLowerCase().includes(service));
        if (!hasTag) return false;
      }

      return true;
    });

    // Apply Sorting
    results.sort((a, b) => {
      if (sort === 'newest') {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      }

      if (sort === 'deadline') {
        const deadA = a.submissionDeadline ? new Date(a.submissionDeadline).getTime() : Infinity;
        const deadB = b.submissionDeadline ? new Date(b.submissionDeadline).getTime() : Infinity;
        return deadA - deadB;
      }

      if (sort === 'value_high') {
        const valA = a.valueAmount || 0;
        const valB = b.valueAmount || 0;
        return valB - valA;
      }

      if (sort === 'value_low') {
        const valA = a.valueAmount || 0;
        const valB = b.valueAmount || 0;
        return valA - valB;
      }

      if (sort === 'adrastic_fit') {
        const qualWeight = (q: string) => (q === 'STRONG' ? 3 : q === 'POSSIBLE' ? 2 : q === 'WATCH' ? 1 : 0);
        const compA = a.completeness?.percentage || 0;
        const compB = b.completeness?.percentage || 0;
        const diff = qualWeight(b.qualification) - qualWeight(a.qualification);
        if (diff !== 0) return diff;
        return compB - compA;
      }

      // Default: 'relevance'
      const qualWeight = (q: string) => (q === 'STRONG' ? 3 : q === 'POSSIBLE' ? 2 : q === 'WATCH' ? 1 : 0);
      const diff = qualWeight(b.qualification) - qualWeight(a.qualification);
      if (diff !== 0) return diff;
      const compA = a.completeness?.percentage || 0;
      const compB = b.completeness?.percentage || 0;
      if (compB !== compA) return compB - compA;
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({
      total: results.length,
      currentTab: tab,
      counts,
      tenders: results,
      activeFilters: {
        q,
        qualification,
        stage,
        source,
        cpvs: cpvList,
        minValue,
        maxValue,
        sme,
        vcse,
        buyer,
        sort,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch tenders', message: err.message }, { status: 500 });
  }
}
