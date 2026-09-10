// src/modules/public-tenders/components/ApplicationsView.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { TenderApplication } from '../types/application';
import { FileText, ArrowRight, Clock, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

interface ApplicationsViewProps {
  applications: TenderApplication[];
  basePath?: string;
  isReviewMode?: boolean;
}

export function ApplicationsView({
  applications,
  basePath = '',
  isReviewMode = false,
}: ApplicationsViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="border-b border-gallery-border pb-6 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-widest text-gallery-muted font-semibold flex items-center gap-2">
          <span>ACTIVE SUBMISSIONS & BID COMPOSITION</span>
          {isReviewMode && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
              REVIEW DATA
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gallery-charcoal tracking-tight">
          Tender Applications
        </h1>
        <p className="text-xs sm:text-sm text-gallery-muted">
          Active bid proposals created when Daniel chooses BID on an eligible public opportunity.
        </p>
      </header>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="p-12 text-center bg-gallery-surface border border-gallery-border rounded-lg space-y-4 max-w-2xl mx-auto my-8 shadow-2xs">
          <div className="w-10 h-10 rounded-full bg-tender-primaryLight border border-tender-primaryBorder text-tender-primary flex items-center justify-center mx-auto">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gallery-charcoal">No Active Applications</h2>
            <p className="text-xs text-gallery-muted leading-relaxed">
              Applications are created strictly when you evaluate a qualified procurement and explicitly choose{' '}
              <strong>BID</strong>. This prevents speculative work and focuses effort on high-probability opportunities.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`${basePath}/tenders`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-tender-primary hover:bg-tender-primaryHover text-white text-xs font-bold rounded-md transition-colors shadow-xs"
            >
              <span>Review Qualified Tenders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="text-xs font-mono text-gallery-muted">
            Showing {applications.length} active proposal project
          </div>

          <div className="divide-y divide-gallery-border bg-gallery-surface border border-gallery-border rounded-lg overflow-hidden shadow-2xs">
            {applications.map((app) => (
              <article
                key={app.id}
                className="p-6 hover:bg-gallery-canvas transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gallery-charcoal">{app.buyerName}</span>
                    <span className="text-xs text-gallery-faint">•</span>
                    <span className="text-[10px] font-mono text-gallery-muted">{app.canonicalReference}</span>
                    <span className="text-xs text-gallery-faint">•</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-bold border border-sky-200">
                      {app.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      Suitability {app.overallSuitabilityScore}%
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-gallery-charcoal hover:text-tender-primary transition-colors">
                    <Link href={`${basePath}/applications/${app.id}`}>{app.tenderTitle}</Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gallery-muted font-mono pt-1">
                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {app.questions.filter((q) => q.status === 'READY').length} Questions Drafted
                      </span>
                    </div>

                    {app.factsRequiredCount > 0 && (
                      <div className="flex items-center gap-1 text-amber-700 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{app.factsRequiredCount} Fact Required</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-gallery-charcoal flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{app.daysRemaining !== null && app.daysRemaining !== undefined ? `${app.daysRemaining} days left` : 'Active Application'}</span>
                    </div>
                    <div className="text-[10px] text-gallery-muted font-mono">
                      {app.submissionDeadline ? `Due: ${new Date(app.submissionDeadline).toLocaleDateString()}` : 'Deadline not published'}
                    </div>
                  </div>

                  <Link
                    href={`${basePath}/applications/${app.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-tender-primary hover:bg-tender-primaryHover text-white text-xs font-bold rounded transition-colors shadow-2xs"
                  >
                    <span>Open Bid Editor</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
