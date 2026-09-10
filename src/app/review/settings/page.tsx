// src/app/review/settings/page.tsx
import React from 'react';
import { SettingsView } from '@/modules/public-tenders/components/SettingsView';

export default function ReviewSettingsPage() {
  return (
    <SettingsView
      basePath="/review"
      isReviewMode={true}
    />
  );
}
