// src/app/review/tenders/page.tsx
import React from 'react';
import { TendersInboxView } from '@/modules/public-tenders/components/TendersInboxView';
import { reviewTenders } from '@/modules/public-tenders/review/data';

export default function ReviewTendersPage() {
  return (
    <TendersInboxView
      tenders={reviewTenders}
      basePath="/review"
      isReviewMode={true}
    />
  );
}
