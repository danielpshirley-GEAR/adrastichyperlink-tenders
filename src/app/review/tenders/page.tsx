// src/app/review/tenders/page.tsx
import React, { Suspense } from 'react';
import { TendersWorkstationView } from '@/modules/public-tenders/components/TendersWorkstationView';
import { reviewTenders, reviewApplications } from '@/modules/public-tenders/review/data';

export default function ReviewTendersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-gallery-muted font-mono">
          Loading review workstation...
        </div>
      }
    >
      <TendersWorkstationView
        initialTenders={reviewTenders}
        initialApplications={reviewApplications}
        basePath="/review"
        isReviewMode={true}
      />
    </Suspense>
  );
}
