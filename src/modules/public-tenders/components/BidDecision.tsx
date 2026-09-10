// src/modules/public-tenders/components/BidDecision.tsx
'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';

interface BidDecisionProps {
  currentDecision?: 'BID' | 'PASS' | 'WATCH' | 'UNDECIDED';
  isReviewMode?: boolean;
  onDecisionChange?: (decision: 'BID' | 'PASS' | 'WATCH') => void;
}

export function BidDecision({
  currentDecision = 'UNDECIDED',
  isReviewMode = false,
  onDecisionChange,
}: BidDecisionProps) {
  const [decision, setDecision] = useState(currentDecision);
  const [showReviewNotice, setShowReviewNotice] = useState(false);

  const handleAction = (newDecision: 'BID' | 'PASS' | 'WATCH') => {
    if (isReviewMode) {
      setShowReviewNotice(true);
      setTimeout(() => setShowReviewNotice(false), 3000);
      return;
    }
    setDecision(newDecision);
    if (onDecisionChange) onDecisionChange(newDecision);
  };

  return (
    <div className="p-6 bg-gallery-surface border border-gallery-border rounded-lg space-y-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gallery-border pb-3">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-gallery-charcoal">
            Bid Decision Gate
          </h3>
          <p className="text-xs text-gallery-muted">
            Marking BID creates an official submission project in Applications and unfreezes Gemini bid writing.
          </p>
        </div>
        <div className="text-xs font-mono">
          Status:{' '}
          <span
            className={`font-bold ${
              decision === 'BID'
                ? 'text-emerald-700'
                : decision === 'PASS'
                ? 'text-red-700'
                : 'text-gallery-muted'
            }`}
          >
            {decision}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleAction('BID')}
          className={`px-5 py-2 rounded text-xs font-bold transition-all inline-flex items-center gap-2 ${
            decision === 'BID'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>BID ON THIS OPPORTUNITY</span>
        </button>

        <button
          onClick={() => handleAction('PASS')}
          className={`px-4 py-2 rounded text-xs font-bold transition-all inline-flex items-center gap-2 ${
            decision === 'PASS'
              ? 'bg-red-700 text-white shadow-xs'
              : 'bg-red-50 text-red-800 border border-red-200 hover:bg-red-100'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>PASS</span>
        </button>

        <button
          onClick={() => handleAction('WATCH')}
          className={`px-4 py-2 rounded text-xs font-bold transition-all inline-flex items-center gap-2 ${
            decision === 'WATCH'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'bg-gallery-surfaceMuted text-gallery-charcoal border border-gallery-border hover:bg-gallery-canvas'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>WATCH / MONITOR</span>
        </button>
      </div>

      {showReviewNotice && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-medium flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Action disabled in Public Review Mode (Read-Only Mirror).</span>
        </div>
      )}
    </div>
  );
}
