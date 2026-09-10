// src/app/tenders/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TenderDetailView } from '@/modules/public-tenders/components/TenderDetailView';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function TenderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [tender, setTender] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTender() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tenders/${encodeURIComponent(id)}`);
        if (res.status === 404) {
          setTender(null);
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setTender(data.tender || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadTender();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center max-w-xl mx-auto space-y-3">
        <div className="text-sm font-semibold text-gallery-charcoal">Loading opportunity details...</div>
        <p className="text-xs text-gallery-muted">Fetching verified procurement notice from database.</p>
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div className="py-20 max-w-xl mx-auto text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gallery-charcoal tracking-tight">Tender Opportunity Not Found</h1>
        <p className="text-sm text-gallery-muted leading-relaxed">
          No live record matching reference <code className="px-1.5 py-0.5 bg-gallery-border rounded text-xs font-mono">{id}</code> exists in the production database.
        </p>
        <div className="pt-2">
          <Link
            href="/tenders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gallery-surface border border-gallery-border text-xs font-semibold text-gallery-charcoal hover:bg-gallery-border transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to All Tenders</span>
          </Link>
        </div>
      </div>
    );
  }

  return <TenderDetailView tender={tender} basePath="" isReviewMode={false} />;
}
