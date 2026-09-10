export type ApplicationStatus = "DRAFT" | "READY_FOR_REVIEW" | "SUBMITTED";
export type QuestionStatus = "DRAFT" | "READY" | "FACTS_REQUIRED";

export interface ApplicationQuestion {
  id: string;
  sectionName: string;
  questionNumber: string;
  questionText: string;
  maxWordCount: number;
  currentWordCount: number;
  draftedAnswer: string;
  status: QuestionStatus;
  groundedCitations: string[];
  factsRequired: string[];
}

export interface TenderApplication {
  id: string;
  tenderId: string;
  tenderTitle: string;
  canonicalReference: string;
  buyerName: string;
  submissionDeadline: string;
  daysRemaining: number;
  status: ApplicationStatus;
  bidDecision: "BID";
  overallSuitabilityScore: number;
  winThemes: string[];
  questionsCount: number;
  factsRequiredCount: number;
  lastUpdated: string;
  questions: ApplicationQuestion[];
}
