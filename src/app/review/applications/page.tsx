// src/app/review/applications/page.tsx
import React from 'react';
import { ApplicationsView } from '@/modules/public-tenders/components/ApplicationsView';
import { reviewApplications } from '@/modules/public-tenders/review/data';

export default function ReviewApplicationsPage() {
  return (
    <ApplicationsView
      applications={reviewApplications}
      basePath="/review"
      isReviewMode={true}
    />
  );
}
