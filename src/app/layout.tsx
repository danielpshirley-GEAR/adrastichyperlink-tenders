// src/app/layout.tsx
import type { Metadata } from 'next';
import '@/styles/globals.css';
import { NavigationBar } from '@/shared/design-system/components/NavigationBar';

export const metadata: Metadata = {
  title: 'Adrastichyperlink — Public Tender Engine',
  description: 'Specialist UK public-sector procurement workstation for Adrastichyperlink.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gallery-canvas text-gallery-charcoal font-sans antialiased min-h-screen flex flex-col">
        <NavigationBar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
