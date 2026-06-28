export const API_PREFIX = '/api/v1';

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;

export const REQUEST_ID_HEADER = 'x-request-id';
