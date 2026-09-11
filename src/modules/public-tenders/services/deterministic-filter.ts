// src/modules/public-tenders/services/deterministic-filter.ts

export interface FilterResult {
  passed: boolean;
  score: number; // 0 to 100
  matchedKeywords: string[];
  matchedCpvs: string[];
  rejectedReason?: string;
  isNegativeMatch: boolean;
  isExpired: boolean;
  qualification: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
}

const CREATIVE_PHRASES = [
  'motion design',
  'motion graphics',
  '2d animation',
  '3d animation',
  'explainer video',
  'video production',
  'video editing',
  'brand identity',
  'visual identity',
  'brand strategy',
  'graphic design',
  'creative agency',
  'creative studio',
  'creative services',
  'campaign creative',
  'advertising creative',
  'content creation',
  'creative content',
  'digital campaign',
  'marketing campaign',
  'public information campaign',
  'public outreach campaign',
  'internal communications',
  'change communications',
  'information design',
  'presentation design',
  'digital design',
  'website design',
  'interactive digital experiences',
  'training content',
  'education content',
  'social content',
  'art direction',
  'storyboard',
  'infographics',
  'educational video',
];

const CREATIVE_SINGLE_TOKENS = [
  'animation',
  'animator',
  'branding',
  'brand',
  'explainer',
  'film',
  'video',
  'communications',
  'ux',
  'ui',
];

const CREATIVE_CPVS = [
  '79340000', // Advertising and marketing services
  '79341000', // Advertising services
  '79341400', // Advertising campaign services
  '79342000', // Marketing services
  '79342100', // Direct marketing services
  '79822500', // Graphic design services
  '79930000', // Speciality design services
  '79933000', // Design support services
  '79416000', // Public relations services
  '92100000', // Motion picture and video services
  '92110000', // Motion picture and video tape production
  '92111000', // Motion picture/video production
  '92111200', // Advertising, propaganda and information films and videos
  '92111250', // Information film production
  '92111260', // Information video production
  '92112000', // Motion-picture production services
  '72413000', // Website design services
];

const CREATIVE_CPV_PREFIXES = [
  '7934',  // Advertising & marketing
  '798225', // Graphic design
  '7993',  // Speciality design & support
  '79416', // Public relations
  '9210',  // Motion picture & video
  '9211',  // Motion picture & video production
  '72413', // Website design
];

const NEGATIVE_EXCLUSIONS = [
  { pattern: 'cctv', reason: 'Video surveillance / CCTV equipment' },
  { pattern: 'surveillance', reason: 'Surveillance systems' },
  { pattern: 'security camera', reason: 'Security camera hardware' },
  { pattern: 'access control', reason: 'Access control infrastructure' },
  { pattern: 'software licensing', reason: 'Software license procurement' },
  { pattern: 'software license', reason: 'Software license procurement' },
  { pattern: 'sign manufacture', reason: 'Physical sign manufacturing' },
  { pattern: 'sign manufacturing', reason: 'Physical sign manufacturing' },
  { pattern: 'road sign', reason: 'Highway / road signage' },
  { pattern: 'traffic sign', reason: 'Highway / road signage' },
  { pattern: 'web hosting only', reason: 'Pure infrastructure hosting' },
  { pattern: 'server hosting', reason: 'Pure infrastructure hosting' },
  { pattern: 'engineering cad', reason: 'Engineering CAD / structural engineering' },
  { pattern: 'structural 3d', reason: 'Structural 3D engineering' },
  { pattern: 'security guard', reason: 'Manned guarding services' },
  { pattern: 'cleaning services', reason: 'Facilities cleaning' },
  { pattern: 'grounds maintenance', reason: 'Grounds maintenance' },
  { pattern: 'catering services', reason: 'Catering / food supply' },
];

export class DeterministicFilter {
  static evaluate(candidate: {
    title?: string | null;
    description?: string;
    cpvCodes?: string[];
    submissionDeadline?: string | null;
    noticeType?: string;
  }): FilterResult {
    const textToScan = `${candidate.title || ''} ${candidate.description || ''}`.toLowerCase();

    // 1. Negative Exclusions Check
    for (const neg of NEGATIVE_EXCLUSIONS) {
      if (textToScan.includes(neg.pattern)) {
        return {
          passed: false,
          score: 0,
          matchedKeywords: [],
          matchedCpvs: [],
          rejectedReason: `Negative keyword match: ${neg.reason} ('${neg.pattern}')`,
          isNegativeMatch: true,
          isExpired: false,
          qualification: 'REJECT',
        };
      }
    }

    // 2. Expired Deadline Evaluation
    let isExpired = false;
    if (candidate.submissionDeadline) {
      const deadlineDate = new Date(candidate.submissionDeadline).getTime();
      if (!isNaN(deadlineDate) && deadlineDate < Date.now()) {
        isExpired = true;
      }
    }

    // 3. Positive Keywords Match (Phrases + Word-bounded Tokens)
    const matchedKeywords: string[] = [];
    for (const phrase of CREATIVE_PHRASES) {
      if (textToScan.includes(phrase)) {
        matchedKeywords.push(phrase);
      }
    }

    for (const token of CREATIVE_SINGLE_TOKENS) {
      if (new RegExp(`\\b${token}\\b`, 'i').test(textToScan)) {
        if (!matchedKeywords.includes(token)) {
          matchedKeywords.push(token);
        }
      }
    }

    // 4. CPV Codes Match
    const matchedCpvs: string[] = [];
    if (candidate.cpvCodes && candidate.cpvCodes.length > 0) {
      for (const cpv of candidate.cpvCodes) {
        const cleanCpv = cpv.replace(/[^0-9]/g, '');
        const matchesExact = CREATIVE_CPVS.some((c) => cleanCpv.startsWith(c.slice(0, 8)));
        const matchesPrefix = CREATIVE_CPV_PREFIXES.some((p) => cleanCpv.startsWith(p));
        if (matchesExact || matchesPrefix) {
          if (!matchedCpvs.includes(cpv)) {
            matchedCpvs.push(cpv);
          }
        }
      }
    }

    // 5. Scoring & Qualification
    let score = 0;
    score += Math.min(matchedKeywords.length * 25, 60);
    score += Math.min(matchedCpvs.length * 20, 40);

    const passed = matchedKeywords.length > 0 || matchedCpvs.length > 0;

    let qualification: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT' = 'REJECT';
    if (isExpired) {
      qualification = 'REJECT';
    } else if (score >= 50 || matchedKeywords.length >= 2) {
      qualification = 'STRONG';
    } else if (score >= 25 || matchedKeywords.length >= 1 || matchedCpvs.length >= 1) {
      qualification = 'POSSIBLE';
    } else if (passed) {
      qualification = 'WEAK';
    }

    return {
      passed: passed && !isExpired,
      score,
      matchedKeywords,
      matchedCpvs,
      rejectedReason: isExpired ? 'Tender submission deadline has already passed.' : undefined,
      isNegativeMatch: false,
      isExpired,
      qualification,
    };
  }
}
