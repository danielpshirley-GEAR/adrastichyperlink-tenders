// src/app/scan/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ScanView } from '@/modules/public-tenders/components/ScanView';
import { SourceMeta } from '@/modules/public-tenders/connectors/registry';

export default function ScanPage() {
  const [sources, setSources] = useState<SourceMeta[]>([]);

  useEffect(() => {
    fetch('/api/sources')
      .then((res) => res.json())
      .then((data) => setSources(data.sources || []))
      .catch((err) => console.error(err));
  }, []);

  return <ScanView sources={sources} basePath="" isReviewMode={false} />;
}
