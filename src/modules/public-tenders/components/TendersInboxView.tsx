// src/modules/public-tenders/components/TendersInboxView.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TenderSummary } from '../types/tender';
import { TenderRow } from './TenderRow';
import { Search, Filter, Inbox, ExternalLink } from 'lucide-react';

const TABS = ['ALL', 'STRONG', 'POSSIBLE', 'BID', 'WATCH', 'PASSED', 'ARCHIVED'] as const;

interface TendersInboxViewProps {
  tenders: TenderSummary[];
  basePath?: string;
  isReviewMode?: boolean;
}

export function TendersInboxView({ tenders, basePath = '', isReviewMode = false }: TendersInboxViewProps) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('ALL');

  const filteredTenders = tenders.filter((t) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'STRONG') return t.qualification === 'STRONG';
    if (activeTab === 'POSSIBLE') return t.qualification === 'POSSIBLE';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Editorial Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gallery-border pb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-gallery-muted font-semibold flex items-center gap-2">
            <span>QUALIFIED PROCUREMENT INBOX</span>
            {isReviewMode && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                REVIEW DATA
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gallery-charcoal tracking-tight">
            Tender Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-gallery-muted mt-1">
            Official UK public notices screened for creative service capability and commercial viability.
          </p>
        </div>

        <Link
          href={`${basePath}/scan`}
          className="px-4 py-2 bg-tender-primary hover:bg-tender-primaryHover text-white text-xs font-bold rounded-md transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Scan Sources</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gallery-border overflow-x-auto pb-px">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-tender-primary text-tender-primary font-bold'
                : 'border-transparent text-gallery-muted hover:text-gallery-charcoal'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gallery-surface border border-gallery-border rounded-lg text-xs">
        <div className="flex items-center gap-2 text-gallery-muted">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Filters:</span>
          <span className="px-2 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-charcoal font-medium">All Sources</span>
          <span className="px-2 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-charcoal font-medium">All Services</span>
          <span className="px-2 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-charcoal font-medium">All Values</span>
        </div>

        <div className="text-gallery-muted font-mono text-[11px]">
          Showing {filteredTenders.length} notices
        </div>
      </div>

      {/* Tender List */}
      {filteredTenders.length === 0 ? (
        <div className="py-16 text-center bg-gallery-surface border border-gallery-border rounded-lg space-y-3">
          <Inbox className="w-8 h-8 text-gallery-faint mx-auto" />
          <div className="text-sm font-bold text-gallery-charcoal">No Tenders in {activeTab}</div>
          <p className="text-xs text-gallery-muted max-w-md mx-auto">
            New public-sector notices will populate here once discovered during scheduled or manual discovery scans.
          </p>
          <div className="pt-2">
            <Link
              href={`${basePath}/scan`}
              className="text-xs font-semibold text-tender-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Configure source scanners</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        <section className="divide-y divide-gallery-border bg-gallery-surface border border-gallery-border rounded-lg overflow-hidden shadow-xs">
          {filteredTenders.map((tender) => (
            <TenderRow key={tender.id} tender={tender} basePath={basePath} />
          ))}
        </section>
      )}
    </div>
  );
}
