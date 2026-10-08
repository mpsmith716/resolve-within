import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeReturnTo } from './safeReturnTo';

describe('safeReturnTo', () => {
  it('keeps in-app paths', () => {
    assert.equal(safeReturnTo('/journal'), '/journal');
    assert.equal(safeReturnTo('/(tabs)/profile'), '/(tabs)/profile');
    assert.equal(safeReturnTo('/(tabs)/(home)/?tab=journal'), '/(tabs)/(home)/?tab=journal');
  });

  it('rejects external or malformed targets', () => {
    assert.equal(safeReturnTo('https://evil.example'), '');
    assert.equal(safeReturnTo('//evil.example'), '');
    assert.equal(safeReturnTo('/\\evil.example'), '');
    assert.equal(safeReturnTo('/redirect?to=https://evil.example'), '');
    assert.equal(safeReturnTo('javascript:alert(1)'), '');
    assert.equal(safeReturnTo('journal'), '');
    assert.equal(safeReturnTo(''), '');
    assert.equal(safeReturnTo(undefined), '');
    assert.equal(safeReturnTo(['/journal']), '');
  });
});
