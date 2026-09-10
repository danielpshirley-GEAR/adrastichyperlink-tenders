// src/shared/design-system/components/NavigationBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Eye } from 'lucide-react';

interface NavItem {
  name: string;
  subpath: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'TODAY', subpath: '/today' },
  { name: 'TENDERS', subpath: '/tenders' },
  { name: 'APPLICATIONS', subpath: '/applications' },
  { name: 'SCAN', subpath: '/scan' },
  { name: 'KNOWLEDGE', subpath: '/knowledge' },
  { name: 'SETTINGS', subpath: '/settings' },
];

interface NavigationBarProps {
  basePath?: string;
  isReviewMode?: boolean;
}

export function NavigationBar({ basePath = '', isReviewMode = false }: NavigationBarProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40">
      {/* Review Mode Banner */}
      {isReviewMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 text-center text-[10px] font-mono font-bold tracking-widest text-amber-900 uppercase flex items-center justify-center gap-2">
          <Eye className="w-3 h-3 text-amber-700" />
          <span>PUBLIC REVIEW MODE — READ ONLY AUDIT MIRROR</span>
          <span className="text-amber-500">•</span>
          <Link href="/review/content" className="underline hover:text-amber-950">
            TEXT REVIEW
          </Link>
          <span className="text-amber-500">•</span>
          <Link href="/review/manifest.json" className="underline hover:text-amber-950">
            MANIFEST
          </Link>
        </div>
      )}

      <header className="bg-gallery-surface/90 backdrop-blur-md border-b border-gallery-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand / Workstation Title */}
          <div className="flex items-center gap-6">
            <Link href={`${basePath}/today`} className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded bg-gallery-charcoal text-white font-mono font-bold text-xs flex items-center justify-center tracking-tight">
                A/H
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight text-gallery-charcoal uppercase">
                  Adrastichyperlink
                </span>
                <span className="text-[10px] font-mono tracking-widest text-gallery-muted uppercase">
                  Public Tender Engine
                </span>
              </div>
            </Link>

            <div className="h-4 w-[1px] bg-gallery-border hidden md:block" />

            {/* Clean 6-Item Main Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const targetHref = `${basePath}${item.subpath}`;
                const isActive =
                  pathname === targetHref ||
                  (item.subpath !== '/today' && pathname.startsWith(targetHref));

                return (
                  <Link
                    key={item.name}
                    href={targetHref}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wider transition-colors ${
                      isActive
                        ? 'text-tender-primary bg-tender-primaryLight font-bold'
                        : 'text-gallery-muted hover:text-gallery-charcoal hover:bg-gallery-surfaceMuted'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Status Indicators & Operational Context */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-gallery-surfaceMuted border border-gallery-border text-[11px] font-mono text-gallery-muted">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>7 Sources Active</span>
              <span className="text-gallery-border">•</span>
              <span>Next: Mon 07:00</span>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-gallery-border">
              <div className="w-7 h-7 rounded bg-gallery-charcoal text-white font-mono text-[10px] font-bold flex items-center justify-center">
                DS
              </div>
              <span className="hidden sm:inline text-xs font-medium text-gallery-charcoal">
                Daniel Shirley
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-gallery-border gap-1 bg-gallery-surface">
          {NAV_ITEMS.map((item) => {
            const targetHref = `${basePath}${item.subpath}`;
            const isActive =
              pathname === targetHref ||
              (item.subpath !== '/today' && pathname.startsWith(targetHref));

            return (
              <Link
                key={item.name}
                href={targetHref}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold tracking-wider whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-tender-primary bg-tender-primaryLight font-bold'
                    : 'text-gallery-muted hover:text-gallery-charcoal'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </header>
    </div>
  );
}
