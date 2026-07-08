const ACCESS_TOKEN_KEY = 'surveyos_access_token';

/**
 * Stores the access token in localStorage.
 * Only safe for client-side usage.
 */
export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

/**
 * Retrieves the access token from localStorage.
 */
export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
}

/**
 * Clears the access token from localStorage.
 */
export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}
