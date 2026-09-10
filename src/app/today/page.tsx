// src/app/today/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FirstRunEmptyState } from '@/modules/public-tenders/components/FirstRunEmptyState';
import { TodayView, TodayData } from '@/modules/public-tenders/components/TodayView';
import { TenderSummary } from '@/modules/public-tenders/types/tender';

export default function TodayPage() {
  const [tenders, setTenders] = useState<TenderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tenders')
      .then((res) => res.json())
      .then((data) => {
        if (data.tenders) setTenders(data.tenders);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Section 74 First Run state when database contains 0 scanned tenders
  if (!loading && tenders.length === 0) {
    return <FirstRunEmptyState onScanTriggered={() => window.location.reload()} />;
  }

  const productionTodayData: TodayData = {
    greeting: 'Good morning, Daniel.',
    summary: 'Operational summary of UK creative procurement, active applications, and immediate deadlines.',
    qualifiedTendersCount: tenders.filter((t) => t.qualification === 'STRONG').length,
    activeApplicationsCount: 0,
    missingInformationCount: 0,
    immediateActions: [],
  };

  return (
    <TodayView
      todayData={productionTodayData}
      qualifiedTenders={tenders}
      basePath=""
      isReviewMode={false}
    />
  );
}
