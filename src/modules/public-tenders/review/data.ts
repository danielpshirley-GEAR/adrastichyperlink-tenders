import { TenderSummary, TenderRequirement, TenderDocumentItem, EnrichedEvaluationCriterion, ProcurementStage, TenderEnrichment } from '../types/tender';
import { TenderApplication } from '../types/application';
import { SourceMeta } from '../connectors/registry';

export const reviewBuildMeta = {
  environment: 'public-review',
  buildId: 'rev-2026.09.10-v1',
  deployedAt: '2026-09-10T01:05:00Z',
  routes: [
    '/review/today',
    '/review/tenders',
    '/review/tenders/tender-dfe-creative-2026',
    '/review/tenders/068074-2026',
    '/review/applications',
    '/review/applications/app-dfe-01',
    '/review/scan',
    '/review/knowledge',
    '/review/settings',
  ],
};

export interface ReviewTenderDetail extends TenderSummary {
  description: string;
  requirements: TenderRequirement[];
  documents: TenderDocumentItem[];
  evaluationCriteria: (EnrichedEvaluationCriterion | { criterion: string; weightingPercentage: number | null })[];
  bidDecisionState: 'BID' | 'PASS' | 'UNDECIDED';
  procurementStage?: ProcurementStage;
  enrichment?: TenderEnrichment;
}

export const reviewTenders: ReviewTenderDetail[] = [
  {
    id: 'tender-dfe-creative-2026',
    canonicalReference: 'FTS-2026-004812',
    ocid: 'ocds-b5fd17-004812',
    title: 'Creative Campaign Motion Design & Video Production Services',
    plainEnglishSummary:
      'Creation of digital motion design assets, animated explainers, and campaign video content for national education initiatives targeting young adults.',
    description:
      'The Department for Education requires a specialist creative partner to direct, design, animate, and produce a suite of motion assets for national digital campaigns. Services include storyboarding, 2D vector animation, 3D typography, live-action integration, and accessibility subtitling (WCAG 2.2 AA standards).',
    buyerName: 'Department for Education',
    buyerType: 'Central Government',
    valueAmount: 95000,
    valueCurrency: 'GBP',
    valueDescription: '£95,000 max budget (ex VAT)',
    publishedAt: '2026-09-08T09:30:00Z',
    submissionDeadline: '2026-09-28T12:00:00Z',
    clarificationDeadline: '2026-09-18T17:00:00Z',
    daysRemaining: 18,
    qualification: 'STRONG',
    verificationGrade: 'A',
    officialNoticeUrl: 'https://www.find-tender.service.gov.uk/Notice/004812-2026',
    applicationPortalUrl: 'https://education.app.jaggaer.com',
    serviceTags: ['motion', 'animation_2d', 'video', 'public_information', 'campaign'],
    sourceId: 'find-a-tender',
    isArchived: false,
    discoveredAt: '2026-09-08T10:00:00Z',
    lastVerifiedAt: '2026-09-09T22:00:00Z',
    bidDecisionState: 'BID',
    evaluationCriteria: [
      { criterion: 'Quality & Creative Direction', weightingPercentage: 60 },
      { criterion: 'Pricing & Value for Money', weightingPercentage: 30 },
      { criterion: 'Social Value', weightingPercentage: 10 },
    ],
    requirements: [
      {
        id: 'req-1',
        tenderId: 'tender-dfe-creative-2026',
        category: 'insurance',
        requirementName: 'Professional Indemnity Insurance',
        buyerRequirementText: 'Minimum £2,000,000 aggregate cover',
        sourceCitation: 'ITT Specification Clause 4.2',
        adrasticCapabilityText: 'Illustrative Review Cover — £2,000,000 active cover',
        status: 'PASS',
        mandatory: true,
      },
      {
        id: 'req-2',
        tenderId: 'tender-dfe-creative-2026',
        category: 'insurance',
        requirementName: 'Public Liability Insurance',
        buyerRequirementText: 'Minimum £5,000,000 per claim',
        sourceCitation: 'ITT Specification Clause 4.3',
        adrasticCapabilityText: 'Illustrative Review Cover — £5,000,000 active cover',
        status: 'PASS',
        mandatory: true,
      },
      {
        id: 'req-3',
        tenderId: 'tender-dfe-creative-2026',
        category: 'experience',
        requirementName: 'Public-Sector Creative Narrative Experience',
        buyerRequirementText: 'Provide evidence of clear narrative explanation for public policy or educational topics',
        sourceCitation: 'SQ Section B',
        adrasticCapabilityText: 'Demonstrated through Daniel Shirley MoD strategic communication project work',
        status: 'PASS',
        mandatory: true,
      },
      {
        id: 'req-4',
        tenderId: 'tender-dfe-creative-2026',
        category: 'certification',
        requirementName: 'Cyber Essentials',
        buyerRequirementText: 'Cyber Essentials certification required prior to award',
        sourceCitation: 'SQ Section C',
        adrasticCapabilityText: 'Self-assessment complete; verified audit scheduled',
        status: 'ACTION_REQUIRED',
        mandatory: true,
      },
    ],
    documents: [
      {
        id: 'doc-1',
        fileName: 'ITT_Volume_1_Specification.pdf',
        docType: 'itt',
        fileSizeBytes: 2450000,
        fileHash: 'sha256-dfe-itt-01',
        requiresLogin: false,
        versionNumber: 1,
        analysisStatus: 'analyzed',
        lastCheckedAt: '2026-09-08T10:15:00Z',
      },
      {
        id: 'doc-2',
        fileName: 'Evaluation_Matrix_And_Scoring.pdf',
        docType: 'specification',
        fileSizeBytes: 890000,
        fileHash: 'sha256-dfe-eval-01',
        requiresLogin: false,
        versionNumber: 1,
        analysisStatus: 'analyzed',
        lastCheckedAt: '2026-09-08T10:15:00Z',
      },
      {
        id: 'doc-3',
        fileName: 'Standard_Selection_Questionnaire.pdf',
        docType: 'sq',
        fileSizeBytes: 1200000,
        fileHash: 'sha256-dfe-sq-01',
        requiresLogin: false,
        versionNumber: 1,
        analysisStatus: 'analyzed',
        lastCheckedAt: '2026-09-08T10:15:00Z',
      },
    ],
  },
  {
    id: 'tender-ace-branding-2026',
    canonicalReference: 'CF-2026-08914',
    ocid: 'ocds-b5fd17-08914',
    title: 'Brand Identity, Motion Guidelines & Visual Communications Framework',
    plainEnglishSummary:
      'Refresh of digital animation guidelines, social video templates, and cultural event campaign assets.',
    description:
      'Arts Council England seeks an agile creative studio to design modular motion design guidelines, dynamic logo animation toolkits, and reusable After Effects templates for multi-platform public outreach.',
    buyerName: 'Arts Council England',
    buyerType: "Arm's Length Body",
    valueAmount: 140000,
    valueCurrency: 'GBP',
    valueDescription: '£140,000 over 24 months',
    publishedAt: '2026-09-06T11:00:00Z',
    submissionDeadline: '2026-10-04T12:00:00Z',
    clarificationDeadline: '2026-09-24T17:00:00Z',
    daysRemaining: 24,
    qualification: 'STRONG',
    verificationGrade: 'A',
    officialNoticeUrl: 'https://www.contractsfinder.service.gov.uk/Notice/ace-brand-2026-08914',
    serviceTags: ['visual_identity', 'motion', 'brand_strategy', 'graphic_design'],
    sourceId: 'contracts-finder',
    isArchived: false,
    discoveredAt: '2026-09-06T12:00:00Z',
    lastVerifiedAt: '2026-09-09T22:00:00Z',
    bidDecisionState: 'UNDECIDED',
    evaluationCriteria: [
      { criterion: 'Creative Portfolio & Craft', weightingPercentage: 50 },
      { criterion: 'Technical Delivery Model', weightingPercentage: 25 },
      { criterion: 'Commercial Proposal', weightingPercentage: 25 },
    ],
    requirements: [
      {
        id: 'req-ace-1',
        tenderId: 'tender-ace-branding-2026',
        category: 'insurance',
        requirementName: 'Professional Indemnity Insurance',
        buyerRequirementText: 'Minimum £1,000,000 cover',
        sourceCitation: 'Clause 3',
        adrasticCapabilityText: 'Review £2m cover exceeds requirement',
        status: 'PASS',
        mandatory: true,
      },
    ],
    documents: [
      {
        id: 'doc-ace-1',
        fileName: 'ITT_Creative_Brief.pdf',
        docType: 'itt',
        fileSizeBytes: 3100000,
        fileHash: 'sha256-ace-itt-01',
        requiresLogin: false,
        versionNumber: 1,
        analysisStatus: 'analyzed',
        lastCheckedAt: '2026-09-06T12:30:00Z',
      },
    ],
  },
  {
    id: 'tender-nhs-motion-2026',
    canonicalReference: 'ATAMIS-2026-NHS-0192',
    ocid: 'ocds-b5fd17-0192',
    title: 'Patient Information Motion Graphics & Clinical Explainer Video Suite',
    plainEnglishSummary:
      'Development of clear, accessible 2D motion graphics explaining care pathways for patient digital portals.',
    description:
      'NHS England invites proposals from specialist animators to create a series of 12 accessible informational animated videos (60-90 seconds each) explaining patient care transitions and digital consent.',
    buyerName: 'NHS England',
    buyerType: 'NHS Body',
    valueAmount: 60000,
    valueCurrency: 'GBP',
    valueDescription: '£60,000 fixed price',
    publishedAt: '2026-09-07T14:00:00Z',
    submissionDeadline: '2026-09-21T17:00:00Z',
    clarificationDeadline: '2026-09-14T17:00:00Z',
    daysRemaining: 11,
    qualification: 'POSSIBLE',
    verificationGrade: 'A',
    officialNoticeUrl: 'https://health-family.force.com/s/Notice/nhs-patient-info-2026',
    serviceTags: ['motion', 'animation_2d', 'information_design', 'learning_content'],
    sourceId: 'nhs-atamis',
    isArchived: false,
    discoveredAt: '2026-09-07T15:00:00Z',
    lastVerifiedAt: '2026-09-09T22:00:00Z',
    bidDecisionState: 'UNDECIDED',
    evaluationCriteria: [
      { criterion: 'Technical & Accessibility Quality', weightingPercentage: 70 },
      { criterion: 'Price', weightingPercentage: 30 },
    ],
    requirements: [
      {
        id: 'req-nhs-1',
        tenderId: 'tender-nhs-motion-2026',
        category: 'certification',
        requirementName: 'Accessibility Standards Compliance',
        buyerRequirementText: 'WCAG 2.2 AA subtitling and audio description compliance',
        sourceCitation: 'Section 3.1',
        adrasticCapabilityText: 'Studio delivers standard broadcast subcap and descriptive audio',
        status: 'PASS',
        mandatory: true,
      },
    ],
    documents: [
      {
        id: 'doc-nhs-1',
        fileName: 'Clinical_Content_Specification.pdf',
        docType: 'specification',
        fileSizeBytes: 1800000,
        fileHash: 'sha256-nhs-01',
        requiresLogin: true,
        versionNumber: 1,
        analysisStatus: 'analyzed',
        lastCheckedAt: '2026-09-07T15:30:00Z',
      },
    ],
  },
  {
    "id": "068074-2026",
    "canonicalReference": "068074-2026",
    "latestNoticeId": "068074-2026",
    "ocid": "ocds-h6vhtk-06ce78",
    "title": "Aberdeen Destination Marketing and Development Service",
    "plainEnglishSummary": "Aberdeen City Council is seeking market engagement to inform the potential procurement of a city-focused Aberdeen Destination Marketing and Development Service, funded through the Aberdeen Visitor Levy, which is due to apply from 1 April 2027.\nThe pr",
    "description": "Aberdeen City Council is seeking market engagement to inform the potential procurement of a city-focused Aberdeen Destination Marketing and Development Service, funded through the Aberdeen Visitor Levy, which is due to apply from 1 April 2027.\nThe proposed service would support Aberdeen’s position as a leading visitor destination by delivering destination marketing, city promotion, market intelligence, business engagement, product development and visitor economy development activity. It would seek to increase awareness of Aberdeen, grow visitor numbers and length of stay, support accommodation demand, amplify the city’s cultural, events, heritage, hospitality, leisure and business tourism offer, and contribute to the city’s wider economic transition.\nThe service is expected to focus on Aberdeen city while recognising that the wider regional offer — including landscapes, coastline, castles, golf, food and drink, outdoor activity and touring itineraries — forms an important part of the destination proposition. The Council is also interested in how the service should interface with convention bureau and business events activity where this supports additional visitors, bed nights and economic value for the city.\nThis Prior Information Notice is for market engagement only. It is not a call for competition and does not commit the Council to a procurement, contract award or any particular delivery model.",
    "buyerName": "Aberdeen City Council",
    "buyerType": "Local Authority",
    "valueAmount": 900000,
    "valueCurrency": "GBP",
    "valueDescription": "£900,000 max estimated value (funded via Aberdeen Visitor Levy)",
    "publishedAt": "2026-07-20T09:46:35+01:00",
    "submissionDeadline": null,
    "clarificationDeadline": null,
    "daysRemaining": null,
    "qualification": "STRONG",
    "verificationGrade": "A",
    "officialNoticeUrl": "https://www.find-tender.service.gov.uk/Notice/068074-2026",
    "applicationPortalUrl": "https://www.publiccontractsscotland.gov.uk/search/Search_AuthProfile.aspx?ID=AA00231",
    "serviceTags": [
      "marketing",
      "campaign",
      "visual_identity",
      "digital_design",
      "creative_strategy"
    ],
    "sourceId": "find_a_tender",
    "isArchived": false,
    "discoveredAt": "2026-07-20T10:00:00Z",
    "lastVerifiedAt": "2026-09-11T21:12:11.575Z",
    "bidDecisionState": "UNDECIDED",
    "procurementStage": "PRELIMINARY MARKET ENGAGEMENT",
    "requirements": [
      {
        "id": "req-068074-2026-1",
        "tenderId": "068074-2026",
        "category": "insurance",
        "requirementName": "Professional Indemnity Insurance",
        "buyerRequirementText": "Minimum £5,000,000 Professional Indemnity insurance cover",
        "sourceCitation": "Public Procurement Minimum Standards",
        "adrasticCapabilityText": "Existing policy can be upgraded to £5,000,000 upon award confirmation (broker-backed endorsement).",
        "status": "PASS_WITH_ACTION",
        "mandatory": true
      },
      {
        "id": "req-068074-2026-2",
        "tenderId": "068074-2026",
        "category": "insurance",
        "requirementName": "Public Liability Insurance",
        "buyerRequirementText": "Minimum £5,000,000 Public Liability insurance cover",
        "sourceCitation": "Public Procurement Minimum Standards",
        "adrasticCapabilityText": "Standard corporate liability insurance in place; policy upgrade available upon contract award.",
        "status": "PASS_WITH_ACTION",
        "mandatory": true
      },
      {
        "id": "req-068074-2026-3",
        "tenderId": "068074-2026",
        "category": "security",
        "requirementName": "Cyber Essentials / Information Security",
        "buyerRequirementText": "Demonstrated compliance with UK Cyber Essentials or ISO 27001 data governance standards",
        "sourceCitation": "Scottish Public Sector Cyber Resilience Framework",
        "adrasticCapabilityText": "Knowledge Base certification pending confirmation. Supplier action required before formal bid.",
        "status": "ACTION_REQUIRED",
        "mandatory": true
      },
      {
        "id": "req-068074-2026-4",
        "tenderId": "068074-2026",
        "category": "turnover",
        "requirementName": "Financial Turnover & Commercial Scale",
        "buyerRequirementText": "Appropriate financial standing relative to £900,000 contract volume",
        "sourceCitation": "Public Contracts (Scotland) Regulations / ESPD",
        "adrasticCapabilityText": "Due to contract value (£900k), Adrastichyperlink should bid as specialist creative lead in a consortium or partner with an established prime contractor.",
        "status": "PARTNER_REQUIRED",
        "mandatory": false
      },
      {
        "id": "req-068074-2026-5",
        "tenderId": "068074-2026",
        "category": "experience",
        "requirementName": "Public Sector Track Record & Case Studies",
        "buyerRequirementText": "Relevant delivered case studies in destination marketing, public campaigns, or digital brand communications",
        "sourceCitation": "Procurement Specification Standards",
        "adrasticCapabilityText": "Verified creative agency portfolio in motion design, visual campaigns, and digital branding. Prime tourism management case study requires partner augmentation.",
        "status": "PASS_WITH_ACTION",
        "mandatory": true
      }
    ],
    "documents": [
      {
        "id": "doc-068074-2026-fts-notice",
        "fileName": "Find a Tender Official Notice (068074-2026)",
        "docType": "official_notice",
        "sourceUrl": "https://www.find-tender.service.gov.uk/Notice/068074-2026",
        "downloadUrl": "https://www.find-tender.service.gov.uk/Notice/068074-2026",
        "accessState": "PUBLIC",
        "requiresLogin": false,
        "versionNumber": 1,
        "analysisStatus": "analyzed",
        "lastCheckedAt": "2026-09-11T21:12:11.576Z",
        "notes": "Official UK Find a Tender electronic notice release.",
        "fileHash": "FTS-VERIFIED-SHA256"
      },
      {
        "id": "doc-068074-2026-buyer-profile",
        "fileName": "Buyer Procurement Profile & Authority Portal",
        "docType": "buyer_portal",
        "sourceUrl": "https://www.publiccontractsscotland.gov.uk/search/Search_AuthProfile.aspx?ID=AA00231",
        "downloadUrl": "https://www.publiccontractsscotland.gov.uk/search/Search_AuthProfile.aspx?ID=AA00231",
        "accessState": "PUBLIC",
        "requiresLogin": false,
        "versionNumber": 1,
        "analysisStatus": "analyzed",
        "lastCheckedAt": "2026-09-11T21:12:11.576Z",
        "notes": "Public portal for supplier registration and future tender pack releases.",
        "fileHash": "PORTAL-VERIFIED"
      },
      {
        "id": "doc-068074-2026-spec-pending",
        "fileName": "Invitation to Tender (ITT) & Specification Pack",
        "docType": "specification",
        "accessState": "NOT PUBLISHED",
        "requiresLogin": false,
        "versionNumber": 0,
        "analysisStatus": "not_applicable",
        "lastCheckedAt": "2026-09-11T21:12:11.576Z",
        "notes": "Detailed specification has not yet been published. Scheduled for release when formal competition begins.",
        "fileHash": "NOT-YET-PUBLISHED"
      }
    ],
    "evaluationCriteria": [
      {
        "id": "crit-068074-2026-1",
        "criterion": "Evaluation Criteria Not Yet Published",
        "weightingPercentage": null,
        "description": "Detailed award evaluation criteria and quality/price weightings will be published when the formal contract notice and ITT are released.",
        "isPublished": false
      }
    ],
    "enrichment": {
      "tenderId": "068074-2026",
      "canonicalReference": "068074-2026",
      "enrichedAt": "2026-09-11T21:12:11.588Z",
      "procurementStage": "PRELIMINARY MARKET ENGAGEMENT",
      "scopeAndSpec": {
        "whatBuyerWants": "Aberdeen City Council is seeking market engagement to inform the potential procurement of a city-focused Aberdeen Destination Marketing and Development Service, funded through the Aberdeen Visitor Levy.",
        "businessObjective": "Support Aberdeen’s position as a leading visitor destination by delivering destination marketing, city promotion, market intelligence, business engagement, product development and visitor economy development activity, supporting visitor numbers and length of stay.",
        "requiredServices": [
          "Destination marketing and communications",
          "City promotion and campaign development",
          "Visitor economy business engagement",
          "Product and itinerary development",
          "Travel trade support",
          "Market intelligence and performance evaluation"
        ],
        "keyDeliverables": [
          "City-focused leisure and business tourism marketing campaigns",
          "High-impact promotional creative, digital assets, and destination storytelling",
          "Itinerary promotion across culture, heritage, food and drink, events, and festivals",
          "Visitor levy output and outcome impact reporting"
        ],
        "targetAudience": "Leisure travellers, business tourists, event delegates, and regional tourism stakeholders",
        "contractScope": "Aberdeen City Council is seeking market engagement to inform the potential procurement of a city-focused Aberdeen Destination Marketing and Development Service, funded through the Aberdeen Visitor Levy.",
        "locations": [
          "Aberdeen City (Region UKM50)"
        ],
        "duration": "Multi-year programme aligned with Aberdeen Visitor Levy commencement (1 April 2027)",
        "importantDates": [
          {
            "label": "Notice Publication Date",
            "date": "2026-07-20T09:46:35+01:00",
            "description": "Official Find a Tender release date"
          },
          {
            "label": "Anticipated Call for Competition",
            "date": "2026-11-10T00:00:00Z",
            "description": "Indicative date for formal contract notice release"
          },
          {
            "label": "Aberdeen Visitor Levy Application Date",
            "date": "2027-04-01",
            "description": "Date from which funding levy applies in Aberdeen City"
          }
        ],
        "creativeMarketingDigitalOverlap": [
          "Destination branding and visual identity",
          "Multi-channel promotional video, motion design, and digital campaign creative",
          "Digital tourism campaign storytelling, website UX/UI assets, and social campaign content",
          "Visitor impact infographic and visual reporting design"
        ],
        "servicesOutsideCoreCapability": [
          "Convention bureau management and physical conference hosting operations",
          "Direct travel trade booking systems and regional tour operator brokerage"
        ],
        "isDetailedScopePublished": true,
        "scopeNoticeText": "Aberdeen City Council is seeking market engagement to inform the potential procurement of a city-focused Aberdeen Destination Marketing and Development Service, funded through the Aberdeen Visitor Levy."
      },
      "documents": [
        {
          "id": "doc-068074-2026-fts-notice",
          "fileName": "Find a Tender Official Notice (068074-2026)",
          "docType": "official_notice",
          "sourceUrl": "https://www.find-tender.service.gov.uk/Notice/068074-2026",
          "downloadUrl": "https://www.find-tender.service.gov.uk/Notice/068074-2026",
          "accessState": "PUBLIC",
          "requiresLogin": false,
          "versionNumber": 1,
          "analysisStatus": "analyzed",
          "lastCheckedAt": "2026-09-11T21:12:11.576Z",
          "notes": "Official UK Find a Tender electronic notice release.",
          "fileHash": "FTS-VERIFIED-SHA256"
        },
        {
          "id": "doc-068074-2026-buyer-profile",
          "fileName": "Buyer Procurement Profile & Authority Portal",
          "docType": "buyer_portal",
          "sourceUrl": "https://www.publiccontractsscotland.gov.uk/search/Search_AuthProfile.aspx?ID=AA00231",
          "downloadUrl": "https://www.publiccontractsscotland.gov.uk/search/Search_AuthProfile.aspx?ID=AA00231",
          "accessState": "PUBLIC",
          "requiresLogin": false,
          "versionNumber": 1,
          "analysisStatus": "analyzed",
          "lastCheckedAt": "2026-09-11T21:12:11.576Z",
          "notes": "Public portal for supplier registration and future tender pack releases.",
          "fileHash": "PORTAL-VERIFIED"
        },
        {
          "id": "doc-068074-2026-spec-pending",
          "fileName": "Invitation to Tender (ITT) & Specification Pack",
          "docType": "specification",
          "accessState": "NOT PUBLISHED",
          "requiresLogin": false,
          "versionNumber": 0,
          "analysisStatus": "not_applicable",
          "lastCheckedAt": "2026-09-11T21:12:11.576Z",
          "notes": "Detailed specification has not yet been published. Scheduled for release when formal competition begins.",
          "fileHash": "NOT-YET-PUBLISHED"
        }
      ],
      "requirements": [
        {
          "id": "req-068074-2026-1",
          "tenderId": "068074-2026",
          "category": "insurance",
          "requirementName": "Professional Indemnity Insurance",
          "buyerRequirementText": "Minimum £5,000,000 Professional Indemnity insurance cover",
          "sourceCitation": "Public Procurement Minimum Standards",
          "adrasticCapabilityText": "Existing policy can be upgraded to £5,000,000 upon award confirmation (broker-backed endorsement).",
          "status": "PASS_WITH_ACTION",
          "mandatory": true
        },
        {
          "id": "req-068074-2026-2",
          "tenderId": "068074-2026",
          "category": "insurance",
          "requirementName": "Public Liability Insurance",
          "buyerRequirementText": "Minimum £5,000,000 Public Liability insurance cover",
          "sourceCitation": "Public Procurement Minimum Standards",
          "adrasticCapabilityText": "Standard corporate liability insurance in place; policy upgrade available upon contract award.",
          "status": "PASS_WITH_ACTION",
          "mandatory": true
        },
        {
          "id": "req-068074-2026-3",
          "tenderId": "068074-2026",
          "category": "security",
          "requirementName": "Cyber Essentials / Information Security",
          "buyerRequirementText": "Demonstrated compliance with UK Cyber Essentials or ISO 27001 data governance standards",
          "sourceCitation": "Scottish Public Sector Cyber Resilience Framework",
          "adrasticCapabilityText": "Knowledge Base certification pending confirmation. Supplier action required before formal bid.",
          "status": "ACTION_REQUIRED",
          "mandatory": true
        },
        {
          "id": "req-068074-2026-4",
          "tenderId": "068074-2026",
          "category": "turnover",
          "requirementName": "Financial Turnover & Commercial Scale",
          "buyerRequirementText": "Appropriate financial standing relative to £900,000 contract volume",
          "sourceCitation": "Public Contracts (Scotland) Regulations / ESPD",
          "adrasticCapabilityText": "Due to contract value (£900k), Adrastichyperlink should bid as specialist creative lead in a consortium or partner with an established prime contractor.",
          "status": "PARTNER_REQUIRED",
          "mandatory": false
        },
        {
          "id": "req-068074-2026-5",
          "tenderId": "068074-2026",
          "category": "experience",
          "requirementName": "Public Sector Track Record & Case Studies",
          "buyerRequirementText": "Relevant delivered case studies in destination marketing, public campaigns, or digital brand communications",
          "sourceCitation": "Procurement Specification Standards",
          "adrasticCapabilityText": "Verified creative agency portfolio in motion design, visual campaigns, and digital branding. Prime tourism management case study requires partner augmentation.",
          "status": "PASS_WITH_ACTION",
          "mandatory": true
        }
      ],
      "evaluationCriteria": [
        {
          "id": "crit-068074-2026-1",
          "criterion": "Evaluation Criteria Not Yet Published",
          "weightingPercentage": null,
          "description": "Detailed award evaluation criteria and quality/price weightings will be published when the formal contract notice and ITT are released.",
          "isPublished": false
        }
      ],
      "submissionDetails": {
        "procurementStage": "PRELIMINARY MARKET ENGAGEMENT",
        "submissionRoute": "Public Contracts Scotland (PCS) / Direct Authority Market Engagement",
        "submissionPortalUrl": "https://www.publiccontractsscotland.gov.uk/search/Search_AuthProfile.aspx?ID=AA00231",
        "deadline": null,
        "clarificationDeadline": null,
        "buyerContact": {
          "name": "mark bremner",
          "email": "markbremner@aberdeencity.gov.uk",
          "telephone": "+44 1467539600",
          "address": "Woodhill House, Westburn Road, Aberdeen AB16 5GB, United Kingdom"
        },
        "requiredAttachments": [
          "Supplier Market Engagement Response Form (when issued)"
        ],
        "participationInstructions": "This notice is for preliminary market engagement only. It is not a call for competition and does not commit the Council to a procurement. Suppliers should register on Public Contracts Scotland (AA00231) and monitor notice updates ahead of the indicative November 2026 contract notice date.",
        "isOpenForBid": false,
        "isMarketEngagement": true
      },
      "fitAndRisks": {
        "whyAdrastichyperlinkFits": "Adrastichyperlink has elite capability in destination visual identity, high-end motion design, brand strategy, campaign storytelling, and digital promotional content. Perfectly matches the city promotion and creative marketing objectives funded by the Aberdeen Visitor Levy.",
        "whyItMayNotFit": "The £900k contract encompasses broad destination management, travel trade support, and visitor economy operations outside pure creative design. Requires substantial prime contractor administrative bandwidth.",
        "riskFactors": [
          "Procurement is at preliminary market engagement stage; specifications and delivery model subject to Council approvals.",
          "Requires partnering with a tourism management consultancy or regional stakeholder to fulfill travel trade and operational scope.",
          "Visitor levy funding is tied to implementation schedule commencing 1 April 2027."
        ],
        "partneringRecommendation": "PARTNER / CONSORTIUM ROUTE: Adrastichyperlink should position as the Creative, Branding & Digital Motion Lead partnering with an established Scottish tourism/destination management consultancy as Prime Contractor."
      },
      "sourceEvidence": [
        {
          "id": "ev-068074-2026-1",
          "topic": "Procurement Stage & Notice Type",
          "fact": "Prior Information Notice (PIN) for Preliminary Market Engagement; not a call for competition",
          "source": "Find a Tender OCDS release 068074-2026 (tag: [\"planning\"])",
          "sourceType": "OFFICIAL_OCDS_NOTICE",
          "confidence": "VERIFIED"
        },
        {
          "id": "ev-068074-2026-2",
          "topic": "Contract Value & Funding Mechanism",
          "fact": "£900,000 GBP (Funded via Aberdeen Visitor Levy)",
          "source": "Find a Tender OCDS release: tender.value.amount (900000)",
          "sourceType": "OFFICIAL_OCDS_NOTICE",
          "confidence": "VERIFIED"
        },
        {
          "id": "ev-068074-2026-3",
          "topic": "Buyer Legal Entity & Contact Point",
          "fact": "Aberdeen City Council (Contact: mark bremner, markbremner@aberdeencity.gov.uk)",
          "source": "Find a Tender OCDS release: parties[0]",
          "sourceType": "OFFICIAL_OCDS_NOTICE",
          "confidence": "VERIFIED"
        },
        {
          "id": "ev-068074-2026-4",
          "topic": "Indicative Future Competition Date",
          "fact": "Future notice date: 2026-11-10T00:00:00Z",
          "source": "Find a Tender OCDS release: tender.communication.futureNoticeDate",
          "sourceType": "OFFICIAL_OCDS_NOTICE",
          "confidence": "VERIFIED"
        },
        {
          "id": "ev-068074-2026-5",
          "topic": "Delivery Location & Region",
          "fact": "Aberdeen City (Region: UKM50)",
          "source": "Find a Tender OCDS release: tender.items[0].deliveryLocation",
          "sourceType": "OFFICIAL_OCDS_NOTICE",
          "confidence": "VERIFIED"
        }
      ]
    }
  },
];

export const reviewApplications: TenderApplication[] = [
  {
    id: 'app-dfe-01',
    tenderId: 'tender-dfe-creative-2026',
    tenderTitle: 'Creative Campaign Motion Design & Video Production Services',
    canonicalReference: 'FTS-2026-004812',
    buyerName: 'Department for Education',
    submissionDeadline: '2026-09-28T12:00:00Z',
    daysRemaining: 18,
    status: 'DRAFT',
    bidDecision: 'BID',
    overallSuitabilityScore: 92,
    winThemes: [
      'Direct senior creative direction by Daniel Shirley with zero junior agency handoff',
      'Proven public-interest storytelling & high-information density animation',
      'Strict WCAG 2.2 AA accessibility workflow embedded from storyboard phase',
      'Agile studio overhead delivering high production value within the £95k budget',
    ],
    questionsCount: 3,
    factsRequiredCount: 1,
    lastUpdated: '2026-09-09T18:45:00Z',
    questions: [
      {
        id: 'q-1',
        sectionName: 'Technical Capability',
        questionNumber: 'Q1',
        questionText:
          'Please describe your studio capability, creative direction approach, and motion graphics production workflow for national educational campaigns (Maximum 750 words).',
        maxWordCount: 750,
        currentWordCount: 382,
        status: 'READY',
        groundedCitations: [
          'Knowledge Base: Adrastichyperlink Company Profile',
          'Knowledge Base: MoD Strategic Communications Experience',
          'Knowledge Base: Motion Production Pipeline Standard',
        ],
        factsRequired: [],
        draftedAnswer:
          'Adrastichyperlink is a specialist creative studio and motion direction partner led by founder Daniel Shirley. We combine senior creative direction with bespoke motion design to translate complex public policy and educational concepts into lucid, engaging visual narratives.\n\nOur production pipeline operates across four disciplined phases:\n1. Discovery & Narrative Strategy: In-depth deconstruction of core educational objectives to determine precise visual metaphors and audience retention drivers.\n2. Conceptual Design & Styleframes: Development of distinctive color palettes, bespoke character and vector visual styles, and comprehensive storyboards.\n3. Production & Motion Craft: High-fidelity 2D/3D animation executed with precise timing, cinematic rhythm, and integrated typographic hierarchy.\n4. Accessible Delivery: Embedded captions, transcript synchronization, and broadcast-ready multi-aspect format exports compliant with WCAG 2.2 AA standards.\n\nBy operating as a lean, senior-led studio, Daniel Shirley directly directs and animates every deliverable, eliminating multi-layered agency account overhead and guaranteeing artistic consistency and rapid iteration.',
      },
      {
        id: 'q-2',
        sectionName: 'Quality Assurance & Risk',
        questionNumber: 'Q2',
        questionText:
          'Outline your quality assurance procedures, client review cadence, and contingency management for time-critical public campaign launches (Maximum 500 words).',
        maxWordCount: 500,
        currentWordCount: 265,
        status: 'READY',
        groundedCitations: [
          'Knowledge Base: Quality Management Protocol',
          'Knowledge Base: Professional Indemnity & Security Setup',
        ],
        factsRequired: [],
        draftedAnswer:
          'Quality assurance is built into every milestone through structured review gates. At the Animatic stage, timing and narrative flow are locked before asset rendering commences, preventing downstream rework.\n\nWe maintain automated off-site version control, redundant cloud rendering nodes, and secure client review links with frame-accurate timecode feedback. Technical deliverables undergo rigorous audio mastering (-14 LUFS broadcast standard), color gamut calibration (Rec.709), and automated accessibility contrast checks before sign-off.',
      },
      {
        id: 'q-3',
        sectionName: 'Social Value',
        questionNumber: 'Q3',
        questionText:
          'Demonstrate how your delivery model creates measurable social value, with emphasis on educational outreach, skills development, or environmental sustainability (Maximum 500 words).',
        maxWordCount: 500,
        currentWordCount: 142,
        status: 'FACTS_REQUIRED',
        groundedCitations: ['Knowledge Base: Environmental & Remote Studio Policy'],
        factsRequired: [
          'Specific commitment on hours dedicated to mentoring creative students or young adults from underrepresented backgrounds.',
        ],
        draftedAnswer:
          'Adrastichyperlink operates as a 100% cloud-native, remote studio with near-zero commuting carbon impact and optimized server utilization.\n\nTo directly align with the Department for Education\'s social value priorities, Daniel Shirley commits to providing structured creative portfolio reviews and digital motion design mentoring sessions during the contract lifecycle.\n\n[ACTION REQUIRED: Confirm exact number of mentoring hours and target educational partners before final submission].',
      },
    ],
  },
];

export const reviewTodayData = {
  greeting: 'Good morning, Daniel.',
  summary: 'Operational summary of UK creative procurement, active applications, and immediate deadlines.',
  qualifiedTendersCount: 3,
  activeApplicationsCount: 1,
  missingInformationCount: 1,
  immediateActions: [
    {
      id: 'act-1',
      title: 'Confirm mentoring hours for DfE Social Value Question',
      description: 'Social Value section requires 1 confirmed commitment figure before bid lock.',
      deadline: '18 days remaining',
      priority: 'HIGH',
      href: '/review/applications/app-dfe-01',
      badge: 'FACTS REQUIRED',
    },
    {
      id: 'act-2',
      title: 'Review Arts Council England Visual Communications Tender',
      description: 'Strong match (£140,000 value). ITT brief analyzed and ready for bid evaluation.',
      deadline: '24 days remaining',
      priority: 'MEDIUM',
      href: '/review/tenders/tender-ace-branding-2026',
      badge: 'EVALUATE BID',
    },
  ],
};

export const reviewSources: SourceMeta[] = [
  {
    id: 'find-a-tender',
    name: 'Find a Tender (FTS)',
    portalType: 'High-value UK public sector (>£138k/£140k)',
    baseUrl: 'https://www.find-tender.service.gov.uk',
    health: 'healthy',
    lastScanAt: '2026-09-09T07:00:00Z',
    noticesChecked: 342,
    relevantFound: 8,
    scanFrequency: 'Mon, Wed, Fri 07:00',
  },
  {
    id: 'contracts-finder',
    name: 'Contracts Finder',
    portalType: 'England & non-devolved (>£12k central, >£30k local)',
    baseUrl: 'https://www.contractsfinder.service.gov.uk',
    health: 'healthy',
    lastScanAt: '2026-09-09T07:05:00Z',
    noticesChecked: 512,
    relevantFound: 14,
    scanFrequency: 'Mon, Wed, Fri 07:00',
  },
  {
    id: 'public-contracts-scotland',
    name: 'Public Contracts Scotland (PCS)',
    portalType: 'Scottish public procurement',
    baseUrl: 'https://www.publiccontractsscotland.gov.uk',
    health: 'healthy',
    lastScanAt: '2026-09-09T07:10:00Z',
    noticesChecked: 184,
    relevantFound: 3,
    scanFrequency: 'Mon, Wed, Fri 07:00',
  },
  {
    id: 'sell2wales',
    name: 'Sell2Wales',
    portalType: 'Welsh public procurement',
    baseUrl: 'https://www.sell2wales.gov.wales',
    health: 'healthy',
    lastScanAt: '2026-09-09T07:12:00Z',
    noticesChecked: 96,
    relevantFound: 2,
    scanFrequency: 'Mon, Wed, Fri 07:00',
  },
  {
    id: 'nhs-atamis',
    name: 'NHS Commercial Solutions / Atamis',
    portalType: 'NHS healthcare & health communication tenders',
    baseUrl: 'https://health-family.force.com/s/Welcome',
    health: 'healthy',
    lastScanAt: '2026-09-09T07:15:00Z',
    noticesChecked: 215,
    relevantFound: 5,
    scanFrequency: 'Mon, Wed, Fri 07:00',
  },
  {
    id: 'etendersni',
    name: 'eTendersNI',
    portalType: 'Northern Ireland public procurement',
    baseUrl: 'https://etendersni.gov.uk',
    health: 'healthy',
    lastScanAt: '2026-09-09T07:18:00Z',
    noticesChecked: 68,
    relevantFound: 1,
    scanFrequency: 'Mon, Wed, Fri 07:00',
  },
  {
    id: 'mod-dsp',
    name: 'MOD Defence Sourcing Portal (DSP)',
    portalType: 'Defence and security procurement',
    baseUrl: 'https://contracts.mod.uk',
    health: 'healthy',
    lastScanAt: '2026-09-09T07:20:00Z',
    noticesChecked: 74,
    relevantFound: 2,
    scanFrequency: 'Mon, Wed, Fri 07:00',
  },
];
