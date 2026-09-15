// src/modules/public-tenders/components/TenderRow.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { TenderSummary } from '../types/tender';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface TenderRowProps {
  tender: TenderSummary;
  basePath?: string;
}

export function TenderRow({ tender, basePath = '' }: TenderRowProps) {
  const tenderRef = tender.canonicalReference || tender.id;
  const detailHref = `${basePath}/tenders/${tenderRef}`;

  const qualificationColors: Record<string, string> = {
    STRONG: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    POSSIBLE: 'bg-amber-50 text-amber-800 border-amber-200',
    WEAK: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    REJECT: 'bg-red-50 text-red-800 border-red-200',
  };

  const rawSummary = tender.plainEnglishSummary || tender.description || '';
  const cleanSummary = (rawSummary.startsWith('{') && rawSummary.includes('"error"'))
    ? 'Official procurement opportunity published by buyer. Open for detailed requirement analysis.'
    : rawSummary;

  const isContractsFinder =
    tender.sourceId === 'contracts_finder' ||
    tender.source === 'contracts_finder' ||
    tender.officialNoticeUrl?.includes('contractsfinder.service.gov.uk');

  const sourceName = isContractsFinder ? 'Contracts Finder' : 'Find a Tender';
  const completeness = tender.completeness || tender.enrichment?.completeness;
  const criticalFlags = tender.criticalFlags || tender.enrichment?.criticalFlags || [];
  const deliverables = tender.keyDeliverables || tender.enrichment?.scopeAndSpec?.buyerKeyDeliverables || [];

  return (
    <article className="p-5 hover:bg-gallery-canvas transition-colors flex flex-col justify-between gap-3 border-b border-gallery-border/60 last:border-b-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gallery-charcoal">{tender.buyerName || 'Public Authority'}</span>
            <span className="text-xs text-gallery-faint">•</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              {sourceName}
            </span>
            <span className="text-[10px] font-mono text-gallery-muted">{tender.canonicalReference}</span>
            <span className="text-xs text-gallery-faint">•</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gallery-surfaceMuted border border-gallery-border text-gallery-muted">
              Grade {tender.verificationGrade}
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                qualificationColors[tender.qualification] || 'bg-zinc-100 text-zinc-700 border-zinc-200'
              }`}
            >
              {tender.qualification}
            </span>
            {completeness && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  completeness.status === 'COMPLETE'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : completeness.status === 'PARTIAL'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                {completeness.score}/{completeness.total} facts ({completeness.percentage}%)
              </span>
            )}
            {(tender.aiReviewStatus === 'REQUIRED' || tender.aiResult === 'FAILED') && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-900 border-amber-300">
                AI REVIEW PENDING
              </span>
            )}
          </div>

          <h3 className="text-base font-extrabold text-gallery-charcoal hover:text-tender-primary transition-colors leading-snug">
            <Link href={detailHref}>{tender.title}</Link>
          </h3>

          <p className="text-xs text-gallery-muted line-clamp-2 leading-relaxed">{cleanSummary}</p>

          {/* Deliverables Pills */}
          {deliverables.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-gallery-muted">Deliverables:</span>
              {deliverables.slice(0, 4).map((d, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 truncate max-w-[260px]"
                >
                  {d}
                </span>
              ))}
            </div>
          )}

          {/* Critical Actionable Flags */}
          {criticalFlags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {criticalFlags.slice(0, 3).map((flag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200"
                >
                  {flag}
                </span>
              ))}
            </div>
          )}

          {/* Capability Tags */}
          {tender.serviceTags && tender.serviceTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {tender.serviceTags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-muted"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 shrink-0 text-right sm:min-w-[170px]">
          <div>
            <div className="text-sm font-mono font-bold text-gallery-charcoal">
              {tender.valueDescription || (tender.valueAmount ? `£${tender.valueAmount.toLocaleString()}` : 'Budget not disclosed')}
            </div>
            <div className="text-[11px] font-mono">
              {tender.submissionDeadline ? (
                tender.daysRemaining !== null && tender.daysRemaining !== undefined ? (
                  tender.daysRemaining === 0 ? (
                    <span className="text-red-700 font-bold">Expired</span>
                  ) : (
                    <span className="text-gallery-muted font-medium">{tender.daysRemaining} days remaining</span>
                  )
                ) : (
                  <span className="text-gallery-muted">Due: {tender.submissionDeadline}</span>
                )
              ) : (
                <span className="text-amber-800 bg-amber-50 border border-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded inline-block">
                  DEADLINE UNKNOWN
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href={detailHref}
              className="px-3.5 py-1.5 bg-gallery-charcoal hover:bg-black text-white text-xs font-bold rounded transition-colors shadow-2xs"
            >
              View Full Analysis
            </Link>
            <a
              href={tender.officialNoticeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open exact official public notice"
              aria-label="Open exact official public notice"
              className="p-1.5 text-gallery-faint hover:text-gallery-charcoal transition-colors rounded hover:bg-gallery-surfaceMuted inline-flex items-center border border-gallery-border"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
