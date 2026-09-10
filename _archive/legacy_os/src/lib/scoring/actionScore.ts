import { PipelineStage, OpportunityConfidence } from "../types";

export interface ActionScoreInput {
  leadScore: number;
  triggerFreshnessHours: number;
  pipelineStage: PipelineStage;
  hasUnreadReply: boolean;
  isFollowUpDue: boolean;
  daysUntilDeadline?: number; // For tenders / proposals
  isExplicitDemand: boolean;
  opportunityConfidence?: OpportunityConfidence;
  isElevatedToOpportunity?: boolean;
}

export interface ActionScoreResult {
  actionScore: number; // 0-100
  urgencyLabel: "URGENT — CONTACT NOW" | "HIGH PRIORITY TODAY" | "SCHEDULED ACTION" | "LOW URGENCY" | "NURTURE / DORMANT";
  urgencyBadgeColor: "red" | "amber" | "green" | "gray";
  primaryReason: string;
}

export function calculateActionScore(input: ActionScoreInput): ActionScoreResult {
  // 0. Signal Only guard: Never trigger urgent sales outreach on un-elevated signals
  if (input.opportunityConfidence === "signal_only" && !input.isElevatedToOpportunity) {
    const signalScore = Math.min(40, Math.round(input.leadScore * 0.5));
    return {
      actionScore: signalScore,
      urgencyLabel: "NURTURE / DORMANT",
      urgencyBadgeColor: "gray",
      primaryReason: "Signal Only: Observation noted. Requires secondary research before elevating to active sales opportunity.",
    };
  }

  // 1. Inbound unread reply = absolute emergency (Score: 99-100)
  if (input.hasUnreadReply) {
    return {
      actionScore: 100,
      urgencyLabel: "URGENT — CONTACT NOW",
      urgencyBadgeColor: "red",
      primaryReason: "Prospect has replied. Respond immediately while attention is hot.",
    };
  }

  // 2. Fresh explicit agency demand posted in last 2 hours = 96-99
  if (input.isExplicitDemand && input.triggerFreshnessHours <= 2) {
    return {
      actionScore: 98,
      urgencyLabel: "URGENT — CONTACT NOW",
      urgencyBadgeColor: "red",
      primaryReason: `Explicit agency search posted ${Math.round(input.triggerFreshnessHours * 60)} minutes ago. Contact within 1 hour.`,
    };
  }

  // 3. Explicit demand posted today (<24 hours) = 90-95
  if (input.isExplicitDemand && input.triggerFreshnessHours <= 24) {
    return {
      actionScore: 94,
      urgencyLabel: "URGENT — CONTACT NOW",
      urgencyBadgeColor: "red",
      primaryReason: "Explicit agency search posted today. Early responder advantage is massive.",
    };
  }

  // 4. Critical tender / proposal deadline approaching
  if (input.daysUntilDeadline !== undefined && input.daysUntilDeadline <= 2 && input.daysUntilDeadline >= 0) {
    return {
      actionScore: 92,
      urgencyLabel: "URGENT — CONTACT NOW",
      urgencyBadgeColor: "red",
      primaryReason: `Submission deadline is in ${input.daysUntilDeadline === 0 ? "hours" : `${input.daysUntilDeadline} day(s)`}.`,
    };
  }

  // 5. Follow-up sequence due today
  if (input.isFollowUpDue) {
    const score = Math.max(82, Math.min(92, input.leadScore + 5));
    return {
      actionScore: score,
      urgencyLabel: "HIGH PRIORITY TODAY",
      urgencyBadgeColor: "amber",
      primaryReason: "Scheduled follow-up is due today in the sales cadence.",
    };
  }

  // 6. Base formula: LeadScore weighted by freshness
  let freshnessMultiplier = 1.0;
  if (input.triggerFreshnessHours <= 24) freshnessMultiplier = 1.0;
  else if (input.triggerFreshnessHours <= 72) freshnessMultiplier = 0.92;
  else if (input.triggerFreshnessHours <= 168) freshnessMultiplier = 0.80;
  else if (input.triggerFreshnessHours <= 720) freshnessMultiplier = 0.65;
  else freshnessMultiplier = 0.45;

  let baseScore = Math.round(input.leadScore * freshnessMultiplier);

  // Stage dampening
  if (input.pipelineStage === "nurture" || input.pipelineStage === "lost") {
    baseScore = Math.min(baseScore, 35);
  } else if (input.pipelineStage === "rejected") {
    baseScore = 0;
  }

  const actionScore = Math.max(0, Math.min(100, baseScore));

  let urgencyLabel: ActionScoreResult["urgencyLabel"] = "SCHEDULED ACTION";
  let urgencyBadgeColor: ActionScoreResult["urgencyBadgeColor"] = "green";

  if (actionScore >= 90) {
    urgencyLabel = "URGENT — CONTACT NOW";
    urgencyBadgeColor = "red";
  } else if (actionScore >= 75) {
    urgencyLabel = "HIGH PRIORITY TODAY";
    urgencyBadgeColor = "amber";
  } else if (actionScore >= 50) {
    urgencyLabel = "SCHEDULED ACTION";
    urgencyBadgeColor = "green";
  } else {
    urgencyLabel = "NURTURE / DORMANT";
    urgencyBadgeColor = "gray";
  }

  return {
    actionScore,
    urgencyLabel,
    urgencyBadgeColor,
    primaryReason: `Calculated from Lead Score (${input.leadScore}) and trigger age (${Math.round(input.triggerFreshnessHours)}h).`,
  };
}
