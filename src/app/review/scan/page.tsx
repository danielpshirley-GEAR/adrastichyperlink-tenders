// src/app/review/scan/page.tsx
import React from 'react';
import { ScanView } from '@/modules/public-tenders/components/ScanView';
import { reviewSources } from '@/modules/public-tenders/review/data';

export default function ReviewScanPage() {
  return (
    <ScanView
      sources={reviewSources}
      basePath="/review"
      isReviewMode={true}
    />
  );
}
