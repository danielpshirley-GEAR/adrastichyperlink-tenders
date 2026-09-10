// src/modules/public-tenders/components/KnowledgeView.tsx
'use client';

import React, { useState } from 'react';
import { BookOpen, AlertTriangle, CheckCircle2, ShieldAlert, FileQuestion } from 'lucide-react';

const TABS = [
  'COMPANY',
  'CREDENTIALS',
  'EXPERIENCE',
  'CASE STUDIES',
  'POLICIES',
  'REFERENCES',
  'APPROVED ANSWERS',
  'MISSING INFORMATION',
] as const;

interface KnowledgeViewProps {
  basePath?: string;
  isReviewMode?: boolean;
}

export function KnowledgeView({ basePath = '', isReviewMode = false }: KnowledgeViewProps) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('COMPANY');

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <header className="border-b border-gallery-border pb-6 space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-widest text-gallery-muted font-semibold flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-tender-primary" />
          <span>APPROVED BID EVIDENCE & FACT REPOSITORY</span>
          {isReviewMode && (
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
              REVIEW DATA
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gallery-charcoal tracking-tight">
          Knowledge Base
        </h1>
        <p className="text-xs sm:text-sm text-gallery-muted">
          Verified company facts, insurance levels, policies, and explicitly classified client case studies.
        </p>
      </header>

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

      {/* Compliance Gate Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Tender-Readiness Compliance Gate (Section 31 & 32)</div>
          <p className="leading-relaxed">
            All bid responses written by Gemini are strictly grounded in verified facts from this Knowledge Base.
            Concept or speculative demo work (TeleMaya, Amanda, MonX, Rainee) is explicitly labelled and never presented as commissioned public-sector contracts.
          </p>
          {isReviewMode ? (
            <p className="text-[11px] font-mono text-amber-800 font-semibold pt-1">
              [REVIEW MODE: Using safe, sanitized review data — no confidential client references or internal accounts exposed]
            </p>
          ) : (
            <p className="text-[11px] font-mono text-amber-800 font-semibold pt-1">
              [PRODUCTION: Truthful initial state — unconfirmed facts remain marked MISSING INFORMATION until explicitly verified]
            </p>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'COMPANY' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <article className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-gallery-muted">Company Legal Entity</span>
              {isReviewMode ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                  REVIEW DATA
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                  MISSING INFORMATION
                </span>
              )}
            </div>
            {isReviewMode ? (
              <>
                <h3 className="text-sm font-bold text-gallery-charcoal">Adrastichyperlink Limited</h3>
                <p className="text-xs text-gallery-muted">
                  Specialist creative studio & motion direction partner. Registration details pending formal confirmation.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-gallery-charcoal text-amber-900">Entity Unconfirmed</h3>
                <p className="text-xs text-gallery-muted">
                  Company registration number, registered trading address, and VAT registration are not yet entered. Awaiting Daniel's input before applying to corporate tenders.
                </p>
              </>
            )}
          </article>

          <article className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-gallery-muted">Founder & Key Personnel</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                VERIFIED
              </span>
            </div>
            <h3 className="text-sm font-bold text-gallery-charcoal">Daniel Shirley</h3>
            <p className="text-xs text-gallery-muted">
              Senior motion designer & creative director. Direct creative leadership on all contract deliverables.
            </p>
          </article>
        </div>
      )}

      {activeTab === 'CREDENTIALS' && (
        <div className="space-y-3">
          {isReviewMode ? (
            <>
              <article className="p-4 bg-gallery-surface border border-gallery-border rounded-lg flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gallery-charcoal">Professional Indemnity Insurance</div>
                  <div className="text-[11px] text-gallery-muted">Policy documentation pending upload</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  REVIEW FIXTURE
                </span>
              </article>

              <article className="p-4 bg-gallery-surface border border-gallery-border rounded-lg flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gallery-charcoal">Public Liability Insurance</div>
                  <div className="text-[11px] text-gallery-muted">Policy documentation pending upload</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  REVIEW FIXTURE
                </span>
              </article>

              <article className="p-4 bg-gallery-surface border border-gallery-border rounded-lg flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gallery-charcoal">Cyber Essentials Certification</div>
                  <div className="text-[11px] text-gallery-muted">Self-assessment complete; verified audit scheduled for central government bids</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                  Action Required
                </span>
              </article>
            </>
          ) : (
            <>
              <article className="p-4 bg-gallery-surface border border-amber-200 rounded-lg flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gallery-charcoal flex items-center gap-2">
                    <FileQuestion className="w-4 h-4 text-amber-600" />
                    <span>Professional Indemnity Insurance</span>
                  </div>
                  <div className="text-[11px] text-gallery-muted">Policy provider, coverage limit, and certificate document are unconfirmed.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  MISSING INFORMATION
                </span>
              </article>

              <article className="p-4 bg-gallery-surface border border-amber-200 rounded-lg flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gallery-charcoal flex items-center gap-2">
                    <FileQuestion className="w-4 h-4 text-amber-600" />
                    <span>Public Liability Insurance</span>
                  </div>
                  <div className="text-[11px] text-gallery-muted">Coverage amount and active insurance schedule not yet uploaded.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  MISSING INFORMATION
                </span>
              </article>

              <article className="p-4 bg-gallery-surface border border-amber-200 rounded-lg flex items-center justify-between shadow-2xs">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gallery-charcoal flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Cyber Essentials Certification</span>
                  </div>
                  <div className="text-[11px] text-gallery-muted">No active IASME or Cyber Essentials certificate reference on file.</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                  MISSING INFORMATION
                </span>
              </article>
            </>
          )}
        </div>
      )}

      {activeTab === 'CASE STUDIES' && (
        <div className="space-y-4">
          <article className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gallery-charcoal">Ministry of Defence (MoD)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-bold border border-sky-200">
                PERSONAL PROFESSIONAL EXPERIENCE
              </span>
            </div>
            <p className="text-xs text-gallery-muted leading-relaxed">
              Daniel Shirley's genuine Ministry of Defence project experience supporting high-level claims on public-sector working, complex information design, and visual communication. Confidential operational details strictly protected.
            </p>
          </article>

          <article className="p-4 bg-gallery-surface border border-gallery-border rounded-lg space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gallery-charcoal">Concept Demonstrators (TeleMaya, Amanda, MonX, Rainee)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-muted font-bold border border-gallery-border">
                CONCEPT WORK ONLY
              </span>
            </div>
            <p className="text-xs text-gallery-muted leading-relaxed">
              Studio creative capability demonstrators. Explicitly prohibited from being cited as commissioned commercial contracts or public-sector references.
            </p>
          </article>
        </div>
      )}

      {activeTab !== 'COMPANY' && activeTab !== 'CREDENTIALS' && activeTab !== 'CASE STUDIES' && (
        <div className="py-12 text-center bg-gallery-surface border border-gallery-border rounded-lg space-y-2 shadow-2xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
          <div className="text-xs font-bold text-gallery-charcoal">{activeTab} Repository</div>
          <p className="text-xs text-gallery-muted">
            Verified corporate evidence items and approved answers will populate here as Daniel enters them.
          </p>
        </div>
      )}
    </div>
  );
}
