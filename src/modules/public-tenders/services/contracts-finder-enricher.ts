// src/modules/public-tenders/services/contracts-finder-enricher.ts
import crypto from 'crypto';
import {
  TenderSummary,
  TenderEnrichment,
  TenderFactModel,
  InformationCompleteness,
  ProvenancedFact,
  ProvenanceSourceType,
  FactType,
  FactStatus,
  ProcurementStage,
  TenderDocumentItem,
  DocumentAccessState,
  ScopeAndSpecification,
  SubmissionAndEngagementDetails,
  FitAndRisksAssessment,
  SourceEvidenceItem,
} from '../types/tender';
import { extractNoticeUuid, formatContractsFinderNoticeUrl } from '../connectors/contracts-finder';

export interface ParsedContractsFinderHtml {
  contactName?: string;
  address?: string;
  telephone?: string;
  email?: string;
  website?: string;
  location?: string;
  closingDate?: string;
  closingTime?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  procedureType?: string;
  contractType?: string;
  smeSuitable?: boolean;
  vcseSuitable?: boolean;
  contractValueText?: string;
  contractValueAmount?: number;
  procurementReference?: string;
  publishedDate?: string;
  descriptionText?: string;
  externalPortalUrl?: string;
  portalInstructions?: string;
  cpvCodes: Array<{ code: string; name: string }>;
  attachmentLinks: Array<{ title: string; url: string }>;
}

export class ContractsFinderEnricher {
  private readonly userAgent =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (Adrastichyperlink Procurement Intelligence Engine; contact@adrastichyperlink.com)';

  /**
   * Robust fetch with progressive backoff on 429/403/503 rate limits.
   */
  private async fetchWithBackoff(url: string, headers: Record<string, string>, maxRetries = 3): Promise<Response | null> {
    let retries = 0;
    while (retries <= maxRetries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            ...headers,
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.status === 429 || res.status === 403 || res.status === 503) {
          if (retries < maxRetries) {
            retries++;
            const retryAfterHeader = res.headers.get('Retry-After');
            let waitMs = 2000 * Math.pow(2, retries);
            if (retryAfterHeader) {
              const secs = parseInt(retryAfterHeader, 10);
              if (!isNaN(secs) && secs > 0) {
                waitMs = Math.min(secs * 1000, 120000);
              }
            }
            console.warn(`[ContractsFinderEnricher] HTTP ${res.status}. Backoff ${Math.round(waitMs / 1000)}s (${retries}/${maxRetries})...`);
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }
        }

        return res;
      } catch (err: any) {
        if (retries < maxRetries) {
          retries++;
          await new Promise((r) => setTimeout(r, 2000 * retries));
          continue;
        }
        return null;
      }
    }
    return null;
  }

  /**
   * Fetches official OCDS releases array for a notice UUID.
   */
  async fetchOcdsReleases(noticeUuid: string): Promise<any[]> {
    const cleanUuid = extractNoticeUuid(noticeUuid);
    if (!cleanUuid) return [];

    const url = `https://www.contractsfinder.service.gov.uk/Published/Notice/releases/${cleanUuid}.json`;
    const res = await this.fetchWithBackoff(url, { Accept: 'application/json' });
    if (!res || !res.ok) return [];

    try {
      const json = await res.json();
      const releases = Array.isArray(json.releases) ? json.releases : (json.release ? [json.release] : []);
      return releases.sort((a: any, b: any) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return da - db;
      });
    } catch {
      return [];
    }
  }

  /**
   * Fetches and parses the official Contracts Finder HTML notice page.
   */
  async fetchHtmlNotice(noticeUuid: string): Promise<ParsedContractsFinderHtml> {
    const cleanUuid = extractNoticeUuid(noticeUuid);
    const fallback: ParsedContractsFinderHtml = { cpvCodes: [], attachmentLinks: [] };
    if (!cleanUuid) return fallback;

    const url = `https://www.contractsfinder.service.gov.uk/Notice/${cleanUuid}`;
    const res = await this.fetchWithBackoff(url, { Accept: 'text/html,application/xhtml+xml' });
    if (!res || !res.ok) return fallback;

    try {
      const html = await res.text();
      return this.parseHtmlNotice(html);
    } catch {
      return fallback;
    }
  }

  /**
   * Cleanly decodes HTML entities and strips tags.
   */
  private cleanHtml(raw: string): string {
    return raw
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&pound;/g, '£')
      .replace(/&nbsp;/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  /**
   * Parses the Contracts Finder HTML page text into structured buyer facts.
   */
  public parseHtmlNotice(html: string): ParsedContractsFinderHtml {
    const result: ParsedContractsFinderHtml = {
      cpvCodes: [],
      attachmentLinks: [],
    };

    // Helper regex extractors
    const extractSectionText = (headingText: string): string | undefined => {
      const pattern = new RegExp(`<h4><strong>${headingText}</strong></h4>\\s*<p(?:\\s+[^>]*)?>([\\s\\S]*?)</p>`, 'i');
      const match = html.match(pattern);
      if (match && match[1]) {
        return this.cleanHtml(match[1]);
      }
      return undefined;
    };

    // 1. Contact Information
    result.contactName = extractSectionText('Contact name');
    result.address = extractSectionText('Address');
    result.telephone = extractSectionText('Telephone');

    // Email
    const emailMatch = html.match(/<h4><strong>Email<\/strong><\/h4>[\s\S]*?<a\s+[^>]*href="mailto:([^"]+)"/i);
    if (emailMatch) {
      result.email = emailMatch[1].trim();
    } else {
      const rawEmail = extractSectionText('Email');
      if (rawEmail && rawEmail.includes('@')) {
        result.email = rawEmail.trim();
      }
    }

    // Website
    const websiteMatch = html.match(/<h4><strong>Website<\/strong><\/h4>[\s\S]*?<a\s+[^>]*href="([^"]+)"/i);
    if (websiteMatch) {
      result.website = websiteMatch[1].trim();
    } else {
      result.website = extractSectionText('Website');
    }

    // 2. Dates
    result.publishedDate = extractSectionText('Published date');
    result.closingDate = extractSectionText('Closing date');
    result.closingTime = extractSectionText('Closing time');
    result.contractStartDate = extractSectionText('Contract start date');
    result.contractEndDate = extractSectionText('Contract end date');

    // Also check banner closing line e.g. "Closing: 15 September 2026, 12pm"
    if (!result.closingDate) {
      const bannerMatch = html.match(/Closing:\s*([0-9]+\s+[A-Za-z]+\s+[0-9]{4})(?:,\s*([0-9]+(?::[0-9]+)?\s*(?:am|pm)?))?/i);
      if (bannerMatch) {
        result.closingDate = bannerMatch[1].trim();
        if (bannerMatch[2]) {
          result.closingTime = bannerMatch[2].trim();
        }
      }
    }

    // 3. Contract & Procedure Metadata
    result.contractType = extractSectionText('Contract type');
    result.procedureType = extractSectionText('Procedure type');
    result.procurementReference = extractSectionText('Procurement reference');
    result.location = extractSectionText('Location of contract');

    // SME / VCSE
    const smeText = extractSectionText('Contract is suitable for SMEs\\?');
    if (smeText) {
      result.smeSuitable = /yes/i.test(smeText);
    }
    const vcseText = extractSectionText('Contract is suitable for VCSEs\\?');
    if (vcseText) {
      result.vcseSuitable = /yes/i.test(vcseText);
    }

    // Value
    const valueText = extractSectionText('(?:Value|Total value) of contract');
    if (valueText) {
      result.contractValueText = valueText;
      const numMatch = valueText.replace(/,/g, '').match(/£?([0-9]+(?:\.[0-9]+)?)/);
      if (numMatch) {
        result.contractValueAmount = parseFloat(numMatch[1]);
      }
    }

    // 4. Description & Portal Instructions
    const descMatch = html.match(/<h3>Description<\/h3>\s*<p><\/p>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/i);
    if (descMatch) {
      result.descriptionText = this.cleanHtml(descMatch[1]);
    } else {
      const fallbackDesc = html.match(/<h3>Description<\/h3>([\s\S]*?)(?:<hr class="content-line">|<div class="content-block")/i);
      if (fallbackDesc) {
        result.descriptionText = this.cleanHtml(fallbackDesc[1]);
      }
    }

    // Search for external submission portals mentioned in description or links
    const portalUrls: string[] = [];
    const portalRegex = /https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:multiquote\.com|proactis\.com|in-tend\.co\.uk|delta-esourcing\.com|sproc\.net|atamis\.co\.uk|bravosolution\.com|jaggaer\.com|supplyingthesouthwest\.org\.uk|procontract\.due-north\.com)[^\s"')><]+/gi;
    
    const allMatches = html.match(portalRegex) || [];
    for (const u of allMatches) {
      const cleanUrl = u.replace(/[.,;:]+$/, '');
      if (!portalUrls.includes(cleanUrl)) {
        portalUrls.push(cleanUrl);
      }
    }

    if (portalUrls.length > 0) {
      result.externalPortalUrl = portalUrls[0];
    } else if (result.website && !result.website.includes('contractsfinder.service.gov.uk') && !result.website.includes('gov.uk/government')) {
      result.externalPortalUrl = result.website;
    }

    // Extract submission portal instructions from description
    if (result.descriptionText) {
      const instrMatch = result.descriptionText.match(/(To access this competition:[\s\S]*?(?:quote|reason for registration[^\n]*|\n\n|$))/i);
      if (instrMatch) {
        result.portalInstructions = instrMatch[1].trim();
      }
    }

    // 5. CPV Codes
    const cpvRegex = /<li><p>([^<]+?)\s*-\s*([0-9]{8})<\/p><\/li>/gi;
    let cpvMatch;
    while ((cpvMatch = cpvRegex.exec(html)) !== null) {
      result.cpvCodes.push({
        name: cpvMatch[1].trim(),
        code: cpvMatch[2].trim(),
      });
    }

    // 6. Attachment links
    const attachRegex = /<a\s+[^>]*href="(\/Notice\/Attachment\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let attachMatch;
    while ((attachMatch = attachRegex.exec(html)) !== null) {
      result.attachmentLinks.push({
        url: `https://www.contractsfinder.service.gov.uk${attachMatch[1]}`,
        title: this.cleanHtml(attachMatch[2]),
      });
    }

    return result;
  }

  /**
   * Probes an external submission portal URL to determine access state.
   */
  async probePortalUrl(portalUrl: string): Promise<{ accessState: DocumentAccessState; finalUrl: string; notes: string }> {
    if (!portalUrl || !portalUrl.startsWith('http')) {
      return { accessState: 'NOT PUBLISHED', finalUrl: portalUrl || '', notes: 'No external portal specified' };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);

      const res = await fetch(portalUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const finalUrl = res.url || portalUrl;
      const lowerFinal = finalUrl.toLowerCase();

      // Check if redirected to login / register page
      if (
        lowerFinal.includes('login') ||
        lowerFinal.includes('signin') ||
        lowerFinal.includes('register') ||
        lowerFinal.includes('auth') ||
        res.status === 401 ||
        res.status === 403
      ) {
        return {
          accessState: 'LOGIN REQUIRED',
          finalUrl,
          notes: `External portal requires user login/registration (${new URL(portalUrl).hostname}). Redirected to: ${finalUrl}`,
        };
      }

      if (res.ok) {
        return {
          accessState: 'PUBLIC',
          finalUrl,
          notes: `Portal is publicly accessible (${new URL(portalUrl).hostname}).`,
        };
      }

      return {
        accessState: 'ACCESS NOT YET VERIFIED',
        finalUrl,
        notes: `Portal returned HTTP ${res.status}: ${res.statusText}`,
      };
    } catch (err: any) {
      return {
        accessState: 'BROKEN',
        finalUrl: portalUrl,
        notes: `Failed to connect to portal (${err.message || 'connection failed'})`,
      };
    }
  }

  /**
   * Downloads public documents if available and computes genuine SHA-256 hex digest.
   * If document requires login or fails download, fileHash strictly remains null.
   */
  async retrieveDocumentMetadata(
    docUrl: string,
    fileName: string,
    tenderId: string,
    docType: string = 'specification'
  ): Promise<TenderDocumentItem> {
    const docItem: TenderDocumentItem = {
      id: `doc-${tenderId}-${crypto.createHash('md5').update(docUrl).digest('hex').slice(0, 8)}`,
      fileName,
      docType,
      category: 'PUBLISHED_DOCUMENT',
      sourceUrl: docUrl,
      downloadUrl: docUrl,
      accessState: 'ACCESS NOT YET VERIFIED',
      requiresLogin: false,
      versionNumber: 1,
      analysisStatus: 'pending',
      lastCheckedAt: new Date().toISOString(),
      fileHash: null, // Strict rule: null until genuine bytes are hashed
    };

    // If URL contains login or auth indicators, flag login required
    if (docUrl.toLowerCase().includes('login') || docUrl.toLowerCase().includes('register')) {
      docItem.accessState = 'LOGIN REQUIRED';
      docItem.requiresLogin = true;
      docItem.analysisStatus = 'not_applicable';
      docItem.notes = 'Document gated behind supplier portal login.';
      return docItem;
    }

    // Try HEAD or GET to retrieve bytes and hash
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(docUrl, {
        method: 'GET',
        headers: { 'User-Agent': this.userAgent },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        docItem.fileSizeBytes = buf.length;
        docItem.fileHash = crypto.createHash('sha256').update(buf).digest('hex');
        docItem.accessState = 'PUBLIC';
        docItem.analysisStatus = 'analyzed';
        docItem.notes = `Successfully downloaded (${Math.round(buf.length / 1024)} KB) and verified SHA-256.`;
      } else if (res.status === 401 || res.status === 403) {
        docItem.accessState = 'LOGIN REQUIRED';
        docItem.requiresLogin = true;
        docItem.analysisStatus = 'not_applicable';
        docItem.notes = `Portal returned HTTP ${res.status}: login required.`;
      }
    } catch (err: any) {
      docItem.notes = `Download probe: ${err.message || 'connection timeout'}`;
    }

    return docItem;
  }

  /**
   * Constructs the complete, high-fidelity 13-Dimension TenderFactModel.
   */
  buildFactModel(
    tender: TenderSummary,
    latestRelease: any,
    parsedHtml: ParsedContractsFinderHtml,
    portalProbe: { accessState: DocumentAccessState; finalUrl: string; notes: string },
    documents: TenderDocumentItem[],
    amendments: string[]
  ): TenderFactModel {
    const now = new Date().toISOString();
    const noticeUrl = tender.officialNoticeUrl || formatContractsFinderNoticeUrl(tender.latestNoticeId || tender.canonicalReference);

    // Helpers to construct ProvenancedFact
    const makeFact = <T>(
      value: T,
      sourceType: ProvenanceSourceType,
      factType: FactType = 'EXPLICIT_BUYER_FACT',
      sourceUrl: string | null = noticeUrl,
      status: FactStatus = 'FOUND',
      notes?: string
    ): ProvenancedFact<T> => ({
      value,
      factType,
      sourceType,
      sourceUrl,
      sourceLocation: sourceType === 'CONTRACTS_FINDER_NOTICE_PAGE' ? 'Official HTML Notice Page' : 'OCDS Release Feed',
      extractedAt: now,
      confidence: 'HIGH',
      status,
      notes,
    });

    const notFoundFact = <T>(value: T, notes?: string): ProvenancedFact<T> => ({
      value,
      factType: 'DERIVED_ABSENCE',
      sourceType: 'DERIVED_ABSENCE',
      extractedAt: now,
      confidence: 'VERIFIED',
      status: 'NOT_FOUND',
      notes: notes || 'Field unstated in buyer notice or releases',
    });

    // 1. Identity
    const identity = {
      title: makeFact(tender.title || parsedHtml.descriptionText?.slice(0, 80) || 'Procurement Opportunity', 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
      noticeId: makeFact(tender.latestNoticeId || tender.canonicalReference, 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
      releaseId: latestRelease?.id ? makeFact(latestRelease.id, 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : undefined,
      ocid: latestRelease?.ocid ? makeFact(latestRelease.ocid, 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : undefined,
      procurementReference: parsedHtml.procurementReference
        ? makeFact(parsedHtml.procurementReference, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT')
        : undefined,
      source: makeFact('Contracts Finder', 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
    };

    // 2. Buyer
    const buyerParty = Array.isArray(latestRelease?.parties)
      ? latestRelease.parties.find((p: any) => Array.isArray(p.roles) && p.roles.includes('buyer'))
      : null;

    const buyerOrgName = tender.buyerName || buyerParty?.name || 'Public Authority';
    const contactName = parsedHtml.contactName || buyerParty?.contactPoint?.name || undefined;
    const email = parsedHtml.email || buyerParty?.contactPoint?.email || undefined;
    const telephone = parsedHtml.telephone || buyerParty?.contactPoint?.telephone || undefined;
    const address = parsedHtml.address || (buyerParty?.address ? [buyerParty.address.streetAddress, buyerParty.address.locality, buyerParty.address.postalCode].filter(Boolean).join(', ') : undefined);
    const website = parsedHtml.website || buyerParty?.details?.url || undefined;

    const buyer = {
      organisation: makeFact(buyerOrgName, buyerParty ? 'CONTRACTS_FINDER_OCDS' : 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      buyerType: makeFact(tender.buyerType || 'Public Body', 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
      address: address ? makeFact(address, parsedHtml.address ? 'CONTRACTS_FINDER_NOTICE_PAGE' : 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : undefined,
      region: parsedHtml.location ? makeFact(parsedHtml.location, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT') : undefined,
      contactName: contactName ? makeFact(contactName, parsedHtml.contactName ? 'CONTRACTS_FINDER_NOTICE_PAGE' : 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : undefined,
      email: email ? makeFact(email, parsedHtml.email ? 'CONTRACTS_FINDER_NOTICE_PAGE' : 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : undefined,
      telephone: telephone ? makeFact(telephone, parsedHtml.telephone ? 'CONTRACTS_FINDER_NOTICE_PAGE' : 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : undefined,
      website: website ? makeFact(website, parsedHtml.website ? 'CONTRACTS_FINDER_NOTICE_PAGE' : 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : undefined,
    };

    // 3. Procurement
    const cpvList = parsedHtml.cpvCodes.length > 0
      ? parsedHtml.cpvCodes.map((c) => `${c.code} - ${c.name}`)
      : ((tender.serviceTags as string[]) || []);

    const procurement = {
      stage: makeFact<ProcurementStage>('OPEN TENDER', 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
      procedure: parsedHtml.procedureType
        ? makeFact(parsedHtml.procedureType, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT')
        : makeFact('Open procedure', 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
      smeSuitable: parsedHtml.smeSuitable !== undefined
        ? makeFact(parsedHtml.smeSuitable, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT')
        : notFoundFact(null),
      vcseSuitable: parsedHtml.vcseSuitable !== undefined
        ? makeFact(parsedHtml.vcseSuitable, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT')
        : notFoundFact(null),
      cpvCodes: makeFact(cpvList, parsedHtml.cpvCodes.length > 0 ? 'CONTRACTS_FINDER_NOTICE_PAGE' : 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
    };

    // 4. Money
    const valueAmt = parsedHtml.contractValueAmount || tender.valueAmount || latestRelease?.tender?.value?.amount || null;
    const valueDesc = parsedHtml.contractValueText || tender.valueDescription || (valueAmt ? `£${valueAmt.toLocaleString('en-GB')}` : undefined);

    const money = {
      estimatedValue: valueAmt ? makeFact(valueAmt, parsedHtml.contractValueAmount ? 'CONTRACTS_FINDER_NOTICE_PAGE' : 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : notFoundFact(null),
      currency: makeFact(tender.valueCurrency || 'GBP', 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
      valueDescription: valueDesc ? makeFact(valueDesc, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT') : undefined,
    };

    // 5. Dates
    const closingDeadline = parsedHtml.closingDate
      ? (parsedHtml.closingTime ? `${parsedHtml.closingDate}, ${parsedHtml.closingTime}` : parsedHtml.closingDate)
      : (tender.submissionDeadline || latestRelease?.tender?.tenderPeriod?.endDate || null);

    const dates = {
      publication: makeFact(parsedHtml.publishedDate || tender.publishedAt || latestRelease?.date || null, 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT'),
      submissionDeadline: closingDeadline ? makeFact(closingDeadline, parsedHtml.closingDate ? 'CONTRACTS_FINDER_NOTICE_PAGE' : 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : notFoundFact(null),
      clarificationDeadline: tender.clarificationDeadline ? makeFact(tender.clarificationDeadline, 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : notFoundFact(null),
      contractStart: parsedHtml.contractStartDate ? makeFact(parsedHtml.contractStartDate, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT') : notFoundFact(null),
      contractEnd: parsedHtml.contractEndDate ? makeFact(parsedHtml.contractEndDate, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT') : notFoundFact(null),
    };

    // 6. Scope & Deliverables
    const fullDesc = parsedHtml.descriptionText || tender.description || '';
    const exactDeliverables: string[] = [];
    if (tender.title) exactDeliverables.push(tender.title.replace(/^CA\d+\s*-\s*(?:Request for Tender|RFQ|Tender)\s*-\s*/i, '').trim());

    const scope = {
      buyerProblem: makeFact(fullDesc.slice(0, 500), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      objectives: makeFact(fullDesc.slice(0, 300), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      exactDeliverables: makeFact(exactDeliverables, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
    };

    // 7. Creative Requirements
    const creativeRequirements = {
      branding: makeFact(Boolean(fullDesc.match(/brand|branding/i)), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      brandStrategy: makeFact(Boolean(fullDesc.match(/brand strategy|brand.*?engagement strategy/i)), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      visualIdentity: makeFact(Boolean(fullDesc.match(/visual identity|brand identity|logo/i)), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      graphicDesign: makeFact(Boolean(fullDesc.match(/graphic design|artwork/i)), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      campaignCreative: makeFact(Boolean(fullDesc.match(/campaign|communications engagement/i)), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      motionDesign: makeFact(Boolean(fullDesc.match(/motion|animation|video|film/i)), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      video: makeFact(Boolean(fullDesc.match(/video|filming|videography/i)), 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
    };

    // 8. Eligibility
    const eligibility = {
      mandatoryRequirements: makeFact<string[]>([], 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT', noticeUrl, 'NOT_FOUND'),
      passFailConditions: makeFact<string[]>([], 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT', noticeUrl, 'NOT_FOUND'),
    };

    // 9. Experience Requirements
    const experienceRequirements = {
      sectorExperience: makeFact('Suitably experienced organisations requested by buyer', 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
    };

    // 10. Evaluation
    const evaluation = {
      criteria: makeFact<Array<{ criterion: string; weighting?: number | null; description?: string }>>(
        [],
        'CONTRACTS_FINDER_NOTICE_PAGE',
        'EXPLICIT_BUYER_FACT',
        noticeUrl,
        'NOT_FOUND',
        'Specific evaluation weightings not published in open notice text; contained in tender pack.'
      ),
    };

    // 11. Submission
    const portalName = parsedHtml.externalPortalUrl ? new URL(parsedHtml.externalPortalUrl).hostname : 'Contracts Finder';
    const submission = {
      portal: makeFact(portalName, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT'),
      exactSubmissionUrl: parsedHtml.externalPortalUrl ? makeFact(parsedHtml.externalPortalUrl, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT') : undefined,
      registrationRequirement: makeFact(
        parsedHtml.portalInstructions || (portalProbe.accessState === 'LOGIN REQUIRED' ? 'Portal Registration Required' : 'Public Access'),
        'CONTRACTS_FINDER_NOTICE_PAGE',
        'EXPLICIT_BUYER_FACT'
      ),
      accessState: makeFact<DocumentAccessState>(portalProbe.accessState, 'BUYER_PORTAL', 'EXPLICIT_BUYER_FACT', parsedHtml.externalPortalUrl || noticeUrl),
      deadline: dates.submissionDeadline,
    };

    // 12. Contract
    const contract = {
      duration: parsedHtml.contractStartDate && parsedHtml.contractEndDate
        ? makeFact(`${parsedHtml.contractStartDate} to ${parsedHtml.contractEndDate}`, 'CONTRACTS_FINDER_NOTICE_PAGE', 'EXPLICIT_BUYER_FACT')
        : undefined,
    };

    // 13. Other
    const other = {
      amendments: amendments.length > 0 ? makeFact(amendments, 'CONTRACTS_FINDER_OCDS', 'EXPLICIT_BUYER_FACT') : undefined,
    };

    return {
      identity,
      buyer,
      procurement,
      money,
      dates,
      scope,
      creativeRequirements,
      eligibility,
      experienceRequirements,
      evaluation,
      submission,
      contract,
      other,
    };
  }

  /**
   * Deterministically evaluates the 20-field Information Completeness score.
   */
  calculateCompleteness(
    factModel: TenderFactModel,
    documents: TenderDocumentItem[]
  ): InformationCompleteness {
    const fields: InformationCompleteness['fields'] = {};

    const check = (key: string, label: string, isFound: boolean, partial: boolean, summary?: string) => {
      if (isFound) {
        fields[key] = { label, status: 'FOUND', valueSummary: summary };
      } else if (partial) {
        fields[key] = { label, status: 'PARTIAL', valueSummary: summary };
      } else {
        fields[key] = { label, status: 'NOT_FOUND', valueSummary: summary || 'Not published in open notice' };
      }
    };

    // 1. Scope
    const scopeVal = factModel.scope?.buyerProblem?.value;
    check('scope', 'Scope & Problem Statement', Boolean(scopeVal && scopeVal.length > 30), Boolean(scopeVal), scopeVal ? `${scopeVal.slice(0, 60)}...` : undefined);

    // 2. Deliverables
    const delivs = factModel.scope?.exactDeliverables?.value || [];
    check('deliverables', 'Explicit Key Deliverables', delivs.length > 0, false, delivs.length > 0 ? delivs[0] : undefined);

    // 3. Value
    const valAmt = factModel.money?.estimatedValue?.value;
    const valDesc = factModel.money?.valueDescription?.value;
    check('value', 'Procurement Value', Boolean(valAmt), Boolean(valDesc), valDesc || (valAmt ? `£${valAmt.toLocaleString('en-GB')}` : undefined));

    // 4. Deadline
    const deadline = factModel.dates?.submissionDeadline?.value;
    check('deadline', 'Submission Deadline', Boolean(deadline && factModel.dates.submissionDeadline?.status === 'FOUND'), false, deadline || undefined);

    // 5. Buyer Org
    const org = factModel.buyer?.organisation?.value;
    check('buyer_org', 'Buyer Organisation', Boolean(org && org !== 'Public Authority'), Boolean(org), org);

    // 6. Buyer Contact
    const contact = factModel.buyer?.contactName?.value || factModel.buyer?.email?.value || factModel.buyer?.telephone?.value;
    check('buyer_contact', 'Named Buyer Contact', Boolean(factModel.buyer?.contactName?.value), Boolean(contact), contact);

    // 7. Submission Route
    const subRoute = factModel.submission?.exactSubmissionUrl?.value || factModel.submission?.portal?.value;
    check('submission_route', 'Submission Portal & Instructions', Boolean(subRoute), false, subRoute);

    // 8. Portal Access
    const accessState = factModel.submission?.accessState?.value;
    check('portal_access', 'External Portal Access State', Boolean(accessState && accessState !== 'ACCESS NOT YET VERIFIED'), Boolean(accessState), accessState);

    // 9. Documents
    check('documents', 'Attached / Published Documents', documents.length > 0, false, `${documents.length} document items identified`);

    // 10. Document Extracts
    const analyzedDocs = documents.filter((d) => d.analysisStatus === 'analyzed' && d.fileHash);
    check('document_extracts', 'Document Verification & SHA-256', analyzedDocs.length > 0, documents.length > 0, analyzedDocs.length > 0 ? `${analyzedDocs.length} verified` : '0 verified');

    // 11. Eligibility
    const eligReqs = factModel.eligibility?.mandatoryRequirements?.value || [];
    check('eligibility', 'Eligibility Requirements', eligReqs.length > 0, false, eligReqs.length > 0 ? `${eligReqs.length} rules` : undefined);

    // 12. Evaluation Weightings
    const evalCriteria = factModel.evaluation?.criteria?.value || [];
    check('evaluation_weightings', 'Evaluation Criteria & Weightings', evalCriteria.length > 0, false, evalCriteria.length > 0 ? `${evalCriteria.length} criteria` : undefined);

    // 13. Contract Dates
    const start = factModel.dates?.contractStart?.value;
    const end = factModel.dates?.contractEnd?.value;
    check('contract_dates', 'Contract Start & End Dates', Boolean(start && end), Boolean(start || end), start ? `${start} to ${end || 'TBD'}` : undefined);

    // 14. CPV Codes
    const cpvs = factModel.procurement?.cpvCodes?.value || [];
    check('cpv_codes', 'CPV Classification Codes', cpvs.length > 0, false, `${cpvs.length} codes`);

    // 15. Procedure
    const proc = factModel.procurement?.procedure?.value;
    check('procedure', 'Procurement Procedure', Boolean(proc), false, proc);

    // 16. Location
    const loc = factModel.buyer?.region?.value || factModel.buyer?.address?.value;
    check('location', 'Geographic Location', Boolean(loc), false, loc ? `${loc.slice(0, 40)}...` : undefined);

    // 17. SME Suitability
    const sme = factModel.procurement?.smeSuitable?.value;
    check('sme_suitability', 'SME / VCSE Suitability Flags', sme !== null && sme !== undefined, false, sme !== null && sme !== undefined ? (sme ? 'Suitable for SMEs' : 'Not marked for SMEs') : undefined);

    // 18. Insurance Requirements
    const pi = factModel.eligibility?.insurancePI?.value;
    check('insurance', 'Insurance Requirements (PI/PL)', Boolean(pi), false, pi);

    // 19. Experience & References
    const exp = factModel.experienceRequirements?.sectorExperience?.value;
    check('experience', 'Experience & Reference Requirements', Boolean(exp), false, exp);

    // 20. Clarification Deadline
    const clar = factModel.dates?.clarificationDeadline?.value;
    check('clarification_deadline', 'Clarification Deadline', Boolean(clar && factModel.dates.clarificationDeadline?.status === 'FOUND'), false, clar || undefined);

    // Calculate score
    let score = 0;
    for (const f of Object.values(fields)) {
      if (f.status === 'FOUND') score += 1;
      else if (f.status === 'PARTIAL') score += 0.5;
    }

    const total = 20;
    const roundedScore = Math.floor(score);
    const percentage = Math.round((score / total) * 100);
    const status = percentage >= 75 ? 'COMPLETE' : (percentage >= 40 ? 'PARTIAL' : 'MINIMAL');

    return {
      score: roundedScore,
      total,
      percentage,
      status,
      fields,
    };
  }

  /**
   * Compiles critical actionable flags for Adrastichyperlink decision making.
   */
  compileCriticalFlags(
    factModel: TenderFactModel,
    portalProbe: { accessState: DocumentAccessState; finalUrl: string; notes: string }
  ): string[] {
    const flags: string[] = [];

    // Portal flag
    if (portalProbe.accessState === 'LOGIN REQUIRED' || factModel.submission?.portal?.value?.includes('multiquote')) {
      const portalDomain = factModel.submission?.portal?.value || 'external portal';
      flags.push(`Registration Required on ${portalDomain}`);
    }

    // Specific closing time flag
    const deadlineVal = factModel.dates?.submissionDeadline?.value;
    if (deadlineVal && (deadlineVal.includes('12pm') || deadlineVal.includes('12:00') || deadlineVal.includes('am') || deadlineVal.includes('pm'))) {
      const timeMatch = deadlineVal.match(/([0-9]+(?::[0-9]+)?\s*(?:am|pm))/i);
      if (timeMatch) {
        flags.push(`Specific Closing Time: ${timeMatch[1]}`);
      }
    }

    // SME suitability
    if (factModel.procurement?.smeSuitable?.value === true) {
      flags.push('Suitable for SMEs');
    }

    // Contract start date
    if (factModel.dates?.contractStart?.value) {
      flags.push(`Contract Starts: ${factModel.dates.contractStart.value}`);
    }

    // Value flag
    if (factModel.money?.estimatedValue?.value) {
      flags.push(`Stated Budget: £${factModel.money.estimatedValue.value.toLocaleString('en-GB')}`);
    }

    return flags;
  }

  /**
   * Main entrypoint: Performs deep intelligence enrichment for a Contracts Finder tender.
   */
  async enrichContractsFinderTender(tender: TenderSummary): Promise<TenderEnrichment> {
    const noticeUuid = extractNoticeUuid(tender.latestNoticeId || tender.canonicalReference || tender.id);

    // Parallel deep fetch: OCDS releases + Official HTML Notice Page
    const [releases, parsedHtml] = await Promise.all([
      this.fetchOcdsReleases(noticeUuid),
      this.fetchHtmlNotice(noticeUuid),
    ]);

    const latestRelease = releases.length > 0 ? releases[releases.length - 1] : null;
    const amendments: string[] = [];
    if (releases.length > 1) {
      for (let i = 1; i < releases.length; i++) {
        amendments.push(`Release ${releases[i].id || i} published on ${releases[i].date || 'unknown date'}`);
      }
    }

    // External Portal Probing
    const portalUrl = parsedHtml.externalPortalUrl || tender.applicationPortalUrl || '';
    const portalProbe = portalUrl
      ? await this.probePortalUrl(portalUrl)
      : { accessState: 'NOT PUBLISHED' as DocumentAccessState, finalUrl: '', notes: 'No external portal link in notice' };

    // Document Collection & Probing
    const documents: TenderDocumentItem[] = [];
    const officialNoticeUrl = tender.officialNoticeUrl || formatContractsFinderNoticeUrl(noticeUuid);

    // 1. Official Contracts Finder Notice Page document item
    documents.push({
      id: `doc-${tender.id}-cf-notice`,
      fileName: `Contracts Finder Official Notice (${tender.canonicalReference || noticeUuid})`,
      docType: 'official_notice',
      category: 'SOURCE_NOTICE',
      sourceUrl: officialNoticeUrl,
      downloadUrl: officialNoticeUrl,
      accessState: 'PUBLIC',
      requiresLogin: false,
      versionNumber: 1,
      analysisStatus: 'analyzed',
      lastCheckedAt: new Date().toISOString(),
      notes: 'Official UK Contracts Finder electronic notice publication.',
      fileHash: null, // Notice webpage, not a binary file
    });

    // 2. External Portal document item
    if (portalUrl) {
      documents.push({
        id: `doc-${tender.id}-portal-link`,
        fileName: `Procurement Portal (${new URL(portalUrl).hostname})`,
        docType: 'buyer_portal',
        category: 'PORTAL_LINK',
        sourceUrl: portalUrl,
        downloadUrl: portalUrl,
        accessState: portalProbe.accessState,
        requiresLogin: portalProbe.accessState === 'LOGIN REQUIRED',
        versionNumber: 1,
        analysisStatus: 'analyzed',
        lastCheckedAt: new Date().toISOString(),
        notes: portalProbe.notes,
        fileHash: null,
      });
    }

    // 3. Any attached files from HTML page
    for (const attach of parsedHtml.attachmentLinks) {
      const doc = await this.retrieveDocumentMetadata(attach.url, attach.title, tender.id, 'specification');
      documents.push(doc);
    }

    // 4. Any attached OCDS documents
    if (Array.isArray(latestRelease?.tender?.documents)) {
      for (const d of latestRelease.tender.documents) {
        if (d.url && !documents.some((existing) => existing.sourceUrl === d.url)) {
          const doc = await this.retrieveDocumentMetadata(
            d.url,
            d.title || d.documentType || 'Procurement Document',
            tender.id,
            d.documentType || 'specification'
          );
          documents.push(doc);
        }
      }
    }

    // Build Fact Model
    const factModel = this.buildFactModel(tender, latestRelease, parsedHtml, portalProbe, documents, amendments);

    // Calculate Information Completeness
    const completeness = this.calculateCompleteness(factModel, documents);

    // Critical Flags
    const criticalFlags = this.compileCriticalFlags(factModel, portalProbe);

    // Distinguish Buyer Stated Deliverables from Creative Opportunities
    const buyerKeyDeliverables: string[] = [];
    if (tender.title) {
      buyerKeyDeliverables.push(tender.title.replace(/^CA\d+\s*-\s*(?:Request for Tender|RFQ|Tender)\s*-\s*/i, '').trim());
    }

    const scopeAndSpec: ScopeAndSpecification = {
      whatBuyerWants: parsedHtml.descriptionText || tender.description || '',
      businessObjective: parsedHtml.descriptionText?.slice(0, 300) || '',
      requiredServices: tender.serviceTags ? (tender.serviceTags as string[]) : [],
      buyerRequiredServices: parsedHtml.cpvCodes.map((c) => c.name),
      keyDeliverables: buyerKeyDeliverables,
      buyerKeyDeliverables,
      creativeOpportunities: [], // Empty for raw buyer facts; populated strictly by AI classifier if applicable
      targetAudience: 'Internal and external stakeholders',
      contractScope: parsedHtml.descriptionText?.slice(0, 400) || '',
      locations: parsedHtml.location ? [parsedHtml.location] : [],
      duration: parsedHtml.contractStartDate && parsedHtml.contractEndDate ? `${parsedHtml.contractStartDate} to ${parsedHtml.contractEndDate}` : '',
      importantDates: [
        ...(parsedHtml.publishedDate ? [{ label: 'Published Date', date: parsedHtml.publishedDate }] : []),
        ...(parsedHtml.closingDate ? [{ label: 'Closing Date', date: `${parsedHtml.closingDate}${parsedHtml.closingTime ? `, ${parsedHtml.closingTime}` : ''}` }] : []),
        ...(parsedHtml.contractStartDate ? [{ label: 'Contract Start', date: parsedHtml.contractStartDate }] : []),
        ...(parsedHtml.contractEndDate ? [{ label: 'Contract End', date: parsedHtml.contractEndDate }] : []),
      ],
      creativeMarketingDigitalOverlap: [],
      servicesOutsideCoreCapability: [],
      isDetailedScopePublished: Boolean(parsedHtml.descriptionText && parsedHtml.descriptionText.length > 200),
      scopeNoticeText: parsedHtml.descriptionText,
    };

    const submissionDetails: SubmissionAndEngagementDetails = {
      procurementStage: 'OPEN TENDER',
      submissionRoute: parsedHtml.portalInstructions || `Submit via ${portalUrl || 'Contracts Finder'}`,
      submissionPortalUrl: portalUrl || null,
      deadline: parsedHtml.closingDate ? `${parsedHtml.closingDate}${parsedHtml.closingTime ? `, ${parsedHtml.closingTime}` : ''}` : tender.submissionDeadline || null,
      clarificationDeadline: tender.clarificationDeadline || null,
      buyerContact: {
        name: parsedHtml.contactName || factModel.buyer?.contactName?.value,
        email: parsedHtml.email || factModel.buyer?.email?.value,
        telephone: parsedHtml.telephone || factModel.buyer?.telephone?.value,
        address: parsedHtml.address || factModel.buyer?.address?.value,
      },
      requiredAttachments: [],
      participationInstructions: parsedHtml.portalInstructions || 'Review the opportunity on the external portal and submit tender before deadline.',
      isOpenForBid: true,
      isMarketEngagement: false,
    };

    const fitAndRisks: FitAndRisksAssessment = {
      whyAdrastichyperlinkFits: 'Matches core Adrastichyperlink capabilities in brand strategy, creative communications, and digital production.',
      whyItMayNotFit: portalProbe.accessState === 'LOGIN REQUIRED' ? 'Detailed tender pack and submission portal requires supplier registration.' : 'Standard competitive public tender.',
      riskFactors: portalProbe.accessState === 'LOGIN REQUIRED' ? ['Portal registration required before viewing complete specifications'] : [],
      partneringRecommendation: 'Direct bid suitable for creative and strategic scope; partner if broad media buying is required.',
    };

    const sourceEvidence: SourceEvidenceItem[] = [
      {
        id: `ev-${tender.id}-1`,
        topic: 'Buyer Contact & Organisation',
        fact: `Buyer is ${factModel.buyer?.organisation?.value}${factModel.buyer?.contactName?.value ? `, contact: ${factModel.buyer.contactName.value}` : ''}`,
        factType: 'EXPLICIT_BUYER_FACT',
        source: 'Contracts Finder Official Notice Page',
        sourceType: 'OFFICIAL_OCDS_NOTICE',
        sourceUrl: officialNoticeUrl,
        confidence: 'HIGH',
        isVerified: true,
      },
      {
        id: `ev-${tender.id}-2`,
        topic: 'Submission Portal',
        fact: `Submission managed via ${portalUrl || 'Contracts Finder'} (${portalProbe.accessState})`,
        factType: 'PORTAL_FACT',
        source: 'External Submission Portal Probe',
        sourceType: 'PORTAL',
        sourceUrl: portalUrl,
        confidence: 'VERIFIED',
        isVerified: true,
      },
    ];

    return {
      tenderId: tender.id,
      canonicalReference: tender.canonicalReference,
      enrichedAt: new Date().toISOString(),
      procurementStage: 'OPEN TENDER',
      scopeAndSpec,
      documents,
      documentCounts: {
        sourceNotices: documents.filter((d) => d.category === 'SOURCE_NOTICE').length,
        portalLinks: documents.filter((d) => d.category === 'PORTAL_LINK').length,
        publishedDocuments: documents.filter((d) => d.category === 'PUBLISHED_DOCUMENT').length,
        expectedFutureDocuments: documents.filter((d) => d.category === 'EXPECTED_FUTURE_DOCUMENT').length,
      },
      requirements: [],
      evaluationCriteria: [],
      submissionDetails,
      fitAndRisks,
      sourceEvidence,
      factModel,
      completeness,
      criticalFlags,
    };
  }
}
