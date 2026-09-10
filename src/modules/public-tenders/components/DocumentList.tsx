// src/modules/public-tenders/components/DocumentList.tsx
import React from 'react';
import { TenderDocumentItem } from '../types/tender';
import { FileText, Download, CheckCircle2, Lock } from 'lucide-react';

interface DocumentListProps {
  documents: TenderDocumentItem[];
}

export function DocumentList({ documents }: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="p-6 bg-gallery-surface border border-gallery-border rounded-lg text-xs text-gallery-muted font-mono">
        No tender documentation attached to this notice.
      </div>
    );
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="divide-y divide-gallery-border bg-gallery-surface border border-gallery-border rounded-lg overflow-hidden shadow-2xs">
      {documents.map((doc) => (
        <div key={doc.id} className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-gallery-canvas/60 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-gallery-surfaceMuted border border-gallery-border flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-tender-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gallery-charcoal truncate">{doc.fileName}</div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-gallery-muted">
                <span className="uppercase font-semibold text-tender-primary">{doc.docType}</span>
                <span>•</span>
                <span>{formatBytes(doc.fileSizeBytes)}</span>
                <span>•</span>
                <span className="text-gallery-faint truncate max-w-[140px]">{doc.fileHash}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {doc.analysisStatus === 'analyzed' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Analyzed
              </span>
            )}
            {doc.requiresLogin ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-mono border border-zinc-200">
                <Lock className="w-2.5 h-2.5" />
                Portal Login Required
              </span>
            ) : (
              <button
                type="button"
                className="p-1.5 rounded hover:bg-gallery-surfaceMuted text-gallery-muted hover:text-gallery-charcoal transition-colors"
                title="Download document"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
