// src/app/tenders/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { TendersInboxView } from '@/modules/public-tenders/components/TendersInboxView';
import { TenderSummary } from '@/modules/public-tenders/types/tender';

export default function TendersPage() {
  const [tenders, setTenders] = useState<TenderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tenders')
      .then((res) => res.json())
      .then((data) => setTenders(data.tenders || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gallery-muted font-mono">
        Loading tender opportunities...
      </div>
    );
  }

  return <TendersInboxView tenders={tenders} basePath="" isReviewMode={false} />;
}
