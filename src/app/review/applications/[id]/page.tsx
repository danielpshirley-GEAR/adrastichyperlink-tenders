// src/app/review/applications/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { ApplicationDetailView } from '@/modules/public-tenders/components/ApplicationDetailView';
import { reviewApplications } from '@/modules/public-tenders/review/data';

export function generateStaticParams() {
  return reviewApplications.map((app) => ({
    id: app.id,
  }));
}

export default function ReviewApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const application = reviewApplications.find((a) => a.id === params.id);

  if (!application) {
    notFound();
  }

  return (
    <ApplicationDetailView
      application={application}
      basePath="/review"
      isReviewMode={true}
    />
  );
}
