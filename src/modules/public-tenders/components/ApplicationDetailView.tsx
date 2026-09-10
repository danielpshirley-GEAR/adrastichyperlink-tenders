// src/modules/public-tenders/components/ApplicationDetailView.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TenderApplication, ApplicationQuestion } from '../types/application';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Lock,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface ApplicationDetailViewProps {
  application: TenderApplication;
  basePath?: string;
  isReviewMode?: boolean;
}

export function ApplicationDetailView({
  application,
  basePath = '',
  isReviewMode = false,
}: ApplicationDetailViewProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    application.questions[0]?.id || ''
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedQuestion =
    application.questions.find((q) => q.id === selectedQuestionId) ||
    application.questions[0];

  const handleReviewAction = (actionName: string) => {
    if (isReviewMode) {
      setActionNotice(`Action "${actionName}" is disabled in Public Review Mode (Read-Only Mirror).`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Back Link */}
      <div>
        <Link
          href={`${basePath}/applications`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gallery-muted hover:text-gallery-charcoal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications</span>
        </Link>
      </div>

      {/* Header */}
      <header className="space-y-3 border-b border-gallery-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-gallery-muted font-bold">
            {application.canonicalReference}
          </span>
          <span className="text-xs text-gallery-faint">•</span>
          <span className="text-xs font-semibold text-gallery-charcoal">{application.buyerName}</span>
          <span className="text-xs text-gallery-faint">•</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-bold border border-sky-200">
            {application.status}
          </span>
          {isReviewMode && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-mono font-bold">
              REVIEW DATA
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gallery-charcoal tracking-tight">
          {application.tenderTitle}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-xs text-gallery-muted pt-1">
          <div className="flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {application.submissionDeadline ? (
              <>
                <span className="text-amber-800 font-semibold">
                  {application.daysRemaining !== null && application.daysRemaining !== undefined
                    ? `${application.daysRemaining} days until deadline`
                    : 'Active Deadline'}
                </span>
                <span>({new Date(application.submissionDeadline).toLocaleDateString()})</span>
              </>
            ) : (
              <span className="text-amber-800 font-semibold">Deadline not published</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-gallery-charcoal font-semibold">
              Suitability Match: {application.overallSuitabilityScore}%
            </span>
          </div>
        </div>
      </header>

      {/* Strategic Win Themes */}
      <section className="p-5 bg-gallery-surface border border-gallery-border rounded-lg space-y-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-tender-primary" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-charcoal">
            Agreed Bid Win Themes (Section 34)
          </h2>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gallery-charcoal">
          {application.winThemes.map((theme, i) => (
            <li key={i} className="flex items-start gap-2 p-2.5 bg-gallery-canvas rounded border border-gallery-border">
              <span className="w-1.5 h-1.5 rounded-full bg-tender-primary shrink-0 mt-1.5" />
              <span>{theme}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Interactive Question Workspace */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Questions List */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-muted px-1">
            Application Questions ({application.questions.length})
          </h3>

          <div className="space-y-2">
            {application.questions.map((q) => {
              const isSelected = q.id === selectedQuestion.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuestionId(q.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all block ${
                    isSelected
                      ? 'border-tender-primary bg-tender-primaryLight/30 shadow-2xs'
                      : 'border-gallery-border bg-gallery-surface hover:bg-gallery-canvas'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-gallery-charcoal">{q.questionNumber}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        q.status === 'READY'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {q.status === 'READY' ? 'READY' : 'FACTS REQUIRED'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gallery-charcoal line-clamp-1">
                    {q.sectionName}
                  </div>
                  <div className="text-[11px] text-gallery-muted font-mono mt-1">
                    {q.currentWordCount} / {q.maxWordCount} words
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Question & Drafted Response */}
        <div className="md:col-span-2 space-y-4">
          <article className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
            {/* Question Definition */}
            <div className="space-y-2 border-b border-gallery-border pb-4">
              <div className="flex items-center justify-between text-xs font-mono text-gallery-muted">
                <span>
                  {selectedQuestion.sectionName} • {selectedQuestion.questionNumber}
                </span>
                <span>Max: {selectedQuestion.maxWordCount} words</span>
              </div>
              <h3 className="text-sm font-bold text-gallery-charcoal leading-snug">
                {selectedQuestion.questionText}
              </h3>
            </div>

            {/* Facts Required Callout if any */}
            {selectedQuestion.factsRequired.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Information Required From Daniel Shirley:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  {selectedQuestion.factsRequired.map((f, i) => (
                    <li key={i} className="leading-relaxed">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Drafted Response */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gallery-charcoal">
                  Gemini Drafted Response (Strict Grounding Tier 4)
                </span>
                <span className="text-[11px] font-mono text-gallery-muted">
                  {selectedQuestion.currentWordCount} words
                </span>
              </div>

              <div className="p-4 bg-gallery-canvas border border-gallery-border rounded-lg text-xs text-gallery-charcoal leading-relaxed whitespace-pre-line font-sans">
                {selectedQuestion.draftedAnswer}
              </div>
            </div>

            {/* Citations / Grounded Facts Evidence */}
            <div className="pt-2 space-y-2 border-t border-gallery-border">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-gallery-muted flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-tender-primary" />
                <span>Verified Knowledge Base Citations</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedQuestion.groundedCitations.map((cite, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded bg-gallery-surfaceMuted border border-gallery-border text-[10px] font-mono text-gallery-charcoal"
                  >
                    {cite}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gallery-border">
              <button
                onClick={() => handleReviewAction('Save Answer')}
                className="px-4 py-2 bg-tender-primary hover:bg-tender-primaryHover text-white text-xs font-bold rounded transition-colors"
              >
                Save Answer Draft
              </button>

              <button
                onClick={() => handleReviewAction('Regenerate with Gemini')}
                className="px-4 py-2 bg-gallery-surface hover:bg-gallery-surfaceMuted text-gallery-charcoal border border-gallery-border text-xs font-semibold rounded transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-tender-primary" />
                <span>Regenerate (Tier 4)</span>
              </button>
            </div>

            {actionNotice && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-medium">
                {actionNotice}
              </div>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
