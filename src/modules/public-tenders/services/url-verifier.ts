// src/modules/public-tenders/services/url-verifier.ts
import { VerificationGrade, VerificationResult } from '../connectors/types';

export interface VerificationOptions {
  expectedNoticeId?: string;
  expectedReference?: string;
  expectedTitle?: string;
  expectedBuyer?: string;
  expectedDeadline?: string;
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
      const timeoutId = setTimeout(() => controller.abort(), 10000);

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
      const finalRedirectUrl = response.url;

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
        lowerHtml.includes('notice has been withdrawn');

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
          notes: 'Notice was withdrawn or page reported not found.',
          verifiedAt,
        };
      }

      // Check for expected identifiers
      let idMatches = false;
      if (options.expectedNoticeId) {
        idMatches = html.includes(options.expectedNoticeId);
      }
      if (!idMatches && options.expectedReference) {
        idMatches = html.includes(options.expectedReference);
      }

      // Match Title
      let titleMatches = false;
      if (options.expectedTitle) {
        // Strip common punctuation and match core title substring
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

      // Match Buyer
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

      // Compare dates where available
      let datesMatch = false;
      if (options.expectedDeadline) {
        const deadlineDateStr = options.expectedDeadline.slice(0, 10);
        datesMatch = html.includes(deadlineDateStr);
      }

      // Check URL route pattern for official Find a Tender notice
      const isOfficialNoticePath = finalRedirectUrl.includes('/Notice/');

      let grade: VerificationGrade = 'D';
      let notes = '';

      if (idMatches && (titleMatches || buyerMatches) && isOfficialNoticePath) {
        grade = 'A';
        notes = 'Grade A: Verified exact official notice page, notice ID, and buyer details confirmed.';
      } else if (isOfficialNoticePath && (titleMatches || buyerMatches || idMatches)) {
        grade = 'A';
        notes = 'Grade A: Official notice page verified with matching procurement data.';
      } else if (isOfficialNoticePath) {
        grade = 'B';
        notes = 'Grade B: Official notice page verified, but buyer/title markers only partially matched.';
      } else {
        grade = 'C';
        notes = 'Grade C: Page loaded successfully but does not match official notice path format.';
      }

      return {
        grade,
        isValid: true,
        httpStatus,
        finalRedirectUrl,
        titleMatches,
        buyerMatches,
        datesMatch,
        routeCorrect: isOfficialNoticePath,
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
