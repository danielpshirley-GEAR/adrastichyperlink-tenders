// src/app/applications/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ApplicationsView } from '@/modules/public-tenders/components/ApplicationsView';
import { TenderApplication } from '@/modules/public-tenders/types/application';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<TenderApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications')
      .then((res) => res.json())
      .then((data) => {
        if (data.applications) setApplications(data.applications);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gallery-muted font-mono">
        Loading proposal applications...
      </div>
    );
  }

  return <ApplicationsView applications={applications} basePath="" isReviewMode={false} />;
}
