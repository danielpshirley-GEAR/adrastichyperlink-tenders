// src/app/review/layout.tsx
import React from 'react';
import { NavigationBar } from '@/shared/design-system/components/NavigationBar';
import { reviewBuildMeta } from '@/modules/public-tenders/review/data';

export const metadata = {
  title: 'Adrastichyperlink — Public Review Mirror',
  description: 'Public review mirror of the Adrastichyperlink Public Tender Engine for automated inspection.',
};

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gallery-canvas text-gallery-charcoal font-sans antialiased min-h-screen flex flex-col">
      <NavigationBar basePath="/review" isReviewMode={true} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
      <footer className="border-t border-gallery-border bg-gallery-surface py-4 px-6 text-center text-[11px] font-mono text-gallery-muted flex flex-wrap items-center justify-center gap-4">
        <span>
          Build: <strong className="text-gallery-charcoal">{reviewBuildMeta.buildId}</strong>
        </span>
        <span>•</span>
        <span>
          Updated: <strong className="text-gallery-charcoal">{reviewBuildMeta.deployedAt}</strong>
        </span>
        <span>•</span>
        <span>
          Environment: <strong className="text-amber-800 font-bold uppercase">{reviewBuildMeta.environment}</strong>
        </span>
      </footer>
    </div>
  );
}
