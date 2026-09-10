// src/app/today/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { FirstRunEmptyState } from '@/modules/public-tenders/components/FirstRunEmptyState';
import { TodayView, TodayData } from '@/modules/public-tenders/components/TodayView';
import { TenderSummary } from '@/modules/public-tenders/types/tender';

export default function TodayPage() {
  const [tenders, setTenders] = useState<TenderSummary[]>([]);
  const [applicationsCount, setApplicationsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tenders').then((res) => res.json()),
      fetch('/api/applications').then((res) => res.json()),
    ])
      .then(([tendersData, appsData]) => {
        if (tendersData.tenders) setTenders(tendersData.tenders);
        if (appsData.applications) setApplicationsCount(appsData.applications.length);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // First Run state when database contains 0 scanned tenders
  if (!loading && tenders.length === 0) {
    return <FirstRunEmptyState onScanTriggered={() => window.location.reload()} />;
  }

  const productionTodayData: TodayData = {
    greeting: 'Good morning, Daniel.',
    summary: 'Operational summary of UK creative procurement, active applications, and immediate deadlines.',
    qualifiedTendersCount: tenders.filter((t) => t.qualification === 'STRONG').length,
    activeApplicationsCount: applicationsCount,
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
