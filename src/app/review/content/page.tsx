// src/app/review/content/page.tsx
import React from 'react';
import Link from 'next/link';
import {
  reviewBuildMeta,
  reviewTodayData,
  reviewTenders,
  reviewApplications,
  reviewSources,
} from '@/modules/public-tenders/review/data';

export const metadata = {
  title: 'Adrastichyperlink Public Tender Engine — Text Review Overview',
  description: 'Server-rendered semantic text audit overview for ChatGPT and automated inspection.',
};

export default function ReviewContentPage() {
  return (
    <article className="space-y-12 max-w-4xl mx-auto py-6 font-sans text-gallery-charcoal">
      {/* Header & Meta */}
      <header className="border-b border-gallery-border pb-6 space-y-3">
        <div className="inline-block px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono text-xs font-bold">
          PARALLEL TEXT REVIEW SPECIFICATION (CHATGPT AUDIT ENDPOINT)
        </div>
        <h1 className="text-3xl font-extrabold text-gallery-charcoal tracking-tight">
          Adrastichyperlink Public Tender Engine — Review Content Overview
        </h1>
        <p className="text-sm text-gallery-muted leading-relaxed">
          This endpoint provides a fully server-rendered semantic representation of the current application state,
          shared component architecture, data contracts, and public review data for direct AI inspection.
        </p>
      </header>

      {/* Build Information */}
      <section className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-2">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
          1. BUILD VERSION & TECHNICAL METADATA
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-gallery-canvas rounded border border-gallery-border">
            <span className="text-gallery-muted block text-[10px]">ENVIRONMENT</span>
            <strong className="text-amber-800 uppercase">{reviewBuildMeta.environment}</strong>
          </div>
          <div className="p-3 bg-gallery-canvas rounded border border-gallery-border">
            <span className="text-gallery-muted block text-[10px]">BUILD ID</span>
            <strong>{reviewBuildMeta.buildId}</strong>
          </div>
          <div className="p-3 bg-gallery-canvas rounded border border-gallery-border">
            <span className="text-gallery-muted block text-[10px]">DEPLOYED AT</span>
            <strong>{reviewBuildMeta.deployedAt}</strong>
          </div>
        </div>
      </section>

      {/* Navigation Structure */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
          2. NAVIGATION & ROUTE REGISTRY
        </h2>
        <div className="overflow-x-auto bg-gallery-surface border border-gallery-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gallery-border bg-gallery-canvas text-gallery-muted font-mono text-[10px] uppercase">
                <th className="py-2.5 px-4">Navigation Item</th>
                <th className="py-2.5 px-4">Review Route</th>
                <th className="py-2.5 px-4">Production Route</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gallery-border font-mono text-[11px]">
              {reviewBuildMeta.routes.map((route) => (
                <tr key={route}>
                  <td className="py-2.5 px-4 font-bold text-gallery-charcoal">
                    {route.replace('/review/', '').toUpperCase() || 'ROOT'}
                  </td>
                  <td className="py-2.5 px-4 text-tender-primary">
                    <Link href={route} className="hover:underline">
                      {route}
                    </Link>
                  </td>
                  <td className="py-2.5 px-4 text-gallery-muted">
                    {route.replace('/review', '') || '/'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-emerald-700 font-bold">200 OK (Shared Component)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Today Screen Content */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
          3. TODAY SCREEN CONTENT (WHAT NEEDS ATTENTION TODAY)
        </h2>
        <div className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 text-xs">
          <div className="border-b border-gallery-border pb-3">
            <h3 className="text-sm font-bold text-gallery-charcoal">{reviewTodayData.greeting}</h3>
            <p className="text-gallery-muted">{reviewTodayData.summary}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 font-mono">
            <div className="p-3 bg-gallery-canvas rounded border border-gallery-border">
              <span className="text-gallery-muted block text-[10px]">QUALIFIED TENDERS</span>
              <strong className="text-base text-gallery-charcoal">{reviewTodayData.qualifiedTendersCount} Strong</strong>
            </div>
            <div className="p-3 bg-gallery-canvas rounded border border-gallery-border">
              <span className="text-gallery-muted block text-[10px]">ACTIVE APPLICATIONS</span>
              <strong className="text-base text-gallery-charcoal">{reviewTodayData.activeApplicationsCount} In Progress</strong>
            </div>
            <div className="p-3 bg-gallery-canvas rounded border border-gallery-border">
              <span className="text-gallery-muted block text-[10px]">MISSING INFORMATION</span>
              <strong className="text-base text-gallery-charcoal">{reviewTodayData.missingInformationCount} Fact Required</strong>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <span className="font-bold font-mono text-[11px] text-gallery-muted uppercase">Immediate Actions:</span>
            <ul className="space-y-2">
              {reviewTodayData.immediateActions.map((act) => (
                <li key={act.id} className="p-3 bg-gallery-canvas border border-gallery-border rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gallery-charcoal">{act.title}</span>
                    <p className="text-gallery-muted text-[11px]">{act.description}</p>
                  </div>
                  <span className="font-mono text-amber-800 text-[10px] font-bold">{act.badge}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Tender Inbox Structure */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
          4. TENDER INBOX STRUCTURE & QUALIFIED NOTICES ({reviewTenders.length})
        </h2>
        <div className="divide-y divide-gallery-border bg-gallery-surface border border-gallery-border rounded-lg overflow-hidden text-xs">
          {reviewTenders.map((tender) => (
            <div key={tender.id} className="p-5 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[10px] text-gallery-muted uppercase font-semibold">
                    {tender.canonicalReference} • {tender.buyerName} ({tender.buyerType})
                  </span>
                  <h3 className="text-sm font-bold text-gallery-charcoal">
                    <Link href={`/review/tenders/${tender.id}`} className="text-tender-primary hover:underline">
                      {tender.title}
                    </Link>
                  </h3>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-gallery-charcoal">{tender.valueDescription}</div>
                  <div className="text-[11px] text-amber-700">{tender.daysRemaining} days left</div>
                </div>
              </div>
              <p className="text-gallery-muted text-[11px] leading-relaxed">{tender.plainEnglishSummary}</p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono pt-1">
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  Grade {tender.verificationGrade}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  {tender.qualification}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-gallery-surfaceMuted text-gallery-muted border border-gallery-border">
                  Source: {tender.sourceId}
                </span>
                <a
                  href={tender.officialNoticeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-1.5 py-0.5 rounded bg-gallery-canvas text-tender-primary hover:underline border border-gallery-border"
                >
                  Official URL ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tender Detail & Verification Structure */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
          5. TENDER DETAIL STRUCTURE & COMPLIANCE EXTRACTION
        </h2>
        <div className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 text-xs">
          <div className="border-b border-gallery-border pb-3">
            <h3 className="font-bold text-sm text-gallery-charcoal">
              Example Detail Record: {reviewTenders[0].title}
            </h3>
            <p className="text-gallery-muted text-[11px] mt-1">{reviewTenders[0].description}</p>
          </div>
          <div className="space-y-2">
            <span className="font-bold font-mono text-[11px] text-gallery-muted uppercase">
              Mandatory Requirements Verified ({reviewTenders[0].requirements.length}):
            </span>
            <ul className="space-y-1 text-[11px]">
              {reviewTenders[0].requirements.map((req) => (
                <li key={req.id} className="p-2 bg-gallery-canvas border border-gallery-border rounded flex justify-between items-center">
                  <span>
                    <strong>{req.requirementName}:</strong> {req.buyerRequirementText} →{' '}
                    <em className="text-emerald-800 not-italic font-semibold">{req.adrasticCapabilityText}</em>
                  </span>
                  <span className="font-mono text-[10px] font-bold text-emerald-700">{req.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Application Structure */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
          6. APPLICATION BID DRAFTING & STRICT EVIDENCE CITATIONS
        </h2>
        <div className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 text-xs">
          <div className="border-b border-gallery-border pb-3 flex justify-between items-start">
            <div>
              <span className="font-mono text-[10px] text-gallery-muted">ACTIVE PROPOSAL: {reviewApplications[0].id}</span>
              <h3 className="font-bold text-sm text-gallery-charcoal">{reviewApplications[0].tenderTitle}</h3>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Suitability {reviewApplications[0].overallSuitabilityScore}%
            </span>
          </div>
          <div className="space-y-2">
            <span className="font-bold font-mono text-[11px] text-gallery-muted uppercase">Win Themes:</span>
            <ul className="list-disc list-inside space-y-1 text-gallery-muted text-[11px] pl-1">
              {reviewApplications[0].winThemes.map((theme, i) => (
                <li key={i}>{theme}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 pt-2">
            <span className="font-bold font-mono text-[11px] text-gallery-muted uppercase">
              Application Questions ({reviewApplications[0].questions.length}):
            </span>
            {reviewApplications[0].questions.map((q) => (
              <div key={q.id} className="p-3 bg-gallery-canvas border border-gallery-border rounded space-y-1">
                <div className="flex justify-between font-mono text-[10px]">
                  <strong>{q.questionNumber} — {q.sectionName}</strong>
                  <span className={q.status === 'READY' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {q.status} ({q.currentWordCount}/{q.maxWordCount} words)
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-gallery-charcoal">{q.questionText}</p>
                <div className="text-[10px] font-mono text-gallery-muted">
                  Citations: {q.groundedCitations.join(' • ')}
                </div>
                {q.factsRequired.length > 0 && (
                  <div className="text-[10px] font-mono text-amber-800 font-bold">
                    Missing Info: {q.factsRequired.join('; ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scan Status */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
          7. SCAN MANAGEMENT & CONNECTOR REGISTRY ({reviewSources.length})
        </h2>
        <div className="overflow-x-auto bg-gallery-surface border border-gallery-border rounded-lg">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gallery-border bg-gallery-canvas text-gallery-muted font-mono text-[10px] uppercase">
                <th className="py-2.5 px-4">Connector Source</th>
                <th className="py-2.5 px-4">Portal Scope</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Checked</th>
                <th className="py-2.5 px-4 text-right">Relevant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gallery-border text-[11px]">
              {reviewSources.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-4 font-bold text-gallery-charcoal">{s.name}</td>
                  <td className="py-2.5 px-4 text-gallery-muted">{s.portalType}</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-bold">Healthy (Active)</td>
                  <td className="py-2.5 px-4 text-right font-mono">{s.noticesChecked}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-gallery-charcoal">{s.relevantFound}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Knowledge Structure */}
      <section className="space-y-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted">
          8. KNOWLEDGE BASE & FACT GROUNDING GATE
        </h2>
        <div className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-3 text-xs leading-relaxed">
          <p>
            <strong>Core Rule:</strong> Zero hallucinated claims. All bid responses require verified citations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 bg-gallery-canvas border border-gallery-border rounded">
              <strong className="block text-gallery-charcoal">Verified Commercial Credentials</strong>
              <span>Professional Indemnity (Policy TBC) • Public Liability (Policy TBC)</span>
            </div>
            <div className="p-3 bg-gallery-canvas border border-gallery-border rounded">
              <strong className="block text-gallery-charcoal">Work Classification Boundaries</strong>
              <span>Ministry of Defence (Personal Experience) • Concept Demos strictly labelled</span>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
