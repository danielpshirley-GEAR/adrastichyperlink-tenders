// src/app/scan/page.tsx
import React from 'react';
import { ScanView } from '@/modules/public-tenders/components/ScanView';
import { SourceRegistry } from '@/modules/public-tenders/connectors/registry';

export const dynamic = 'force-dynamic';

export default async function ScanPage() {
  const sources = await SourceRegistry.getInstance().getSourcesMeta();
  return <ScanView sources={sources} basePath="" isReviewMode={false} />;
}
