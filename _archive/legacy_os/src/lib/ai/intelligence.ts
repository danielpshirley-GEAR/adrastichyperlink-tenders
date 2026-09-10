import { Opportunity } from "../types";

export interface AIResearchDossier {
  companyName: string;
  triggerAnalysis: string;
  whyNow: string;
  budgetEvidenceSummary: string;
  creativeMaturityAssessment: string;
  recommendedServiceEntry: string;
  matchedProofTitle: string;
  isRealClientWork: boolean;
  commercialRisks: string[];
}

export interface AIOutreachPackage {
  emailSubject: string;
  emailBody: string;
  linkedinMessage: string;
  callAngle: {
    whyThisPerson: string;
    whyNow: string;
    openingLine: string;
    talkingPoints: string[];
    likelyObjection: string;
  };
  videoPitchOutline: {
    targetDurationSeconds: number;
    hook: string;
    observation: string;
    relevantWorkReference: string;
    callToAction: string;
  };
}

export interface AIChallengeAdvice {
  level: "warning" | "urgent" | "guidance";
  headline: string;
  advice: string;
  actionRecommendation: string;
}

export const aiIntelligence = {
  getChallengeAdvice(opp: Opportunity): AIChallengeAdvice | null {
    if (opp.actionScore >= 95 && opp.triggerFreshnessHours <= 2) {
      return {
        level: "urgent",
        headline: "URGENT BUYING SIGNAL (<2h old)",
        advice: `This prospect explicitly posted ${Math.round(opp.triggerFreshnessHours * 60)} minutes ago. Early responders capture 70% of exploratory calls. Do not over-polish: reach out immediately.`,
        actionRecommendation: "Approve tailored LinkedIn/Email outreach now.",
      };
    }

    if (opp.budgetConfidence === "unknown" || opp.budgetConfidence === "weakly_inferred") {
      return {
        level: "warning",
        headline: "WEAK BUDGET EVIDENCE — DO NOT DO FREE WORK",
        advice: "Budget evidence is inferred or unconfirmed. Do not create a custom proposal or bespoke pitch deck until a paid diagnostic or budget range has been validated in discovery.",
        actionRecommendation: "Direct to a 15-minute qualification call first.",
      };
    }

    if (opp.pipelineStage === "contacted" && opp.triggerFreshnessHours > 72) {
      return {
        level: "guidance",
        headline: "FOLLOW-UP OPPORTUNITY DUE",
        advice: "Initial outreach sent 3+ days ago. Prospects at this executive level require structured 3-touch follow-ups with genuine insight, not generic 'just checking in' pings.",
        actionRecommendation: "Send Step 2 value-add follow-up referencing technical proof.",
      };
    }

    return null;
  },

  generateOutreachDrafts(opp: Opportunity): AIOutreachPackage {
    const contactName = opp.primaryContact?.name?.split(" ")[0] || "there";
    const companyName = opp.company?.name || "your team";

    // Tailored by acquisition engine
    let emailSubject = "";
    let emailBody = "";
    let linkedinMsg = "";
    let callOpening = "";
    let talkingPoints: string[] = [];
    let objection = "";

    switch (opp.acquisitionEngine) {
      case "active_demand":
        emailSubject = `Creative motion support for ${companyName} — Adrastichyperlink`;
        emailBody = `Hi ${contactName},\n\nSaw your note regarding creative design and motion support for ${companyName}.\n\nAt Adrastichyperlink, we help senior marketing and brand leaders turn complex products into compelling, high-impact motion and design that drives real commercial momentum. Having directed senior motion graphics for demanding Tier 1 brands (including PokerStars and Ministry of Defence projects), we specialize in delivering senior-level creative precision without agency bloat.\n\nI’ve reviewed what you’re building and drafted a 3-point creative approach for how we could structure this.\n\nAre you open to a brief 10-minute introductory conversation this week?\n\nBest regards,\nDaniel Shirley\nFounder & Creative Director | Adrastichyperlink\n+44 7934 593146`;
        linkedinMsg = `Hi ${contactName} — saw your search for a motion design partner for ${companyName}. We lead senior strategy and motion design for high-growth tech and tier-1 brands (including PokerStars & MoD). Would love to share our relevant work. Are you free for a quick chat this week?`;
        callOpening = `Hi ${contactName}, Daniel Shirley calling from Adrastichyperlink. Saw your post regarding motion studio support.`;
        talkingPoints = [
          "Direct senior creative access: You work directly with me (Senior Motion Director) rather than junior account managers.",
          "Rapid turnaround: 4-6 week sprint from narrative storyboarding to final multi-format 4K renders.",
          "Clear commercial terms: 50% deposit with fixed milestones, zero hidden licensing costs.",
        ];
        objection = "We already have 3 agencies in review. Counter: Emphasize agility, zero overhead, and senior-led execution.";
        break;

      case "capacity_overflow":
        emailSubject = `Senior motion capacity when your team needs firepower — ${companyName} x Adrastichyperlink`;
        emailBody = `Hi ${contactName},\n\nI noticed ${companyName}'s rapid momentum and current hiring for creative motion capabilities.\n\nRecruiting senior full-time motion designers often takes 60–90 days, which can stall critical campaign and product launch deadlines in the meantime. We partner with agencies and internal marketing teams to provide plug-and-play senior motion and brand firepower — solving immediate production gaps without long-term permanent headcount overhead.\n\nWe recently delivered high-fidelity 3D and 2D motion packages for leading brands and agencies (including VCCP, Saatchi & Saatchi, and PokerStars).\n\nCould it be useful to have a senior motion resource on standby for upcoming delivery crunches?\n\nBest,\nDaniel Shirley\nCreative Director | Adrastichyperlink`;
        linkedinMsg = `Hi ${contactName} — noticed ${companyName}'s growth and the motion design opening you have live. We often help ambitious teams bridge that exact 60-day hiring gap with senior plug-and-play motion direction. Open to connecting?`;
        callOpening = `Hi ${contactName}, Daniel Shirley from Adrastichyperlink. Calling because I know how painful it is having launch assets bottlenecked while creative recruiting takes 2 months.`;
        talkingPoints = [
          "Immediate availability: Can begin asset production immediately while your HR continues vetting permanent hires.",
          "Zero ramp-up lag: 12+ years of senior industry experience across Cinema 4D, After Effects, and design systems.",
          "Flexible structure: Available as a defined project sprint or monthly capacity partner.",
        ];
        objection = "We only want a permanent employee. Counter: Offer to deliver the immediate upcoming launch asset now so their revenue doesn't wait on recruitment.";
        break;

      default:
        emailSubject = `Strategic motion & design for ${companyName} — Adrastichyperlink`;
        emailBody = `Hi ${contactName},\n\nFollowing ${companyName}'s recent milestone, I wanted to reach out regarding how you communicate your next chapter.\n\nAt Adrastichyperlink, we combine strategic brand clarity with dynamic motion design to make complex, ambitious propositions instantly clear and compelling to stakeholders and customers. Having led design and motion for major brands and complex organizations, we ensure your visual presence matches the maturity of your business.\n\nI’d welcome 10 minutes to share a few observations on your current digital presence and where high-impact motion could accelerate your commercial goals.\n\nBest,\nDaniel Shirley\nFounder & Creative Director | Adrastichyperlink`;
        linkedinMsg = `Hi ${contactName} — congratulations on ${companyName}'s recent milestone. We partner with leaders to translate complex propositions into striking motion and brand systems. Would love to connect and share a quick observation.`;
        callOpening = `Hi ${contactName}, Daniel Shirley from Adrastichyperlink following up on your recent company expansion.`;
        talkingPoints = [
          "Elevating creative presentation to match organizational maturity.",
          "Motion-first communication: Increasing engagement by 3x on executive landing pages.",
          "Strategic diagnosis before deliverable assumptions.",
        ];
        objection = "Not looking for an agency right now. Counter: Offer to stay in touch and share an executive case study relevant to their sector.";
        break;
    }

    return {
      emailSubject,
      emailBody,
      linkedinMessage: linkedinMsg,
      callAngle: {
        whyThisPerson: `${opp.primaryContact?.jobTitle || "Decision Maker"} who owns creative budget and brand delivery.`,
        whyNow: opp.trigger,
        openingLine: callOpening,
        talkingPoints,
        likelyObjection: objection,
      },
      videoPitchOutline: {
        targetDurationSeconds: 90,
        hook: `Open on screen-recording of ${companyName}'s current hero visual: 'Your technology is world-class, but static imagery can't explain this.'`,
        observation: "Break down the single biggest friction point in their visual communication.",
        relevantWorkReference: "Cut to a 10-second reel clip of relevant PokerStars / MoD motion graphics showing high-end technical clarity.",
        callToAction: "Invite them to review 2 storyboard styleframes developed specifically for their product.",
      },
    };
  },
};
