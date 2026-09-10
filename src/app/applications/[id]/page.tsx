// src/app/applications/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ApplicationDetailView } from '@/modules/public-tenders/components/ApplicationDetailView';
import { TenderApplication } from '@/modules/public-tenders/types/application';
import { reviewApplications } from '@/modules/public-tenders/review/data';

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [application, setApplication] = useState<TenderApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = reviewApplications.find((a) => a.id === id);
    if (found) {
      setApplication(found);
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-gallery-muted font-mono">
        Loading proposal project...
      </div>
    );
  }

  if (!application) {
    return (
      <div className="py-20 text-center text-xs text-gallery-muted font-mono">
        Application project not found.
      </div>
    );
  }

  return <ApplicationDetailView application={application} basePath="" isReviewMode={false} />;
}
