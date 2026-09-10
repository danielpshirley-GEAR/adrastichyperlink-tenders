// src/app/review/today/page.tsx
import React from 'react';
import { TodayView } from '@/modules/public-tenders/components/TodayView';
import { reviewTodayData, reviewTenders } from '@/modules/public-tenders/review/data';

export default function ReviewTodayPage() {
  return (
    <TodayView
      todayData={reviewTodayData}
      qualifiedTenders={reviewTenders}
      basePath="/review"
      isReviewMode={true}
    />
  );
}
