/**
 * Post-login `returnTo` targets must be in-app paths ("/journal"), never external URLs
 * ("https://…", "//host", "javascript:…") or backslash tricks.
 */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string') return '';
  if (!value.startsWith('/') || value.startsWith('//')) return '';
  if (value.includes('\\') || value.includes('://')) return '';
  return value;
}
