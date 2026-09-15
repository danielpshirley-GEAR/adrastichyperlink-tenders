// src/modules/public-tenders/config/relevance-taxonomy.ts

export interface CpvTaxonomyItem {
  code: string;
  name: string;
  category: CpvCategory;
  isPrimary: boolean;
}

export type CpvCategory =
  | 'ADVERTISING_MARKETING'
  | 'DESIGN_BRANDING'
  | 'VIDEO_MOTION'
  | 'DIGITAL_WEB'
  | 'PR_COMMUNICATIONS'
  | 'CONTENT_WRITING'
  | 'EVENTS_PHOTOGRAPHY'
  | 'SECONDARY_CREATIVE';

export const CPV_CATEGORIES: { id: CpvCategory; label: string }[] = [
  { id: 'ADVERTISING_MARKETING', label: 'Advertising & Marketing' },
  { id: 'DESIGN_BRANDING', label: 'Design & Branding' },
  { id: 'VIDEO_MOTION', label: 'Video & Motion' },
  { id: 'DIGITAL_WEB', label: 'Digital & Web' },
  { id: 'PR_COMMUNICATIONS', label: 'PR & Communications' },
  { id: 'CONTENT_WRITING', label: 'Content & Writing' },
  { id: 'EVENTS_PHOTOGRAPHY', label: 'Events & Photography' },
  { id: 'SECONDARY_CREATIVE', label: 'Secondary Creative' },
];

export const CREATIVE_CPV_TAXONOMY: CpvTaxonomyItem[] = [
  // 1. ADVERTISING & MARKETING (PRIMARY)
  { code: '79340000', name: 'Advertising and marketing services', category: 'ADVERTISING_MARKETING', isPrimary: true },
  { code: '79341000', name: 'Advertising services', category: 'ADVERTISING_MARKETING', isPrimary: true },
  { code: '79341100', name: 'Advertising consultancy services', category: 'ADVERTISING_MARKETING', isPrimary: true },
  { code: '79341200', name: 'Advertising management services', category: 'ADVERTISING_MARKETING', isPrimary: true },
  { code: '79341400', name: 'Advertising campaign services', category: 'ADVERTISING_MARKETING', isPrimary: true },
  { code: '79342000', name: 'Marketing services', category: 'ADVERTISING_MARKETING', isPrimary: true },
  { code: '79342100', name: 'Direct marketing services', category: 'ADVERTISING_MARKETING', isPrimary: true },
  { code: '79342200', name: 'Promotional services', category: 'ADVERTISING_MARKETING', isPrimary: true },
  { code: '79413000', name: 'Marketing management consultancy services', category: 'ADVERTISING_MARKETING', isPrimary: true },

  // 2. DESIGN & BRANDING (PRIMARY)
  { code: '79822500', name: 'Graphic design services', category: 'DESIGN_BRANDING', isPrimary: true },
  { code: '79415200', name: 'Design consultancy services', category: 'DESIGN_BRANDING', isPrimary: true },
  { code: '79930000', name: 'Speciality design services', category: 'DESIGN_BRANDING', isPrimary: true },
  { code: '79933000', name: 'Design support services', category: 'DESIGN_BRANDING', isPrimary: true },

  // 3. VIDEO & MOTION (PRIMARY)
  { code: '92100000', name: 'Motion picture and video services', category: 'VIDEO_MOTION', isPrimary: true },
  { code: '92110000', name: 'Motion picture and video production and related services', category: 'VIDEO_MOTION', isPrimary: true },
  { code: '92111000', name: 'Motion picture and video production services', category: 'VIDEO_MOTION', isPrimary: true },
  { code: '92111200', name: 'Advertising, propaganda and information film and video production', category: 'VIDEO_MOTION', isPrimary: true },
  { code: '92111210', name: 'Advertising film production', category: 'VIDEO_MOTION', isPrimary: true },
  { code: '92111250', name: 'Information film production', category: 'VIDEO_MOTION', isPrimary: true },
  { code: '92111260', name: 'Information video production', category: 'VIDEO_MOTION', isPrimary: true },
  { code: '92112000', name: 'Services in connection with motion-picture and video-tape production', category: 'VIDEO_MOTION', isPrimary: true },

  // 4. DIGITAL & WEB (PRIMARY)
  { code: '72413000', name: 'Website design services', category: 'DIGITAL_WEB', isPrimary: true },

  // 5. PR & COMMUNICATIONS (PRIMARY)
  { code: '79416000', name: 'Public relations services', category: 'PR_COMMUNICATIONS', isPrimary: true },
  { code: '79416100', name: 'Public relations management services', category: 'PR_COMMUNICATIONS', isPrimary: true },
  { code: '79416200', name: 'Public relations consultancy services', category: 'PR_COMMUNICATIONS', isPrimary: true },

  // 6. CONTENT & WRITING (PRIMARY)
  { code: '92312211', name: 'Writing agency services', category: 'CONTENT_WRITING', isPrimary: true },

  // 7. EVENTS & PHOTOGRAPHY (SECONDARY)
  { code: '79952000', name: 'Event services', category: 'EVENTS_PHOTOGRAPHY', isPrimary: false },
  { code: '79960000', name: 'Photographic and ancillary services', category: 'EVENTS_PHOTOGRAPHY', isPrimary: false },
  { code: '79961000', name: 'Photographic services', category: 'EVENTS_PHOTOGRAPHY', isPrimary: false },

  // 8. SECONDARY CREATIVE (PRINTING & PUBLISHING)
  { code: '79800000', name: 'Printing and related services', category: 'SECONDARY_CREATIVE', isPrimary: false },
  { code: '79970000', name: 'Publishing services', category: 'SECONDARY_CREATIVE', isPrimary: false },
];

export const CREATIVE_CPV_MAP: Record<string, CpvTaxonomyItem> = Object.fromEntries(
  CREATIVE_CPV_TAXONOMY.map((item) => [item.code, item])
);

export const CREATIVE_CPV_CODES: string[] = CREATIVE_CPV_TAXONOMY.map((item) => item.code);

export const CREATIVE_CPV_PREFIXES: string[] = [
  '7934',   // Advertising & marketing
  '798225', // Graphic design
  '7993',   // Speciality design
  '794152', // Design consultancy
  '79416',  // Public relations
  '9210',   // Motion picture & video
  '9211',   // Video production
  '923122', // Writing agency
  '72413',  // Website design
];

// Expanded creative keyword vocabulary (discovery signals for recall)
export const DISCOVERY_KEYWORD_PHRASES: string[] = [
  'motion design',
  'motion graphics',
  '2d animation',
  '3d animation',
  'video production',
  'film production',
  'filming services',
  'video editing',
  'post production',
  'creative agency',
  'design agency',
  'creative services',
  'creative development',
  'graphic design',
  'design services',
  'design consultancy',
  'design support',
  'brand strategy',
  'rebranding services',
  'visual identity',
  'brand identity',
  'campaign creative',
  'campaign development',
  'advertising campaign',
  'marketing services',
  'marketing campaign',
  'creative marketing',
  'marketing communications',
  'public information',
  'internal communications',
  'behaviour change',
  'behaviour change campaign',
  'digital content',
  'content production',
  'content creation',
  'social content',
  'social-first',
  'social media creative',
  'website design',
  'web design',
  'digital design',
  'interactive digital',
  'digital experience',
  'information design',
  'annual report design',
  'publication design',
  'presentation design',
  'creative writing',
  'writing agency',
  'event creative',
  'experiential media',
  'exhibition media',
  'digital media',
  'projection mapping',
  'immersive experience',
  'interpretation design',
  'explainer video',
  'marketing & communications',
  'dynamic market intention',
  'dynamic market',
  'creative studio',
  'public outreach campaign',
  'change communications',
  'art direction',
  'storyboarding',
  'educational video',
];

export const DISCOVERY_SINGLE_TOKENS: string[] = [
  'animation',
  'animator',
  'animated',
  'branding',
  'brand',
  'videography',
  'filming',
  'rebranding',
  'advertising',
  'marketing',
  'communications',
  'copywriting',
  'infographics',
  'ux/ui',
  'ux',
  'ui',
];

// Primary-purpose exclusions to prevent false positives
export interface NegativeExclusionRule {
  pattern: string;
  reason: string;
  isWordBoundary?: boolean;
}

export const NEGATIVE_PRIMARY_PURPOSE_EXCLUSIONS: NegativeExclusionRule[] = [
  // 1. Surveillance and CCTV
  { pattern: 'cctv', reason: 'Video surveillance / CCTV equipment' },
  { pattern: 'surveillance', reason: 'Surveillance systems and security' },
  { pattern: 'security camera', reason: 'Security camera hardware' },
  { pattern: 'access control', reason: 'Access control infrastructure' },

  // 2. Hardware and Control Room displays
  { pattern: 'video wall', reason: 'Video wall / display hardware equipment' },
  { pattern: 'control room display', reason: 'Control room screen hardware' },
  { pattern: 'av hardware supply', reason: 'Audio visual hardware supply / install only' },

  // 3. Clinical & Medical imaging
  { pattern: 'medical imaging', reason: 'Medical imaging and radiology' },
  { pattern: 'clinical video', reason: 'Clinical video equipment / endoscopy' },
  { pattern: 'patient monitor', reason: 'Patient monitoring hardware' },
  { pattern: 'radiology', reason: 'Radiology / medical scanning' },
  { pattern: 'ultrasound', reason: 'Ultrasound medical systems' },

  // 4. Scientific & Drug Discovery software
  { pattern: 'high-throughput experimentation', reason: 'Laboratory high-throughput experimentation (HTE)' },
  { pattern: 'drug discovery', reason: 'Pharmaceutical drug discovery software' },
  { pattern: 'laboratory software', reason: 'Scientific laboratory software' },
  { pattern: 'scientific software', reason: 'Scientific research computing' },
  { pattern: 'chemical analysis', reason: 'Chemical analysis instrumentation' },

  // 5. Civil Works, Facilities & Construction
  { pattern: 'ward refurbishment', reason: 'Hospital ward refurbishment / construction' },
  { pattern: 'roofing', reason: 'Roofing and structural repair' },
  { pattern: 'flat roof', reason: 'Roof replacement works' },
  { pattern: 'asbestos', reason: 'Asbestos survey and removal' },
  { pattern: 'civil engineering', reason: 'Civil engineering works' },
  { pattern: 'construction works', reason: 'Physical building and construction works' },
  { pattern: 'electrical installation', reason: 'Electrical infrastructure' },
  { pattern: 'plumbing works', reason: 'Plumbing infrastructure' },
  { pattern: 'building refurbishment', reason: 'General building refurbishment' },

  // 6. Transport & Logistics
  { pattern: 'passenger transport', reason: 'Passenger transport and bus routes' },
  { pattern: 'taxi service', reason: 'Taxi and private hire transport' },
  { pattern: 'home to school transport', reason: 'School transport services' },
  { pattern: 'passenger assistant', reason: 'Passenger assistant transport' },

  // 7. Non-creative social intervention delivery
  { pattern: 'youth intervention programme', reason: 'Youth justice / social intervention delivery' },
  { pattern: 'community justice', reason: 'Community justice behaviour change delivery' },

  // 8. Signage installation only (without design / wayfinding)
  { pattern: 'signage manufacture and installation', reason: 'Signage manufacturing and installation only' },
  { pattern: 'traffic sign supply', reason: 'Traffic sign manufacturing supply' },

  // 9. IT Infrastructure & Telecoms
  { pattern: 'telephony', reason: 'Telephony infrastructure' },
  { pattern: 'leased lines', reason: 'Network data lines' },
  { pattern: 'broadband connectivity', reason: 'Broadband network infrastructure' },
];
