// src/app/applications/page.tsx
'use client';

import React, { useState } from 'react';
import { ApplicationsView } from '@/modules/public-tenders/components/ApplicationsView';
import { TenderApplication } from '@/modules/public-tenders/types/application';

export default function ApplicationsPage() {
  const [applications] = useState<TenderApplication[]>([]);

  return <ApplicationsView applications={applications} basePath="" isReviewMode={false} />;
}
