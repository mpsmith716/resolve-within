import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blockErrorMessage, withoutPost } from './blocking';

test('self-block error maps to a friendly message', () => {
  assert.equal(
    blockErrorMessage(new Error('API error: 400 - {"error":"You can\'t block yourself."}')),
    "You can't block yourself."
  );
});

test('missing post, unavailable, and auth errors map to friendly messages', () => {
  assert.equal(blockErrorMessage(new Error('API error: 404 - {"error":"Post not found"}')), 'That post is no longer available.');
  assert.match(blockErrorMessage(new Error('API error: 503 - x')), /isn't available right now/);
  assert.match(blockErrorMessage(new Error('Authentication token not found. Please sign in.')), /sign in again/);
  assert.match(blockErrorMessage(new Error('Network request failed')), /connection/);
  assert.match(blockErrorMessage(undefined), /connection/);
});

test('withoutPost removes only the blocked post', () => {
  const posts = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(withoutPost(posts, 'b'), [{ id: 'a' }, { id: 'c' }]);
  assert.deepEqual(withoutPost(posts, 'zzz'), posts);
});
