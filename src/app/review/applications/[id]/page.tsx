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

export default async function ReviewApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const application = reviewApplications.find((a) => a.id === id);

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
