// src/modules/public-tenders/components/TendersInboxView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TenderSummary } from '../types/tender';
import { TenderRow } from './TenderRow';
import { Search, Filter, Inbox } from 'lucide-react';

const TABS = ['ALL', 'STRONG', 'POSSIBLE', 'BID', 'WATCH', 'PASSED', 'ARCHIVED'] as const;

interface TendersInboxViewProps {
  tenders: TenderSummary[];
  basePath?: string;
  isReviewMode?: boolean;
}

export function TendersInboxView({
  tenders: initialTenders,
  basePath = '',
  isReviewMode = false,
}: TendersInboxViewProps) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('ALL');
  const [tenders, setTenders] = useState<TenderSummary[]>(initialTenders);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReviewMode) {
      setTenders(initialTenders);
      return;
    }

    async function loadTabData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tenders?tab=${activeTab}`);
        if (res.ok) {
          const data = await res.json();
          setTenders(data.tenders || []);
          if (data.counts) setCounts(data.counts);
        }
      } catch (err) {
        console.error('Failed to load tab tenders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTabData();
  }, [activeTab, initialTenders, isReviewMode]);

  // Client-side strict filter guarantee
  const filteredTenders = tenders.filter((t) => {
    if (activeTab === 'ALL') return !t.isArchived;
    if (activeTab === 'STRONG') return t.qualification === 'STRONG' && !t.isArchived;
    if (activeTab === 'POSSIBLE') return t.qualification === 'POSSIBLE' && !t.isArchived;
    if (activeTab === 'BID') return t.bidDecisionState === 'BID' && !t.isArchived;
    if (activeTab === 'WATCH') return t.bidDecisionState === 'WATCH' && !t.isArchived;
    if (activeTab === 'PASSED') return t.bidDecisionState === 'PASS' && !t.isArchived;
    if (activeTab === 'ARCHIVED') return t.isArchived;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl">
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
        {TABS.map((tab) => {
          const count = counts[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-xs font-semibold tracking-wider transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'border-tender-primary text-tender-primary font-bold'
                  : 'border-transparent text-gallery-muted hover:text-gallery-charcoal'
              }`}
            >
              <span>{tab}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    activeTab === tab
                      ? 'bg-tender-primary/10 text-tender-primary font-bold'
                      : 'bg-gallery-border text-gallery-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-gallery-surface border border-gallery-border rounded-lg text-xs">
        <div className="flex items-center gap-2 text-gallery-muted">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wider font-mono text-[10px]">Active Filter:</span>
          <span className="px-2 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-charcoal font-medium font-mono text-[11px]">
            Tab: {activeTab}
          </span>
          <span className="px-2 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-charcoal font-medium font-mono text-[11px]">
            Source: Find a Tender
          </span>
        </div>

        <div className="text-gallery-muted font-mono text-[11px]">
          Showing {filteredTenders.length} notices
        </div>
      </div>

      {/* Tender List */}
      {loading ? (
        <div className="py-16 text-center text-xs font-mono text-gallery-muted">
          Loading {activeTab} notices...
        </div>
      ) : filteredTenders.length === 0 ? (
        <div className="py-16 text-center bg-gallery-surface border border-gallery-border rounded-lg space-y-3">
          <Inbox className="w-8 h-8 text-gallery-faint mx-auto" />
          <div className="text-sm font-bold text-gallery-charcoal">No Tenders in {activeTab}</div>
          <p className="text-xs text-gallery-muted max-w-md mx-auto">
            {activeTab === 'BID'
              ? 'No tenders currently marked for bidding. Open any opportunity and select "BID ON THIS OPPORTUNITY" to start an application.'
              : activeTab === 'WATCH'
              ? 'No tenders on the watch list. Mark opportunities as WATCH to monitor them.'
              : 'New public notices will appear here once discovered during discovery scans.'}
          </p>
          <div className="pt-2">
            <Link
              href={`${basePath}/scan`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-tender-primary hover:underline"
            >
              <span>Go to Scan Management &rarr;</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gallery-surface border border-gallery-border rounded-lg divide-y divide-gallery-border shadow-2xs">
          {filteredTenders.map((tender) => (
            <TenderRow key={tender.id} tender={tender} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}
