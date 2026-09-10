// src/app/review/knowledge/page.tsx
import React from 'react';
import { KnowledgeView } from '@/modules/public-tenders/components/KnowledgeView';

export default function ReviewKnowledgePage() {
  return (
    <KnowledgeView
      basePath="/review"
      isReviewMode={true}
    />
  );
}
