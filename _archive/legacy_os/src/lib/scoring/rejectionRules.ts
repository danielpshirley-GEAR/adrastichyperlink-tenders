import { BudgetEvidenceConfidence } from "../types";

export interface RejectionEvaluationInput {
  companyName: string;
  employeeCount: number;
  budgetConfidence: BudgetEvidenceConfidence;
  estimatedBudgetGbp?: number;
  requiresUnpaidSpeculativePitch?: boolean;
  requiresImpossibleTurnoverThreshold?: boolean;
  isIrrelevantService?: boolean; // e.g. cheap social media farming
  isStaleSignalDays?: number;
  isSuppressed?: boolean;
}

export interface RejectionResult {
  shouldReject: boolean;
  rejectionReason?: string;
  recommendedAlternativeAction?: string;
}

export function evaluateHardRejectionRules(input: RejectionEvaluationInput): RejectionResult {
  if (input.isSuppressed) {
    return {
      shouldReject: true,
      rejectionReason: "Contact or organisation has explicitly requested no contact / suppression flag set.",
      recommendedAlternativeAction: "Permanently suppress and do not reach out.",
    };
  }

  if (input.requiresUnpaidSpeculativePitch) {
    return {
      shouldReject: true,
      rejectionReason: "Requires extensive unpaid speculative creative pitch without commercial commitment.",
      recommendedAlternativeAction: "Decline respectfully; Adrastichyperlink delivers strategic discovery, not free spec design.",
    };
  }

  if (input.requiresImpossibleTurnoverThreshold) {
    return {
      shouldReject: true,
      rejectionReason: "Procurement requires turnover/insurance thresholds exceeding current independent studio limits.",
      recommendedAlternativeAction: "Do not bid solo. Tag as consortium / subcontractor opportunity with an approved Tier 1 agency partner.",
    };
  }

  if (input.isIrrelevantService) {
    return {
      shouldReject: true,
      rejectionReason: "Request is for generic commodity production (e.g. bulk social posts) rather than senior strategy, brand, or motion.",
      recommendedAlternativeAction: "Politely pass; not aligned with studio positioning.",
    };
  }

  if (input.budgetConfidence === "unknown" && input.employeeCount < 3 && (!input.estimatedBudgetGbp || input.estimatedBudgetGbp < 1000)) {
    return {
      shouldReject: true,
      rejectionReason: "Micro-entity with zero budget evidence and unviable financial capacity. High risk of non-payment or scope churn.",
      recommendedAlternativeAction: "Mark as REJECT — DO NOT WASTE TIME.",
    };
  }

  if (input.isStaleSignalDays && input.isStaleSignalDays > 90) {
    return {
      shouldReject: true,
      rejectionReason: "Opportunity signal is older than 90 days. Window of intent has closed.",
      recommendedAlternativeAction: "Archive or add to general industry watchlist.",
    };
  }

  return {
    shouldReject: false,
  };
}
