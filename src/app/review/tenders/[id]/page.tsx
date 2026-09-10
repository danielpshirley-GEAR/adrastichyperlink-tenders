// src/app/review/tenders/[id]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { TenderDetailView } from '@/modules/public-tenders/components/TenderDetailView';
import { reviewTenders } from '@/modules/public-tenders/review/data';

export function generateStaticParams() {
  return reviewTenders.map((tender) => ({
    id: tender.id,
  }));
}

export default function ReviewTenderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const tender = reviewTenders.find((t) => t.id === params.id);

  if (!tender) {
    notFound();
  }

  return (
    <TenderDetailView
      tender={tender}
      basePath="/review"
      isReviewMode={true}
    />
  );
}
