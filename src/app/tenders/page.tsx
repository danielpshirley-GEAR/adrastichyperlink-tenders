// src/app/tenders/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { TendersWorkstationView } from '@/modules/public-tenders/components/TendersWorkstationView';
import { TenderSummary } from '@/modules/public-tenders/types/tender';
import { TenderApplication } from '@/modules/public-tenders/types/application';

function TendersPageContent() {
  const [tenders, setTenders] = useState<TenderSummary[]>([]);
  const [applications, setApplications] = useState<TenderApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tenders').then((res) => (res.ok ? res.json() : { tenders: [] })),
      fetch('/api/applications').then((res) => (res.ok ? res.json() : { applications: [] })),
    ])
      .then(([tendersData, appsData]) => {
        setTenders(tendersData.tenders || []);
        setApplications(appsData.applications || []);
      })
      .catch((err) => console.error('Error loading workstation data:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-gallery-muted font-mono">
        Loading public tender workstation...
      </div>
    );
  }

  return (
    <TendersWorkstationView
      initialTenders={tenders}
      initialApplications={applications}
      basePath=""
      isReviewMode={false}
    />
  );
}

export default function TendersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-gallery-muted font-mono">
          Initializing workstation...
        </div>
      }
    >
      <TendersPageContent />
    </Suspense>
  );
}
