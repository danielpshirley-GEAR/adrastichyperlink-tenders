// src/modules/public-tenders/components/DocumentList.tsx
import React from 'react';
import { TenderDocumentItem, DocumentItemCategory } from '../types/tender';
import { FileText, Download, CheckCircle2, Lock, Clock, ExternalLink, HelpCircle } from 'lucide-react';

interface DocumentListProps {
  documents: TenderDocumentItem[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="p-6 bg-gallery-surface border border-gallery-border rounded-lg text-xs text-gallery-muted font-mono">
        No tender documentation or source notices attached.
      </div>
    );
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const countSourceNotices = documents.filter((d) => d.category === 'SOURCE_NOTICE').length;
  const countPortalLinks = documents.filter((d) => d.category === 'PORTAL_LINK').length;
  const countPublishedDocs = documents.filter((d) => d.category === 'PUBLISHED_DOCUMENT').length;
  const countExpectedDocs = documents.filter((d) => d.category === 'EXPECTED_FUTURE_DOCUMENT').length;

  const categories: Array<{ key: DocumentItemCategory; label: string; count: number; badgeColor: string }> = [
    { key: 'SOURCE_NOTICE', label: 'SOURCE NOTICES', count: countSourceNotices, badgeColor: 'text-tender-primary bg-tender-primary/10 border-tender-primary/30' },
    { key: 'PORTAL_LINK', label: 'PORTAL LINKS', count: countPortalLinks, badgeColor: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
    { key: 'PUBLISHED_DOCUMENT', label: 'PUBLISHED PROCUREMENT DOCUMENTS', count: countPublishedDocs, badgeColor: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
    { key: 'EXPECTED_FUTURE_DOCUMENT', label: 'EXPECTED FUTURE DOCUMENTS', count: countExpectedDocs, badgeColor: 'text-amber-800 bg-amber-50 border-amber-200' },
  ];

  return (
    <div className="space-y-4">
      {/* Category Summary Header */}
      <div className="p-3 bg-gallery-canvas border border-gallery-border rounded-lg flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] font-mono font-bold">
        {categories.map((c) => (
          <div key={c.key} className={`px-2 py-1 rounded border ${c.badgeColor} flex items-center gap-1.5`}>
            <span>{c.label}:</span>
            <span className="font-extrabold text-xs">{c.count}</span>
          </div>
        ))}
      </div>

      {/* Document Items */}
      <div className="divide-y divide-gallery-border bg-gallery-surface border border-gallery-border rounded-lg overflow-hidden shadow-2xs">
        {documents.map((doc) => (
          <div key={doc.id} className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-gallery-canvas/60 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded bg-gallery-surfaceMuted border border-gallery-border flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-tender-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gallery-charcoal truncate">{doc.fileName}</div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-gallery-muted mt-0.5">
                  <span className="uppercase font-semibold text-tender-primary">
                    {doc.category ? doc.category.replace(/_/g, ' ') : doc.docType}
                  </span>
                  {doc.fileSizeBytes ? (
                    <>
                      <span>•</span>
                      <span>{formatBytes(doc.fileSizeBytes)}</span>
                    </>
                  ) : null}
                  {doc.fileHash ? (
                    <>
                      <span>•</span>
                      <span className="text-gallery-faint truncate max-w-[140px]" title={`SHA-256: ${doc.fileHash}`}>
                        SHA-256: {doc.fileHash.slice(0, 10)}...
                      </span>
                    </>
                  ) : null}
                  {doc.notes && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-gallery-faint hidden sm:inline truncate max-w-sm">{doc.notes}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {doc.accessState === 'PUBLIC' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  PUBLIC
                </span>
              )}
              {doc.accessState === 'LOGIN REQUIRED' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 text-[10px] font-mono font-bold border border-amber-300">
                  <Lock className="w-2.5 h-2.5 text-amber-700" />
                  LOGIN REQUIRED
                </span>
              )}
              {doc.accessState === 'ACCESS NOT YET VERIFIED' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-900 text-[10px] font-mono font-bold border border-amber-200">
                  <HelpCircle className="w-2.5 h-2.5 text-amber-600" />
                  ACCESS NOT YET VERIFIED
                </span>
              )}
              {doc.accessState === 'NOT PUBLISHED' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-mono font-bold border border-zinc-300">
                  <Clock className="w-2.5 h-2.5 text-zinc-500" />
                  NOT PUBLISHED
                </span>
              )}
              {doc.accessState === 'BROKEN' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-800 text-[10px] font-mono font-bold border border-red-200">
                  BROKEN
                </span>
              )}

              {doc.sourceUrl || doc.downloadUrl ? (
                <a
                  href={doc.downloadUrl || doc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-gallery-surfaceMuted text-gallery-muted hover:text-gallery-charcoal transition-colors inline-flex items-center gap-1 text-[11px] font-mono"
                  title="Open document or portal link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
