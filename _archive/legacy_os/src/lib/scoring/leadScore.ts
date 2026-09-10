import { AcquisitionEngine, BudgetEvidenceConfidence } from "../types";

export interface LeadScoreInput {
  acquisitionEngine: AcquisitionEngine;
  intentSignalType: "explicit_request" | "tender_rfp" | "strong_trigger" | "capacity_gap" | "passive_need";
  budgetConfidence: BudgetEvidenceConfidence;
  estimatedRevenueGbp?: number;
  knownFundingGbp?: number;
  triggerFreshnessHours: number;
  relevantCapabilitiesCount: number; // 1 to 4
  hasIdentifiedBuyer: boolean;
  buyerRoleInfluence: "high" | "medium" | "low";
  hasStrategicValue: boolean; // Retainer potential, marquee brand, strong case study
}

export interface LeadScoreResult {
  totalScore: number; // 0-100
  intentScore: number; // 0-30
  budgetScore: number; // 0-25
  timingScore: number; // 0-15
  fitScore: number; // 0-15
  buyerAccessScore: number; // 0-10
  strategicValueScore: number; // 0-5
  breakdown: string[];
}

export function calculateLeadScore(input: LeadScoreInput): LeadScoreResult {
  const breakdown: string[] = [];

  // 1. Buying Intent (30 pts max)
  let intentScore = 0;
  switch (input.intentSignalType) {
    case "explicit_request":
      intentScore = 30;
      breakdown.push("Explicit agency search / recommendation request (+30)");
      break;
    case "tender_rfp":
      intentScore = 26;
      breakdown.push("Formal RFP / Tender procurement (+26)");
      break;
    case "strong_trigger":
      intentScore = 19;
      breakdown.push("Active business trigger (funding + expansion + leadership) (+19)");
      break;
    case "capacity_gap":
      intentScore = 16;
      breakdown.push("Evident internal capacity / agency overflow (+16)");
      break;
    case "passive_need":
    default:
      intentScore = 5;
      breakdown.push("Passive design need without explicit buying signal (+5)");
      break;
  }

  // 2. Budget Evidence (25 pts max)
  let budgetScore = 0;
  switch (input.budgetConfidence) {
    case "confirmed":
      budgetScore = 25;
      breakdown.push("Confirmed verified budget / published tender value (+25)");
      break;
    case "strongly_inferred":
      budgetScore = 18;
      breakdown.push("Strongly inferred external budget (+18)");
      break;
    case "employment_spend":
      // Rule 5: A salary demonstrates approximate capability spend but does not establish an external project budget.
      budgetScore = 5;
      breakdown.push("Employment salary spend noted; no confirmed external project budget (+5)");
      break;
    case "weakly_inferred":
      budgetScore = 10;
      breakdown.push("Weakly inferred budget (+10)");
      break;
    case "unknown":
    default:
      budgetScore = 2;
      breakdown.push("Unknown external project budget (+2)");
      break;
  }

  // 3. Timing / Freshness (15 pts max)
  let timingScore = 0;
  if (input.triggerFreshnessHours <= 24) {
    timingScore = 15;
    breakdown.push("Fresh trigger under 24 hours (+15)");
  } else if (input.triggerFreshnessHours <= 72) {
    timingScore = 12;
    breakdown.push("Trigger between 1-3 days (+12)");
  } else if (input.triggerFreshnessHours <= 168) {
    timingScore = 8;
    breakdown.push("Trigger between 4-7 days (+8)");
  } else if (input.triggerFreshnessHours <= 720) {
    timingScore = 4;
    breakdown.push("Trigger between 8-30 days (+4)");
  } else {
    timingScore = 1;
    breakdown.push("Stale signal >30 days (+1)");
  }

  // 4. Fit with Adrastichyperlink Capabilities (15 pts max)
  let fitScore = 0;
  if (input.relevantCapabilitiesCount >= 3) {
    fitScore = 15;
    breakdown.push("Multi-capability sweet spot (Motion + Brand/Strategy + Digital) (+15)");
  } else if (input.relevantCapabilitiesCount === 2) {
    fitScore = 12;
    breakdown.push("Dual capability alignment (+12)");
  } else if (input.relevantCapabilitiesCount === 1) {
    fitScore = 9;
    breakdown.push("Single capability match (e.g. motion production) (+9)");
  } else {
    fitScore = 2;
    breakdown.push("Marginal capability fit (+2)");
  }

  // 5. Buyer Access (10 pts max)
  let buyerAccessScore = 0;
  if (input.hasIdentifiedBuyer) {
    if (input.buyerRoleInfluence === "high") {
      buyerAccessScore = 10;
      breakdown.push("Identified primary budget-holder / decision-maker (+10)");
    } else if (input.buyerRoleInfluence === "medium") {
      buyerAccessScore = 7;
      breakdown.push("Identified key influencer / manager (+7)");
    } else {
      buyerAccessScore = 4;
      breakdown.push("Identified secondary stakeholder (+4)");
    }
  } else {
    buyerAccessScore = 1;
    breakdown.push("No identified direct buyer (+1)");
  }

  // 6. Strategic Value (5 pts max)
  let strategicValueScore = 0;
  if (input.hasStrategicValue) {
    strategicValueScore = 5;
    breakdown.push("High strategic value (retainer / high-impact case study) (+5)");
  } else {
    strategicValueScore = 2;
  }

  const totalScore = Math.min(
    100,
    intentScore + budgetScore + timingScore + fitScore + buyerAccessScore + strategicValueScore
  );

  return {
    totalScore,
    intentScore,
    budgetScore,
    timingScore,
    fitScore,
    buyerAccessScore,
    strategicValueScore,
    breakdown,
  };
}
