// src/modules/public-tenders/services/portal-session.ts

export type PortalAccessState =
  | 'PUBLIC'
  | 'AUTHENTICATED'
  | 'LOGIN_REQUIRED'
  | 'REGISTRATION_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'BROKEN';

export interface PortalSessionInspection {
  host: string;
  hasConfiguredSession: boolean;
  accessState: PortalAccessState;
  finalUrl?: string;
  notes: string;
  checkedAt: string;
}

const OFFICIAL_HOST_WHITELIST: Record<string, string> = {
  'find-tender.service.gov.uk': 'FIND_A_TENDER_SESSION_COOKIE',
  'www.find-tender.service.gov.uk': 'FIND_A_TENDER_SESSION_COOKIE',
  'contractsfinder.service.gov.uk': 'CONTRACTS_FINDER_SESSION_COOKIE',
  'www.contractsfinder.service.gov.uk': 'CONTRACTS_FINDER_SESSION_COOKIE',
  'suppliers.multiquote.com': 'MULTIQUOTE_SESSION_COOKIE',
  'procontract.due-north.com': 'PROCONTRACT_SESSION_COOKIE',
  'in-tendhost.co.uk': 'INTEND_SESSION_COOKIE',
  'atamis.co.uk': 'ATAMIS_SESSION_COOKIE',
};

export class PortalSessionManager {
  /**
   * Resolves whether the given URL belongs to a whitelisted official procurement host.
   */
  static isWhitelistedHost(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      return Boolean(OFFICIAL_HOST_WHITELIST[parsed.hostname.toLowerCase()]);
    } catch {
      return false;
    }
  }

  /**
   * Returns authorized headers including session cookie if available for this host.
   * Returns empty headers if not whitelisted or no session cookie is configured.
   * STRICT SECURITY: Never logs or serializes the session cookie value.
   */
  static getAuthorisedHeaders(urlStr: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Adrastichyperlink-TenderEngine/2.1 (Supplier-Agent; contact@adrastichyperlink.com)',
    };

    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      const envVarName = OFFICIAL_HOST_WHITELIST[host];

      if (envVarName && typeof process !== 'undefined' && process.env) {
        const sessionCookie = process.env[envVarName];
        if (sessionCookie && sessionCookie.trim().length > 0) {
          headers['Cookie'] = sessionCookie.trim();
        }
      }
    } catch {
      // Return default headers on invalid URL
    }

    return headers;
  }

  /**
   * Checks if a server-only session is configured for the host.
   */
  static hasConfiguredSession(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();
      const envVarName = OFFICIAL_HOST_WHITELIST[host];
      if (!envVarName || typeof process === 'undefined' || !process.env) return false;
      const val = process.env[envVarName];
      return Boolean(val && val.trim().length > 0);
    } catch {
      return false;
    }
  }

  /**
   * Probes the portal URL with optional session credentials to determine access state.
   */
  static async probeAccessState(urlStr: string): Promise<PortalSessionInspection> {
    const checkedAt = new Date().toISOString();

    if (!urlStr || !urlStr.startsWith('http')) {
      return {
        host: '',
        hasConfiguredSession: false,
        accessState: 'BROKEN',
        notes: 'Invalid URL provided',
        checkedAt,
      };
    }

    let host = '';
    try {
      host = new URL(urlStr).hostname.toLowerCase();
    } catch {
      return {
        host: '',
        hasConfiguredSession: false,
        accessState: 'BROKEN',
        notes: 'Malformed URL hostname',
        checkedAt,
      };
    }

    const hasSession = this.hasConfiguredSession(urlStr);
    const headers = this.getAuthorisedHeaders(urlStr);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(urlStr, {
        method: 'GET',
        headers,
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const finalUrl = res.url || urlStr;
      const lowerFinal = finalUrl.toLowerCase();

      // Check redirect to login / register
      const isLoginRedirect =
        lowerFinal.includes('login') ||
        lowerFinal.includes('signin') ||
        lowerFinal.includes('auth') ||
        lowerFinal.includes('register') ||
        res.status === 401 ||
        res.status === 403;

      if (isLoginRedirect) {
        if (hasSession) {
          return {
            host,
            hasConfiguredSession: true,
            accessState: 'SESSION_EXPIRED',
            finalUrl,
            notes: `Configured session rejected or expired on ${host}. Redirected to authentication: ${finalUrl}`,
            checkedAt,
          };
        }
        return {
          host,
          hasConfiguredSession: false,
          accessState: 'LOGIN_REQUIRED',
          finalUrl,
          notes: `Supplier registration/login required on ${host}. Redirected to: ${finalUrl}`,
          checkedAt,
        };
      }

      if (res.ok) {
        if (hasSession) {
          return {
            host,
            hasConfiguredSession: true,
            accessState: 'AUTHENTICATED',
            finalUrl,
            notes: `Successfully accessed ${host} using authorized session credentials.`,
            checkedAt,
          };
        }
        return {
          host,
          hasConfiguredSession: false,
          accessState: 'PUBLIC',
          finalUrl,
          notes: `Publicly accessible without authentication on ${host}.`,
          checkedAt,
        };
      }

      return {
        host,
        hasConfiguredSession: hasSession,
        accessState: 'BROKEN',
        finalUrl,
        notes: `Server returned HTTP ${res.status} on ${host}`,
        checkedAt,
      };
    } catch (err: any) {
      return {
        host,
        hasConfiguredSession: hasSession,
        accessState: 'BROKEN',
        finalUrl: urlStr,
        notes: `Network probe failed: ${err?.message || String(err)}`,
        checkedAt,
      };
    }
  }
}
