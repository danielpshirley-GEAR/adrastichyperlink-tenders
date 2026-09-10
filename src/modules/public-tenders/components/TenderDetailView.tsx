// src/modules/public-tenders/components/TenderDetailView.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ReviewTenderDetail } from '../review/data';
import { RequirementsTable } from './RequirementsTable';
import { DocumentList } from './DocumentList';
import { BidDecision } from './BidDecision';
import {
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  Coins,
  Building2,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';

interface TenderDetailViewProps {
  tender: ReviewTenderDetail;
  basePath?: string;
  isReviewMode?: boolean;
}

export function TenderDetailView({
  tender,
  basePath = '',
  isReviewMode = false,
}: TenderDetailViewProps) {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back link */}
      <div>
        <Link
          href={`${basePath}/tenders`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gallery-muted hover:text-gallery-charcoal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tender Opportunities</span>
        </Link>
      </div>

      {/* Header Block */}
      <header className="space-y-3 border-b border-gallery-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-gallery-muted font-bold">
            {tender.canonicalReference}
          </span>
          <span className="text-xs text-gallery-faint">•</span>
          <span className="text-xs font-semibold text-gallery-charcoal">{tender.buyerName}</span>
          <span className="text-xs text-gallery-faint">•</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verification Grade {tender.verificationGrade} (Official Source Confirmed)
          </span>
          {isReviewMode && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
              REVIEW DATA
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gallery-charcoal tracking-tight">
          {tender.title}
        </h1>

        <p className="text-sm text-gallery-muted leading-relaxed max-w-3xl">
          {tender.plainEnglishSummary}
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
          <a
            href={tender.officialNoticeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gallery-surfaceMuted hover:bg-gallery-border text-gallery-charcoal border border-gallery-border rounded transition-colors"
          >
            <span>Open Official Notice ({tender.sourceId})</span>
            <ExternalLink className="w-3.5 h-3.5 text-gallery-muted" />
          </a>

          {tender.applicationPortalUrl && (
            <a
              href={tender.applicationPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gallery-surface hover:bg-gallery-surfaceMuted text-gallery-muted hover:text-gallery-charcoal border border-gallery-border rounded transition-colors"
            >
              <span>Buyer Procurement Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-gallery-faint" />
            </a>
          )}
        </div>
      </header>

      {/* Key Metric Snapshot Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-1">
          <div className="text-[11px] font-mono text-gallery-muted flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-tender-primary" />
            <span>ESTIMATED VALUE</span>
          </div>
          <div className="text-base font-extrabold text-gallery-charcoal">
            {tender.valueDescription || `£${tender.valueAmount?.toLocaleString()}`}
          </div>
          <div className="text-[10px] text-gallery-muted">{tender.valueCurrency} (ex VAT)</div>
        </div>

        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-1">
          <div className="text-[11px] font-mono text-gallery-muted flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>SUBMISSION DEADLINE</span>
          </div>
          <div className="text-base font-extrabold text-gallery-charcoal">
            {new Date(tender.submissionDeadline).toLocaleDateString()}
          </div>
          <div className="text-[10px] font-mono text-amber-700 font-semibold">
            {tender.daysRemaining} days remaining
          </div>
        </div>

        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-1">
          <div className="text-[11px] font-mono text-gallery-muted flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>CLARIFICATION END</span>
          </div>
          <div className="text-base font-extrabold text-gallery-charcoal">
            {tender.clarificationDeadline
              ? new Date(tender.clarificationDeadline).toLocaleDateString()
              : 'TBC'}
          </div>
          <div className="text-[10px] text-gallery-muted">Questions cutoff</div>
        </div>

        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-1">
          <div className="text-[11px] font-mono text-gallery-muted flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-gallery-faint" />
            <span>BUYER SECTOR</span>
          </div>
          <div className="text-base font-extrabold text-gallery-charcoal">{tender.buyerType}</div>
          <div className="text-[10px] text-gallery-muted">UK Public Authority</div>
        </div>
      </section>

      {/* Decision Gate */}
      <BidDecision
        currentDecision={tender.bidDecisionState}
        isReviewMode={isReviewMode}
      />

      {/* Tender Specification & Detailed Overview */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
          Scope & Specification
        </h2>
        <p className="text-xs text-gallery-charcoal leading-relaxed whitespace-pre-line">
          {tender.description}
        </p>

        {tender.evaluationCriteria && tender.evaluationCriteria.length > 0 && (
          <div className="pt-4 border-t border-gallery-border space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
              Award Evaluation Weightings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tender.evaluationCriteria.map((crit) => (
                <div
                  key={crit.criterion}
                  className="p-3 bg-gallery-canvas border border-gallery-border rounded flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-gallery-charcoal">{crit.criterion}</span>
                  <span className="text-xs font-mono font-extrabold text-tender-primary">
                    {crit.weightingPercentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Compliance & Qualification Requirements Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
            Eligibility & Mandatory Criteria ({tender.requirements?.length || 0})
          </h2>
          <span className="text-[11px] font-mono text-gallery-muted">
            Evaluated against Knowledge Base
          </span>
        </div>
        <RequirementsTable requirements={tender.requirements || []} />
      </section>

      {/* Tender Documents */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
            Procurement Documents ({tender.documents?.length || 0})
          </h2>
          <span className="text-[11px] font-mono text-gallery-muted">
            Sha256 hash verified
          </span>
        </div>
        <DocumentList documents={tender.documents || []} />
      </section>
    </div>
  );
}
