// src/modules/public-tenders/services/url-verifier.ts
import { VerificationGrade, VerificationResult } from '../connectors/types';

export interface VerificationOptions {
  expectedNoticeId?: string;
  expectedReference?: string;
  expectedOcid?: string;
  expectedTitle?: string;
  expectedBuyer?: string;
  expectedDeadline?: string | null;
}

export class UrlVerifier {
  private static readonly USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  /**
   * Performs a genuine HTTP request against the notice URL to verify its authenticity,
   * following redirects, verifying HTTP 200 status, and matching procurement markers.
   */
  static async verifyNoticeUrl(
    url: string,
    options: VerificationOptions = {}
  ): Promise<VerificationResult> {
    const verifiedAt = new Date().toISOString();

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return {
        grade: 'X',
        isValid: false,
        httpStatus: 0,
        titleMatches: false,
        buyerMatches: false,
        datesMatch: false,
        routeCorrect: false,
        notes: 'Invalid or missing URL.',
        verifiedAt,
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const httpStatus = response.status;
      const finalRedirectUrl = response.url || url;

      if (!response.ok) {
        return {
          grade: 'X',
          isValid: false,
          httpStatus,
          finalRedirectUrl,
          titleMatches: false,
          buyerMatches: false,
          datesMatch: false,
          routeCorrect: false,
          notes: `Official portal returned HTTP error ${httpStatus}.`,
          verifiedAt,
        };
      }

      const html = await response.text();
      const lowerHtml = html.toLowerCase();

      // Check for generic 404/withdrawn notices inside 200 responses
      const isNotFoundPage =
        lowerHtml.includes('page not found') ||
        lowerHtml.includes('there is a problem with the service') ||
        lowerHtml.includes('notice has been withdrawn') ||
        lowerHtml.includes('this notice cannot be found');

      if (isNotFoundPage) {
        return {
          grade: 'X',
          isValid: false,
          httpStatus: 404,
          finalRedirectUrl,
          titleMatches: false,
          buyerMatches: false,
          datesMatch: false,
          routeCorrect: false,
          notes: 'Notice reported not found or withdrawn on official portal.',
          verifiedAt,
        };
      }

      // 1. Check official domain
      let isOfficialDomain = false;
      try {
        const parsedUrl = new URL(finalRedirectUrl);
        isOfficialDomain =
          parsedUrl.hostname === 'www.find-tender.service.gov.uk' ||
          parsedUrl.hostname === 'find-tender.service.gov.uk';
      } catch {
        isOfficialDomain = false;
      }

      // 2. Check exact notice route
      const isExactNoticeRoute = isOfficialDomain && finalRedirectUrl.includes('/Notice/');

      // 3. Check notice identifier
      let idMatches = false;
      if (options.expectedNoticeId && html.includes(options.expectedNoticeId)) {
        idMatches = true;
      }
      if (!idMatches && options.expectedReference && html.includes(options.expectedReference)) {
        idMatches = true;
      }

      // 4. Check OCID / process identifier
      let ocidMatches = false;
      if (options.expectedOcid && html.includes(options.expectedOcid)) {
        ocidMatches = true;
      }

      // 5. Match Title
      let titleMatches = false;
      if (options.expectedTitle) {
        const cleanTitle = options.expectedTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .slice(0, 4)
          .join(' ');
        if (cleanTitle && lowerHtml.includes(cleanTitle)) {
          titleMatches = true;
        }
      }

      // 6. Match Buyer
      let buyerMatches = false;
      if (options.expectedBuyer) {
        const cleanBuyer = options.expectedBuyer
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 3)
          .slice(0, 3)
          .join(' ');
        if (cleanBuyer && lowerHtml.includes(cleanBuyer)) {
          buyerMatches = true;
        }
      }

      // 7. Check deadline date and flag mismatch
      let datesMatch = false;
      let deadlineMismatch = false;
      if (options.expectedDeadline) {
        const deadlineDateStr = options.expectedDeadline.slice(0, 10);
        datesMatch = html.includes(deadlineDateStr);
        if (!datesMatch) {
          deadlineMismatch = true;
        }
      }

      const strongContentMatch = titleMatches || buyerMatches || ocidMatches;

      // Grade classification rules
      let grade: VerificationGrade = 'D';
      let notes = '';

      if (isOfficialDomain && isExactNoticeRoute && idMatches && strongContentMatch) {
        grade = 'A';
        notes = 'Grade A: Verified exact official notice page, notice ID, and buyer/title match on gov.uk.';
        if (deadlineMismatch) {
          notes += ' (Notice: Submission deadline text not confirmed on initial summary page).';
        }
      } else if (isOfficialDomain && isExactNoticeRoute && idMatches) {
        grade = 'B';
        notes = 'Grade B: Verified notice ID on official portal route, but buyer/title were not clearly matched.';
      } else if (isOfficialDomain && strongContentMatch) {
        grade = 'B';
        notes = 'Grade B: Procurement data found on official portal via portal route.';
      } else if (isOfficialDomain) {
        grade = 'C';
        notes = 'Grade C: Reached official domain, but could not confirm specific notice contents.';
      } else {
        grade = 'D';
        notes = 'Grade D: Soft-404 or unexpected redirect away from official portal.';
      }

      return {
        grade,
        isValid: grade === 'A' || grade === 'B',
        httpStatus,
        finalRedirectUrl,
        titleMatches,
        buyerMatches,
        datesMatch,
        routeCorrect: isExactNoticeRoute,
        notes,
        verifiedAt,
      };
    } catch (err: any) {
      return {
        grade: 'X',
        isValid: false,
        httpStatus: 0,
        titleMatches: false,
        buyerMatches: false,
        datesMatch: false,
        routeCorrect: false,
        notes: `Network verification failed: ${err.message}`,
        verifiedAt,
      };
    }
  }
}
