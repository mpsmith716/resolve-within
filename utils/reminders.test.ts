import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REMINDERS, PRESSURE_WORDS, parseSettings, DEFAULT_SETTINGS } from './reminders';

test('reminder copy is gentle (no guilt or streak pressure)', () => {
  for (const r of Object.values(REMINDERS)) {
    assert.ok(!PRESSURE_WORDS.test(r.title + ' ' + r.body + ' ' + r.description), r.identifier);
  }
  assert.equal(REMINDERS.checkInReminder.body, 'A gentle check-in: how are you feeling today?');
  assert.match(REMINDERS.crisisSupportReminder.body, /988/);
});

test('identifiers are unique', () => {
  const ids = Object.values(REMINDERS).map((r) => r.identifier);
  assert.equal(new Set(ids).size, ids.length);
});

test('parseSettings defaults everything off and fills new keys', () => {
  assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
  const s = parseSettings({ pushNotifications: true, journalReminder: true, junk: 1 });
  assert.equal(s.pushNotifications, true);
  assert.equal(s.journalReminder, true);
  assert.equal(s.checkInReminder, false);
});
