// src/modules/public-tenders/services/deterministic-filter.ts

export interface FilterResult {
  passed: boolean;
  score: number; // 0 to 100
  matchedKeywords: string[];
  matchedCpvs: string[];
  rejectedReason?: string;
  isNegativeMatch: boolean;
  qualification: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT';
}

const CREATIVE_KEYWORDS = [
  'motion design',
  'motion graphics',
  'animation',
  '2d animation',
  '3d animation',
  'explainer video',
  'video production',
  'brand identity',
  'visual identity',
  'branding',
  'brand strategy',
  'graphic design',
  'creative agency',
  'creative studio',
  'creative campaign',
  'content creation',
  'creative content',
  'digital campaign',
  'infographics',
  'art direction',
  'storyboard',
  'media planning',
  'media buying',
  'public outreach campaign',
  'educational video',
];

const CREATIVE_CPVS = [
  '79000000', // Business services
  '79340000', // Advertising and marketing services
  '79341000', // Advertising services
  '79341400', // Advertising campaign services
  '79822500', // Graphic design services
  '92110000', // Motion picture and video tape production
  '92111000', // Motion picture and video tape production services
  '92111200', // Advertising, propaganda and information films and videos
  '92111250', // Information film-production services
  '92111260', // Training film-production services
  '92112000', // Motion-picture production services
  '72413000', // Website design services
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
  { pattern: 'engineering cad', reason: 'Engineering CAD / structural engineering' },
  { pattern: 'structural 3d', reason: 'Structural 3D engineering' },
  { pattern: 'security guard', reason: 'Manned guarding services' },
  { pattern: 'cleaning services', reason: 'Facilities cleaning' },
  { pattern: 'grounds maintenance', reason: 'Grounds maintenance' },
];

export class DeterministicFilter {
  static evaluate(candidate: {
    title?: string | null;
    description?: string;
    cpvCodes?: string[];
    submissionDeadline?: string;
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
          qualification: 'REJECT',
        };
      }
    }

    // 2. Expired Deadline Check
    if (candidate.submissionDeadline) {
      const deadlineDate = new Date(candidate.submissionDeadline).getTime();
      if (!isNaN(deadlineDate) && deadlineDate < Date.now()) {
        return {
          passed: false,
          score: 0,
          matchedKeywords: [],
          matchedCpvs: [],
          rejectedReason: 'Tender submission deadline has already passed.',
          isNegativeMatch: false,
          qualification: 'REJECT',
        };
      }
    }

    // 3. Positive Keywords Match
    const matchedKeywords: string[] = [];
    for (const kw of CREATIVE_KEYWORDS) {
      if (textToScan.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }

    // 4. CPV Codes Match
    const matchedCpvs: string[] = [];
    if (candidate.cpvCodes && candidate.cpvCodes.length > 0) {
      for (const cpv of candidate.cpvCodes) {
        const cleanCpv = cpv.replace(/[^0-9]/g, '');
        if (CREATIVE_CPVS.some((c) => cleanCpv.startsWith(c.slice(0, 4)))) {
          matchedCpvs.push(cpv);
        }
      }
    }

    // 5. Scoring & Qualification
    let score = 0;
    score += Math.min(matchedKeywords.length * 25, 60);
    score += Math.min(matchedCpvs.length * 20, 40);

    const passed = matchedKeywords.length > 0 || matchedCpvs.length > 0;

    let qualification: 'STRONG' | 'POSSIBLE' | 'WEAK' | 'REJECT' = 'REJECT';
    if (score >= 50 || matchedKeywords.length >= 2) {
      qualification = 'STRONG';
    } else if (score >= 25 || matchedKeywords.length >= 1 || matchedCpvs.length >= 1) {
      qualification = 'POSSIBLE';
    } else if (passed) {
      qualification = 'WEAK';
    }

    return {
      passed,
      score,
      matchedKeywords,
      matchedCpvs,
      isNegativeMatch: false,
      qualification,
    };
  }
}
