// src/modules/public-tenders/components/TenderDetailView.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  RefreshCw,
  Target,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  MapPin,
  Users,
  FileText,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface TenderDetailViewProps {
  tender: any;
  basePath?: string;
  isReviewMode?: boolean;
}

export function TenderDetailView({
  tender: initialTender,
  basePath = '',
  isReviewMode = false,
}: TenderDetailViewProps) {
  const [tender, setTender] = useState<any>(initialTender);
  const [currentDecision, setCurrentDecision] = useState<any>(initialTender?.bidDecisionState || 'UNDECIDED');
  const [appId, setAppId] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const enrichment = tender?.enrichment;
  const scopeAndSpec = enrichment?.scopeAndSpec;
  const submissionDetails = enrichment?.submissionDetails;
  const fitAndRisks = enrichment?.fitAndRisks;
  const sourceEvidence = enrichment?.sourceEvidence || [];
  const procurementStage = tender?.procurementStage || enrichment?.procurementStage || 'OPEN TENDER';

  const isMarketEngagement =
    procurementStage === 'PRELIMINARY MARKET ENGAGEMENT' ||
    procurementStage === 'PLANNED PROCUREMENT' ||
    procurementStage === 'PIPELINE';

  const handleDecisionChange = async (newDecision: 'BID' | 'PASS' | 'WATCH') => {
    setCurrentDecision(newDecision);
    if (isReviewMode) return;

    try {
      const res = await fetch(`/api/tenders/${tender.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: newDecision }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.application?.id) {
          setAppId(data.application.id);
        }
      }
    } catch (err) {
      console.error('Failed to save bid decision:', err);
    }
  };

  const handleTriggerAnalyse = async () => {
    if (isReviewMode) return;
    setIsEnriching(true);
    setEnrichError(null);

    try {
      const res = await fetch(`/api/tenders/${tender.id}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Analysis request failed (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (data.tender) {
        setTender(data.tender);
      }
    } catch (err: any) {
      console.error('Failed to trigger analysis:', err);
      setEnrichError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsEnriching(false);
    }
  };

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

      {/* 1. Header & Stage Banner */}
      <header className="space-y-4 border-b border-gallery-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-gallery-muted font-bold">
            {tender.canonicalReference}
          </span>
          <span className="text-xs text-gallery-faint">•</span>
          <span className="text-xs font-semibold text-gallery-charcoal">{tender.buyerName}</span>
          <span className="text-xs text-gallery-faint">•</span>

          {/* Stage Badge */}
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              isMarketEngagement
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {procurementStage}
          </span>

          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verification Grade {tender.verificationGrade || 'A'} (Official Source Confirmed)
          </span>

          {tender.qualification && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                tender.qualification === 'STRONG'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {tender.qualification} FIT
            </span>
          )}

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
          {tender.plainEnglishSummary || scopeAndSpec?.whatBuyerWants || tender.description}
        </p>

        {/* Market Engagement Banner */}
        {isMarketEngagement && (
          <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-lg flex items-start gap-3 text-xs text-sky-950">
            <Clock className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold">Preliminary Market Engagement Notice (Not a Call for Competition)</div>
              <p className="leading-relaxed text-sky-900/90 text-[11px]">
                This opportunity is in the forward planning / preliminary engagement phase. The buyer has published this Prior Information Notice to inform procurement planning and assess supplier market capacity. Formal bidding is not open yet.
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
          <a
            href={tender.officialNoticeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gallery-surfaceMuted hover:bg-gallery-border text-gallery-charcoal border border-gallery-border rounded transition-colors"
          >
            <span>Open Official Notice ({tender.sourceId || 'FTS'})</span>
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

          {!isReviewMode && (
            <button
              onClick={handleTriggerAnalyse}
              disabled={isEnriching}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded transition-colors font-bold ${
                isEnriching
                  ? 'bg-gallery-surfaceMuted text-gallery-muted cursor-not-allowed border border-gallery-border'
                  : 'bg-zinc-900 hover:bg-black text-white shadow-2xs'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin text-gallery-muted' : 'text-zinc-300'}`} />
              <span>{isEnriching ? 'Synthesizing Procurement Facts...' : enrichment ? 'RE-ANALYSE TENDER' : 'ANALYSE TENDER'}</span>
            </button>
          )}
        </div>

        {enrichError && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-medium">
            {enrichError}
          </div>
        )}

        {tender.identityConflict && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900 font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold font-mono">IDENTITY_CONFLICT FLAGGED</div>
              <div>{tender.identityConflictDetails || 'Conflicting procurement release records detected. Canonical identity preserved for audit investigation.'}</div>
            </div>
          </div>
        )}
      </header>

      {/* 2. Overview & Key Metric Snapshot Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-1">
          <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-tender-primary" />
            <span>CONTRACT VALUE</span>
          </div>
          <div className="text-base font-extrabold text-gallery-charcoal">
            {tender.valueDescription || (tender.valueAmount ? `£${tender.valueAmount.toLocaleString()}` : 'Value not specified')}
          </div>
          <div className="text-[10px] text-gallery-muted">
            {tender.valueCurrency || 'GBP'} (Official Notice release)
          </div>
        </div>

        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-1">
          <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-tender-primary" />
            <span>PROCUREMENT STAGE</span>
          </div>
          <div className="text-sm font-extrabold text-gallery-charcoal uppercase truncate">
            {procurementStage}
          </div>
          <div className="text-[10px] text-gallery-muted font-mono">
            {isMarketEngagement ? 'Competition not yet open' : 'Active procurement'}
          </div>
        </div>

        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-1">
          <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-tender-primary" />
            <span>CRITICAL DATES</span>
          </div>
          <div className="text-base font-extrabold text-gallery-charcoal">
            {tender.submissionDeadline
              ? new Date(tender.submissionDeadline).toLocaleDateString()
              : scopeAndSpec?.importantDates?.[1]?.date || (tender.publishedAt ? new Date(tender.publishedAt).toLocaleDateString() : 'Pending notice')}
          </div>
          <div className="text-[10px] text-gallery-muted font-mono">
            {tender.submissionDeadline ? (
              tender.daysRemaining !== null && tender.daysRemaining !== undefined ? (
                tender.daysRemaining === 0 ? (
                  <span className="text-red-700 font-bold">Deadline passed (EXPIRED)</span>
                ) : (
                  `${tender.daysRemaining} days remaining`
                )
              ) : (
                'Deadline specified'
              )
            ) : isMarketEngagement ? (
              'Future notice date indicative'
            ) : (
              'Deadline not published'
            )}
          </div>
        </div>

        <div className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-1">
          <div className="text-xs font-mono text-gallery-muted flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-tender-primary" />
            <span>BUYER & LOCATION</span>
          </div>
          <div className="text-sm font-extrabold text-gallery-charcoal truncate">
            {tender.buyerName || 'Public Body'}
          </div>
          <div className="text-[10px] text-gallery-muted truncate">
            {scopeAndSpec?.locations?.[0] || 'United Kingdom'}
          </div>
        </div>
      </section>

      {/* 3. Stage-Driven Contextual Action Gate */}
      <div className="space-y-3">
        <BidDecision
          currentDecision={currentDecision}
          procurementStage={procurementStage}
          officialNoticeUrl={tender.officialNoticeUrl}
          applicationPortalUrl={tender.applicationPortalUrl}
          isReviewMode={isReviewMode}
          onDecisionChange={handleDecisionChange}
        />
        {appId && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center justify-between">
            <span className="font-semibold">Application project initiated. Ready for questions & drafting.</span>
            <Link
              href={`${basePath}/applications/${appId}`}
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold transition-colors"
            >
              Open Application Workspace &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* 4. Scope & Specification (Rich Structured Presentation) */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gallery-border pb-3">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal flex items-center gap-2">
            <Target className="w-4 h-4 text-tender-primary" />
            <span>Scope & Specification</span>
          </h2>
          <span className="text-[10px] font-mono text-gallery-muted">
            {scopeAndSpec?.isDetailedScopePublished ? 'Verified Procurement Scope' : 'Notice Summary'}
          </span>
        </div>

        {scopeAndSpec ? (
          <div className="space-y-6 text-xs text-gallery-charcoal">
            {/* A. BUYER FACTS: What the Buyer Wants */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
                  What the Buyer Wants
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  EXPLICIT BUYER FACT
                </span>
              </div>
              <p className="leading-relaxed bg-gallery-canvas p-3.5 rounded border border-gallery-border font-medium">
                {scopeAndSpec.whatBuyerWants || tender.description}
              </p>
            </div>

            {/* A. BUYER FACTS: Business Objective */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
                  Business & Economic Objective
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  EXPLICIT BUYER FACT
                </span>
              </div>
              <p className="leading-relaxed bg-gallery-canvas p-3.5 rounded border border-gallery-border">
                {scopeAndSpec.businessObjective}
              </p>
            </div>

            {/* A. BUYER FACTS: Required Services & Deliverables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-3.5 bg-gallery-canvas rounded border border-gallery-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-tender-primary" />
                    <span>Published Required Services</span>
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    BUYER FACT
                  </span>
                </div>
                <ul className="space-y-1.5 pt-1">
                  {(scopeAndSpec.buyerRequiredServices || scopeAndSpec.requiredServices || []).map((svc: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px]">
                      <span className="text-tender-primary font-bold">•</span>
                      <span>{svc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 p-3.5 bg-gallery-canvas rounded border border-gallery-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Buyer-Specified Deliverables</span>
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gallery-surface text-gallery-muted font-bold border border-gallery-border">
                    NOTICE SCOPE
                  </span>
                </div>
                {scopeAndSpec.buyerKeyDeliverables && scopeAndSpec.buyerKeyDeliverables.length > 0 ? (
                  <ul className="space-y-1.5 pt-1">
                    {scopeAndSpec.buyerKeyDeliverables.map((del: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px]">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{del}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[11px] text-gallery-muted italic p-2.5 bg-white/70 rounded border border-gallery-border mt-1">
                    Specific contract deliverables have not yet been published in available preliminary notice material. Scheduled for release in formal Invitation to Tender (ITT).
                  </div>
                )}
              </div>
            </div>

            {/* Target Audience & Delivery Locations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-gallery-canvas rounded border border-gallery-border space-y-1">
                <span className="text-[10px] font-mono uppercase text-gallery-muted font-bold flex items-center gap-1">
                  <Users className="w-3 h-3 text-tender-primary" />
                  Target Audience
                </span>
                <p className="text-[11px] leading-relaxed">{scopeAndSpec.targetAudience}</p>
              </div>

              <div className="p-3 bg-gallery-canvas rounded border border-gallery-border space-y-1">
                <span className="text-[10px] font-mono uppercase text-gallery-muted font-bold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-tender-primary" />
                  Delivery Locations
                </span>
                <p className="text-[11px] leading-relaxed">{scopeAndSpec.locations?.join(', ') || 'United Kingdom'}</p>
              </div>
            </div>

            {/* B. AI OPPORTUNITY INTERPRETATION: Distinct, unambiguously labeled block */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-mono font-bold uppercase text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Potential Creative Opportunities</span>
                </h4>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-mono text-[9px] font-extrabold border border-indigo-300">
                  AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT
                </span>
              </div>
              <p className="text-[11px] text-indigo-900/80 leading-relaxed">
                The following opportunities represent creative analysis of potential motion design, branding, and digital campaign work Adrastichyperlink could propose. These are analytical interpretations and are NOT formal buyer-mandated deliverables.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {(scopeAndSpec.creativeOpportunities && scopeAndSpec.creativeOpportunities.length > 0
                  ? scopeAndSpec.creativeOpportunities
                  : (scopeAndSpec.creativeMarketingDigitalOverlap || []).map((o: string) => ({
                      opportunity: o,
                      rationale: 'Alignment with Adrastichyperlink creative capabilities',
                      label: 'AI OPPORTUNITY INTERPRETATION — NOT YET A PUBLISHED REQUIREMENT' as const,
                    }))
                ).map((opp: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white/90 border border-indigo-200/80 rounded space-y-1.5 shadow-2xs">
                    <div className="font-bold text-gallery-charcoal text-xs">{opp.opportunity}</div>
                    <div className="text-[10px] text-gallery-muted leading-relaxed">{opp.rationale}</div>
                    {opp.relevantCoreScope && (
                      <div className="text-[9px] font-mono text-indigo-700">Relevant Scope: {opp.relevantCoreScope}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Services Outside Core Capability */}
            {scopeAndSpec.servicesOutsideCoreCapability && scopeAndSpec.servicesOutsideCoreCapability.length > 0 && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded space-y-2">
                <h4 className="text-[11px] font-mono font-bold uppercase text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Services Outside Core Studio Capability</span>
                </h4>
                <ul className="space-y-1">
                  {scopeAndSpec.servicesOutsideCoreCapability.map((so: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-950">
                      <span className="text-amber-600 font-bold">!</span>
                      <span>{so}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Important Dates */}
            {scopeAndSpec.importantDates && scopeAndSpec.importantDates.length > 0 && (
              <div className="pt-3 border-t border-gallery-border space-y-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
                  Important Timeline Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {scopeAndSpec.importantDates.map((d: any, idx: number) => (
                    <div key={idx} className="p-2.5 bg-gallery-canvas border border-gallery-border rounded">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gallery-muted">
                        <span>{d.label}</span>
                        {d.factType && (
                          <span className="text-[8px] px-1 rounded bg-emerald-50 text-emerald-800 font-bold">
                            VERIFIED
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-gallery-charcoal mt-0.5">{d.date}</div>
                      {d.description && (
                        <div className="text-[10px] text-gallery-faint mt-0.5 leading-snug">{d.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gallery-charcoal leading-relaxed whitespace-pre-line">
              {tender.description || 'Detailed scope has not yet been published in the currently available procurement material.'}
            </p>
          </div>
        )}
      </section>

      {/* 5. Eligibility & Mandatory Criteria */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
            Eligibility & Mandatory Criteria ({tender.requirements?.length || 0})
          </h2>
          <span className="text-[11px] font-mono text-gallery-muted">
            Evaluated against approved Knowledge Base
          </span>
        </div>
        <RequirementsTable
          requirements={tender.requirements || []}
          isEligibilityPublished={tender.isEligibilityPublished ?? (tender.requirements && tender.requirements.length > 0)}
          eligibilityNoticeText={tender.eligibilityNoticeText}
        />
      </section>

      {/* 6. Award Evaluation Criteria */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
          Award Evaluation Criteria
        </h2>

        {tender.evaluationCriteria &&
        tender.evaluationCriteria.length > 0 &&
        tender.evaluationCriteria.some((c: any) => c.isPublished !== false && c.weightingPercentage !== null) ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tender.evaluationCriteria.map((crit: any) => (
              <div
                key={crit.id || crit.criterion}
                className="p-3.5 bg-gallery-canvas border border-gallery-border rounded flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-gallery-charcoal">{crit.criterion}</div>
                  {crit.description && (
                    <div className="text-[10px] text-gallery-muted mt-0.5">{crit.description}</div>
                  )}
                </div>
                {crit.weightingPercentage !== null && crit.weightingPercentage !== undefined && (
                  <span className="text-xs font-mono font-extrabold text-tender-primary shrink-0 ml-2">
                    {crit.weightingPercentage}%
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-gallery-canvas border border-gallery-border rounded-lg flex items-start gap-3 text-xs text-gallery-muted">
            <Clock className="w-4 h-4 text-gallery-faint shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-gallery-charcoal">Evaluation Criteria Have Not Yet Been Published</div>
              <p className="mt-0.5 leading-relaxed text-[11px]">
                Detailed evaluation weightings (Quality / Price / Social Value) have not yet been released in current procurement documents. Criteria will be published when the formal call for competition is issued.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 7. Procurement Documents */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
            Procurement Documents ({tender.documents?.length || 0})
          </h2>
          <span className="text-[11px] font-mono text-gallery-muted">
            Verified Source Material & Document Links
          </span>
        </div>
        <DocumentList documents={tender.documents || []} />
      </section>

      {/* 8. Submission / Market Engagement Information */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gallery-border pb-3">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
            Submission & Market Engagement Guidance
          </h2>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              isMarketEngagement
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isMarketEngagement ? 'MARKET ENGAGEMENT / FUTURE PROCUREMENT' : 'OPEN FOR BID'}
          </span>
        </div>

        {/* Market Engagement Submission Form Alert if referenced */}
        {submissionDetails?.marketEngagementForm && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3 text-xs text-amber-950">
            <div className="flex items-center justify-between">
              <div className="font-bold font-mono text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>{submissionDetails.marketEngagementForm.formTitle || 'Market Engagement Submission Form'}</span>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                submissionDetails.marketEngagementForm.accessState === 'PUBLIC'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {submissionDetails.marketEngagementForm.statusText}
              </span>
            </div>

            {submissionDetails.marketEngagementForm.formType && (
              <div className="text-[11px] font-mono text-amber-800">
                <span className="font-bold">Form Type: </span>{submissionDetails.marketEngagementForm.formType}
              </div>
            )}

            {submissionDetails.marketEngagementForm.sourceEvidenceText && (
              <div className="bg-amber-100/60 p-2.5 rounded border border-amber-200/80 text-[11px] leading-relaxed text-amber-900 italic">
                <span className="font-bold not-italic font-mono text-[10px] block text-amber-800 uppercase mb-0.5">Source Evidence:</span>
                &ldquo;{submissionDetails.marketEngagementForm.sourceEvidenceText}&rdquo;
              </div>
            )}

            <p className="text-[11px] leading-relaxed text-amber-900">
              {submissionDetails.marketEngagementForm.instructions}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200 text-[10px] font-mono">
              <span className="text-amber-800">
                Deadline: {submissionDetails.marketEngagementForm.deadlineText || submissionDetails.marketEngagementForm.deadlineSource || 'Not published in initial notice (Do not assume deadline)'}
              </span>
              <div className="flex items-center gap-3">
                {submissionDetails.marketEngagementForm.sourceUrl && (
                  <a
                    href={submissionDetails.marketEngagementForm.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-tender-primary hover:underline font-bold"
                  >
                    <span>Open Form Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {submissionDetails.marketEngagementForm.portalUrl && submissionDetails.marketEngagementForm.portalUrl !== submissionDetails.marketEngagementForm.sourceUrl && (
                  <a
                    href={submissionDetails.marketEngagementForm.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gallery-muted hover:underline"
                  >
                    <span>Authority Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-gallery-canvas rounded border border-gallery-border space-y-2">
            <div className="text-[10px] font-mono uppercase text-gallery-muted font-bold">Route & Portal</div>
            <div className="font-bold text-gallery-charcoal">
              {submissionDetails?.submissionRoute || (isMarketEngagement ? 'Public Contracts Scotland / Market Engagement' : 'Official Electronic Portal')}
            </div>
            {submissionDetails?.submissionPortalUrl && (
              <a
                href={submissionDetails.submissionPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-tender-primary hover:underline inline-flex items-center gap-1 font-mono break-all"
              >
                <span>{submissionDetails.submissionPortalUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>

          <div className="p-3.5 bg-gallery-canvas rounded border border-gallery-border space-y-2">
            <div className="text-[10px] font-mono uppercase text-gallery-muted font-bold">Buyer Contact Point</div>
            <div className="font-bold text-gallery-charcoal">
              {submissionDetails?.buyerContact?.name || tender.buyerName || 'Procurement Authority'}
            </div>
            {submissionDetails?.buyerContact?.email && (
              <div className="text-[11px] font-mono text-gallery-muted">
                Email:{' '}
                <a href={`mailto:${submissionDetails.buyerContact.email}`} className="text-tender-primary hover:underline">
                  {submissionDetails.buyerContact.email}
                </a>
              </div>
            )}
            {submissionDetails?.buyerContact?.telephone && (
              <div className="text-[11px] font-mono text-gallery-muted">
                Tel: {submissionDetails.buyerContact.telephone}
              </div>
            )}
            {submissionDetails?.buyerContact?.address && (
              <div className="text-[10px] text-gallery-faint">{submissionDetails.buyerContact.address}</div>
            )}
          </div>
        </div>

        {submissionDetails?.participationInstructions && (
          <div className="p-3.5 bg-gallery-canvas rounded border border-gallery-border space-y-1 text-xs">
            <div className="text-[10px] font-mono uppercase text-gallery-muted font-bold">Participation Instructions</div>
            <p className="text-gallery-charcoal leading-relaxed">{submissionDetails.participationInstructions}</p>
          </div>
        )}
      </section>

      {/* 9. Strategic Fit & Risk Assessment */}
      {fitAndRisks && (
        <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
            Strategic Fit & Risk Assessment
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
              <h3 className="font-mono font-bold text-[11px] uppercase text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Why Adrastichyperlink Fits</span>
              </h3>
              <p className="text-emerald-950 leading-relaxed text-[11px]">
                {fitAndRisks.whyAdrastichyperlinkFits}
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2">
              <h3 className="font-mono font-bold text-[11px] uppercase text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Why It May Not Fit / Constraints</span>
              </h3>
              <p className="text-amber-950 leading-relaxed text-[11px]">
                {fitAndRisks.whyItMayNotFit}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gallery-canvas border border-gallery-border rounded-lg space-y-2 text-xs">
            <div className="text-[10px] font-mono uppercase text-gallery-muted font-bold">
              Strategic Partnering Recommendation
            </div>
            <p className="text-gallery-charcoal font-semibold leading-relaxed">
              {fitAndRisks.partneringRecommendation}
            </p>
            {fitAndRisks.riskFactors && fitAndRisks.riskFactors.length > 0 && (
              <ul className="pt-2 border-t border-gallery-border space-y-1 text-[11px] text-gallery-muted">
                {fitAndRisks.riskFactors.map((rf: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{rf}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* 10. Visible Source Evidence Area */}
      <section className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gallery-border pb-3">
          <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-gallery-charcoal">
            Source Evidence & Procurement Attribution
          </h2>
          <span className="text-[10px] font-mono text-gallery-muted">
            All facts cited from verified official releases
          </span>
        </div>

        {sourceEvidence && sourceEvidence.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gallery-border bg-gallery-canvas text-gallery-muted font-mono text-[10px] uppercase">
                  <th className="py-2.5 px-3 font-semibold">Topic</th>
                  <th className="py-2.5 px-3 font-semibold">Fact Type</th>
                  <th className="py-2.5 px-3 font-semibold">Verified Fact</th>
                  <th className="py-2.5 px-3 font-semibold">Source Reference</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gallery-border">
                {sourceEvidence.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-gallery-canvas/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[10px] uppercase text-gallery-muted font-semibold">
                      {ev.topic}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-gallery-muted">
                      {ev.factType ? ev.factType.replace(/_/g, ' ') : 'BUYER FACT'}
                    </td>
                    <td className="py-2.5 px-3 text-gallery-charcoal text-[11px] font-medium">
                      {ev.fact}
                    </td>
                    <td className="py-2.5 px-3 text-gallery-muted font-mono text-[10px]">
                      {ev.source}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {ev.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-mono font-bold border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[9px] font-mono font-bold border border-amber-200">
                          AI INTERPRETATION
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 bg-gallery-canvas border border-gallery-border rounded text-xs text-gallery-muted font-mono">
            Source notice: {tender.officialNoticeUrl} (Find a Tender OCDS release).
          </div>
        )}
      </section>
    </div>
  );
}
