// src/modules/public-tenders/components/TodayView.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, AlertCircle, FileText, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';
import { TenderSummary } from '../types/tender';
import { TenderRow } from './TenderRow';

export interface TodayData {
  greeting: string;
  summary: string;
  qualifiedTendersCount: number;
  activeApplicationsCount: number;
  missingInformationCount: number;
  immediateActions: {
    id: string;
    title: string;
    description: string;
    deadline: string;
    priority: string;
    href: string;
    badge: string;
  }[];
}

interface TodayViewProps {
  todayData: TodayData;
  qualifiedTenders?: TenderSummary[];
  basePath?: string;
  isReviewMode?: boolean;
}

export function TodayView({
  todayData,
  qualifiedTenders = [],
  basePath = '',
  isReviewMode = false,
}: TodayViewProps) {
  return (
    <div className="space-y-8">
      {/* Today Editorial Header */}
      <header className="space-y-2 border-b border-gallery-border pb-6">
        <div className="text-[11px] font-mono uppercase tracking-widest text-gallery-muted font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
          <span>WHAT NEEDS MY ATTENTION TODAY?</span>
          {isReviewMode && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
              REVIEW DATA
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gallery-charcoal">
          {todayData.greeting}
        </h1>
        <p className="text-sm text-gallery-muted">{todayData.summary}</p>
      </header>

      {/* Action Priority Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={`${basePath}/tenders`}
          className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-3 hover:border-tender-primary transition-all group block shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs font-mono text-gallery-muted">
            <span>QUALIFIED TENDERS</span>
            <Clock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-gallery-charcoal">
            {todayData.qualifiedTendersCount} Strong
          </div>
          <p className="text-xs text-gallery-muted">Tenders meeting direct creative studio eligibility criteria.</p>
        </Link>

        <Link
          href={`${basePath}/applications`}
          className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-3 hover:border-tender-primary transition-all group block shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs font-mono text-gallery-muted">
            <span>ACTIVE APPLICATIONS</span>
            <FileText className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-gallery-charcoal">
            {todayData.activeApplicationsCount} In Progress
          </div>
          <p className="text-xs text-gallery-muted">Tenders marked BID with ongoing submission drafts.</p>
        </Link>

        <Link
          href={`${basePath}/knowledge`}
          className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-3 hover:border-tender-primary transition-all group block shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs font-mono text-gallery-muted">
            <span>MISSING INFORMATION</span>
            <AlertCircle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold text-gallery-charcoal">
            {todayData.missingInformationCount} Fact Required
          </div>
          <p className="text-xs text-gallery-muted">Unresolved facts required to complete pending bid drafts.</p>
        </Link>
      </section>

      {/* Immediate Actions List */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gallery-charcoal">Immediate Actions Today</h2>
          <Link
            href={`${basePath}/scan`}
            className="text-xs font-semibold text-tender-primary flex items-center gap-1 hover:underline"
          >
            <span>Scan Management</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-gallery-border border border-gallery-border rounded-lg overflow-hidden">
          {todayData.immediateActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gallery-canvas transition-colors group block"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-gallery-charcoal group-hover:text-tender-primary transition-colors">
                    {action.title}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                    {action.badge}
                  </span>
                </div>
                <p className="text-xs text-gallery-muted">{action.description}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-amber-700 font-medium">{action.deadline}</span>
                <ArrowRight className="w-4 h-4 text-gallery-muted group-hover:text-tender-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Qualified Tenders Discovery Feed */}
      {qualifiedTenders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
              Qualified Opportunities Priority ({qualifiedTenders.length})
            </h2>
            <Link
              href={`${basePath}/tenders`}
              className="text-xs font-semibold text-tender-primary hover:underline"
            >
              View all in inbox →
            </Link>
          </div>
          <div className="divide-y divide-gallery-border bg-gallery-surface border border-gallery-border rounded-lg overflow-hidden shadow-2xs">
            {qualifiedTenders.map((tender) => (
              <TenderRow key={tender.id} tender={tender} basePath={basePath} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
