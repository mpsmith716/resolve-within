import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAuthProviders, parseAuthProviders, NO_SOCIAL_PROVIDERS } from './authProviders';

const ok = (body: unknown) =>
  (async () => ({ ok: true, json: async () => body }) as unknown as Response) as unknown as typeof fetch;

test('parseAuthProviders only trusts boolean true', () => {
  assert.deepEqual(parseAuthProviders({ google: true, apple: false }), { google: true, apple: false });
  assert.deepEqual(parseAuthProviders({ google: 'true', apple: 1 }), NO_SOCIAL_PROVIDERS);
  assert.deepEqual(parseAuthProviders(null), NO_SOCIAL_PROVIDERS);
  assert.deepEqual(parseAuthProviders('nope'), NO_SOCIAL_PROVIDERS);
});

test('fetchAuthProviders returns server flags and hits the right path', async () => {
  let calledUrl = '';
  const fetchImpl = (async (url: string) => {
    calledUrl = url;
    return { ok: true, json: async () => ({ google: true, apple: false }) };
  }) as unknown as typeof fetch;
  const result = await fetchAuthProviders('https://example.test', 1000, fetchImpl);
  assert.equal(calledUrl, 'https://example.test/api/auth-providers');
  assert.deepEqual(result, { google: true, apple: false });
  assert.deepEqual(await fetchAuthProviders('https://example.test', 1000, ok({ google: true, apple: true })), {
    google: true,
    apple: true,
  });
});

test('fetchAuthProviders hides buttons on error, non-200 and timeout', async () => {
  const failing = (async () => {
    throw new Error('Network request failed');
  }) as unknown as typeof fetch;
  assert.deepEqual(await fetchAuthProviders('https://x', 1000, failing), NO_SOCIAL_PROVIDERS);

  const notFound = (async () => ({ ok: false, status: 404, json: async () => ({}) })) as unknown as typeof fetch;
  assert.deepEqual(await fetchAuthProviders('https://x', 1000, notFound), NO_SOCIAL_PROVIDERS);

  const hanging = (() => new Promise(() => {})) as unknown as typeof fetch;
  const started = Date.now();
  assert.deepEqual(await fetchAuthProviders('https://x', 50, hanging), NO_SOCIAL_PROVIDERS);
  assert.ok(Date.now() - started < 1000);
});
