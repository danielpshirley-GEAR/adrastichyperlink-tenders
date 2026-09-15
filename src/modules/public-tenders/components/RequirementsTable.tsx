// src/modules/public-tenders/components/RequirementsTable.tsx
import React from 'react';
import { TenderRequirement } from '../types/tender';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Clock } from 'lucide-react';

interface RequirementsTableProps {
  requirements: TenderRequirement[];
  isEligibilityPublished?: boolean;
  eligibilityNoticeText?: string;
}

export function RequirementsTable({
  requirements,
  isEligibilityPublished = false,
  eligibilityNoticeText,
}: RequirementsTableProps) {
  if (!requirements || requirements.length === 0 || !isEligibilityPublished) {
    return (
      <div className="p-4 bg-gallery-canvas border border-gallery-border rounded-lg flex items-start gap-3 text-xs text-gallery-muted">
        <Clock className="w-4 h-4 text-gallery-faint shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-gallery-charcoal">
            Formal Eligibility Criteria Not Yet Published
          </div>
          <p className="mt-0.5 leading-relaxed text-[11px]">
            {eligibilityNoticeText ||
              'Formal eligibility criteria have not yet been published in the currently available procurement material. Detailed Selection Questionnaire (SQ) / ESPD compliance rules will be released upon formal call for competition.'}
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: TenderRequirement['status']) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            PASS
          </span>
        );
      case 'PASS_WITH_ACTION':
      case 'ACTION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            {status.replace(/_/g, ' ')}
          </span>
        );
      case 'PARTNER_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px] font-bold border border-sky-200">
            PARTNER REQUIRED
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-800 text-[10px] font-bold border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" />
            FAIL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[10px] font-bold border border-zinc-200">
            <HelpCircle className="w-3 h-3 text-zinc-500" />
            UNKNOWN
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto bg-gallery-surface border border-gallery-border rounded-lg shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-gallery-border bg-gallery-canvas text-gallery-muted font-mono text-[10px] uppercase">
            <th className="py-2.5 px-4 font-semibold">Category</th>
            <th className="py-2.5 px-4 font-semibold">Requirement</th>
            <th className="py-2.5 px-4 font-semibold">Buyer Specification</th>
            <th className="py-2.5 px-4 font-semibold">Knowledge Base Evidence</th>
            <th className="py-2.5 px-4 font-semibold text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gallery-border">
          {requirements.map((req) => (
            <tr key={req.id} className="hover:bg-gallery-canvas/60 transition-colors">
              <td className="py-3 px-4 font-mono text-[10px] uppercase text-gallery-muted font-semibold">
                {req.category}
              </td>
              <td className="py-3 px-4 font-bold text-gallery-charcoal">
                <div>{req.requirementName}</div>
                {req.mandatory && <span className="text-red-600 font-mono text-[10px]">*Mandatory</span>}
                {req.factType && (
                  <span className="block mt-0.5 text-[9px] font-mono font-normal text-gallery-faint">
                    {req.factType.replace(/_/g, ' ')}
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-gallery-muted text-[11px] leading-relaxed">
                <div>{req.buyerRequirementText}</div>
                {req.sourceCitation && (
                  <div className="text-[10px] font-mono text-gallery-faint mt-0.5">{req.sourceCitation}</div>
                )}
              </td>
              <td className="py-3 px-4 text-gallery-charcoal text-[11px]">
                {req.adrasticCapabilityText || 'Verification pending Knowledge Base confirmation'}
              </td>
              <td className="py-3 px-4 text-right shrink-0">{getStatusBadge(req.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
