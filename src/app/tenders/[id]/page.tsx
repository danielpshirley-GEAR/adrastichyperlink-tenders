// src/app/tenders/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { TenderDetailView } from '@/modules/public-tenders/components/TenderDetailView';
import { ReviewTenderDetail, reviewTenders } from '@/modules/public-tenders/review/data';

export default function TenderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [tender, setTender] = useState<ReviewTenderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, will query /api/tenders/${id}; fall back gracefully to review fixture if not in DB yet
    const found = reviewTenders.find((t) => t.id === id);
    if (found) {
      setTender(found);
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gallery-muted font-mono">
        Loading tender details...
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="py-20 text-center text-xs text-gallery-muted font-mono">
        Tender opportunity not found.
      </div>
    );
  }

  return <TenderDetailView tender={tender} basePath="" isReviewMode={false} />;
}
