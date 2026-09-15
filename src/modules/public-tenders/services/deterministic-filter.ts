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
  // Construction & Property Maintenance trades (incidental creative terms do not override primary purpose)
  { pattern: 'property maintenance', reason: 'Property maintenance trades' },
  { pattern: 'housing maintenance', reason: 'Housing maintenance trades' },
  { pattern: 'builder works', reason: 'General builder works' },
  { pattern: 'general builder', reason: 'General builder works' },
  { pattern: 'building works', reason: 'Building works / construction' },
  { pattern: 'plumbing', reason: 'Plumbing and heating trades' },
  { pattern: 'joinery', reason: 'Joinery and carpentry trades' },
  { pattern: 'roofing', reason: 'Roofing and guttering works' },
  { pattern: 'roof repair', reason: 'Roof repair and maintenance' },
  { pattern: 'flat roof repair', reason: 'Roof repair and maintenance' },
  { pattern: 'ground works', reason: 'Ground works and excavation' },
  { pattern: 'groundworks', reason: 'Civil engineering groundworks' },
  { pattern: 'fencing', reason: 'Fencing and perimeter works' },
  { pattern: 'multi-trade', reason: 'Multi-trade construction' },
  { pattern: 'demolition', reason: 'Demolition services' },
  { pattern: 'asbestos', reason: 'Hazardous material remediation' },
  // Agriculture, arboriculture & growing media
  { pattern: 'arboricultural', reason: 'Arboriculture / forestry' },
  { pattern: 'tree planting', reason: 'Tree planting / forestry' },
  { pattern: 'tree surgery', reason: 'Tree surgery / forestry' },
  { pattern: 'growing media', reason: 'Agricultural / horticultural growing media' },
  // Passenger & school transport services
  { pattern: 'passenger assistant', reason: 'Passenger transport services' },
  { pattern: 'taxi and mpv', reason: 'Taxi and MPV transport services' },
  { pattern: 'taxi route', reason: 'Taxi and transport routing' },
  { pattern: 'home to school transport', reason: 'Home to school transport' },
  // Medical imaging & clinical equipment
  { pattern: 'medical imaging', reason: 'Medical imaging equipment / clinical diagnostics' },
  { pattern: 'clinical video', reason: 'Clinical video equipment / endoscopy' },
  { pattern: 'endoscopy', reason: 'Clinical endoscopy equipment' },
  { pattern: 'ultrasound', reason: 'Clinical ultrasound equipment' },
  // Hardware & conferencing equipment supply
  { pattern: 'video conferencing hardware', reason: 'Video conferencing hardware supply' },
  { pattern: 'conferencing hardware', reason: 'Conferencing hardware supply' },
  { pattern: 'broadcast hardware', reason: 'Broadcast hardware supply' },
  { pattern: 'video wall', reason: 'Video wall / display hardware supply' },
  { pattern: 'video walls', reason: 'Video wall / display hardware supply' },
  { pattern: 'control room display', reason: 'Control room display screens / hardware' },
  { pattern: 'control-room display', reason: 'Control room display screens / hardware' },
  { pattern: 'control room screen', reason: 'Control room display screens / hardware' },
  { pattern: 'display hardware', reason: 'Display hardware supply' },
  { pattern: 'av equipment', reason: 'Audio visual / AV hardware supply' },
  { pattern: 'audiovisual equipment', reason: 'Audio visual / AV hardware supply' },
  { pattern: 'audio visual equipment', reason: 'Audio visual / AV hardware supply' },
  { pattern: 'physical equipment supply', reason: 'Physical equipment supply' },
  { pattern: 'hardware supply', reason: 'Physical hardware supply' },
  { pattern: 'hardware installation', reason: 'Hardware installation and maintenance' },
  { pattern: 'display monitor', reason: 'Display monitor hardware' },
  // Construction, Ward Refurbishment & Civil Trades
  { pattern: 'ward refurbishment', reason: 'Hospital ward refurbishment / construction' },
  { pattern: 'building refurbishment', reason: 'Building refurbishment works' },
  { pattern: 'refurbishment works', reason: 'Refurbishment works / construction' },
  { pattern: 'fit-out', reason: 'Interior fit-out / construction' },
  { pattern: 'fit out', reason: 'Interior fit-out / construction' },
  { pattern: 'civil works', reason: 'Civil engineering works' },
  { pattern: 'physical fabrication', reason: 'Physical metal / building fabrication' },
  { pattern: 'mechanical and electrical', reason: 'Mechanical and electrical (M&E) works' },
  { pattern: 'm&e works', reason: 'Mechanical and electrical (M&E) works' },
  // Clinical / Medical equipment
  { pattern: 'diagnostic equipment', reason: 'Clinical diagnostic equipment' },
  { pattern: 'clinical equipment', reason: 'Clinical equipment supply' },
  { pattern: 'medical equipment', reason: 'Medical equipment supply' },
  { pattern: 'patient monitor', reason: 'Patient monitoring equipment' },
  // Digital / Infrastructure false positives
  { pattern: 'it support', reason: 'IT support services' },
  { pattern: 'telecoms', reason: 'Telecommunications services' },
  { pattern: 'telecommunications', reason: 'Telecommunications services' },
  { pattern: 'network infrastructure', reason: 'Network infrastructure' },
  { pattern: 'cyber security hardware', reason: 'Cyber security hardware' },
  { pattern: 'data centre', reason: 'Data centre hosting and infrastructure' },
  // Scientific Research, Laboratory & Pharmaceutical Software
  { pattern: 'high-throughput experimentation', reason: 'Specialist laboratory / scientific software' },
  { pattern: 'hte software', reason: 'Specialist laboratory / scientific software' },
  { pattern: 'drug discovery', reason: 'Pharmaceutical / scientific research software' },
  { pattern: 'scientific software', reason: 'Specialist scientific software' },
  { pattern: 'laboratory software', reason: 'Laboratory software' },
  // Social Work, Youth Intervention & Direct Behaviour Change Workshops
  { pattern: 'youth intervention programme', reason: 'Youth justice / social intervention programme' },
  { pattern: 'youth intervention program', reason: 'Youth justice / social intervention programme' },
  { pattern: 'community justice', reason: 'Community justice / crime reduction programme' },
  { pattern: 'behaviour change workshops', reason: 'Youth work / behavioural workshops' },
  { pattern: 'behavioural workshops', reason: 'Youth work / behavioural workshops' },
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
