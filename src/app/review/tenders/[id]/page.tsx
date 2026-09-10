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

export default async function ReviewTenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tender = reviewTenders.find((t) => t.id === id);

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
