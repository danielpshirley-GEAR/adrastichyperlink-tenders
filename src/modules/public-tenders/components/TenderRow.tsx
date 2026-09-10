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
  const detailHref = `${basePath}/tenders/${tender.id}`;

  const qualificationColors: Record<string, string> = {
    STRONG: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    POSSIBLE: 'bg-amber-50 text-amber-800 border-amber-200',
    WEAK: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    REJECT: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <article className="p-5 hover:bg-gallery-canvas transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gallery-charcoal">{tender.buyerName}</span>
          <span className="text-xs text-gallery-faint">•</span>
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
        </div>

        <h3 className="text-sm font-extrabold text-gallery-charcoal hover:text-tender-primary transition-colors">
          <Link href={detailHref}>{tender.title}</Link>
        </h3>

        <p className="text-xs text-gallery-muted line-clamp-2 leading-relaxed">{tender.plainEnglishSummary}</p>

        {tender.serviceTags && tender.serviceTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tender.serviceTags.map((tag) => (
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

      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 text-right">
        <div>
          <div className="text-xs font-mono font-bold text-gallery-charcoal">
            {tender.valueDescription || (tender.valueAmount ? `£${tender.valueAmount.toLocaleString()}` : 'Value TBC')}
          </div>
          <div className="text-[11px] text-gallery-muted font-mono">{tender.daysRemaining} days remaining</div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={detailHref}
            className="px-3 py-1.5 bg-gallery-surface hover:bg-gallery-surfaceMuted text-gallery-charcoal border border-gallery-border text-xs font-bold rounded transition-colors shadow-2xs"
          >
            View Details
          </Link>
          <a
            href={tender.officialNoticeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open exact official public notice"
            className="p-1.5 text-gallery-faint hover:text-gallery-charcoal transition-colors rounded hover:bg-gallery-surfaceMuted"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
