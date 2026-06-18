// マージロジックの最小検証スクリプト
// 実行: node scripts/test-itinerary-merge.mjs
// 終了コード 0 = 全 PASS、非0 = FAIL

import { mergeItems } from '../src/lib/itinerary-merge.ts';

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('  PASS:', label); }
  else { fail++; console.log('  FAIL:', label, '\n    actual  :', a, '\n    expected:', e); }
}

console.log('Test 1: new id is added');
{
  const server = [];
  const writes = [{ id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' }];
  const r = mergeItems(server, writes);
  eq(r.applied, ['a'], 'applied=[a]');
  eq(r.skipped, [], 'skipped=[]');
  eq(r.next.length, 1, 'next.length=1');
}

console.log('Test 2: newer overwrites older');
{
  const server = [{ id: 'a', type: 'flight', title: 'OLD', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T09:00:00Z' }];
  const writes = [{ id: 'a', type: 'flight', title: 'NEW', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' }];
  const r = mergeItems(server, writes);
  eq(r.applied, ['a'], 'applied=[a]');
  eq(r.next[0].title, 'NEW', 'title=NEW');
}

console.log('Test 3: older is skipped (stale)');
{
  const server = [{ id: 'a', type: 'flight', title: 'NEW', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' }];
  const writes = [{ id: 'a', type: 'flight', title: 'OLD', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T09:00:00Z' }];
  const r = mergeItems(server, writes);
  eq(r.applied, [], 'applied=[]');
  eq(r.skipped, [{ id: 'a', reason: 'stale' }], 'skipped=[{a,stale}]');
  eq(r.next[0].title, 'NEW', 'title=NEW (unchanged)');
}

console.log('Test 4: tombstone wins over older edit');
{
  const server = [{ id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T09:00:00Z' }];
  const writes = [{ id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z', deletedAt: '2026-06-18T10:00:00Z' }];
  const r = mergeItems(server, writes);
  eq(r.applied, ['a'], 'applied=[a] (tombstone)');
  eq(r.next[0].deletedAt, '2026-06-18T10:00:00Z', 'deletedAt set');
}

console.log('Test 5: invalid timestamp is skipped');
{
  const server = [{ id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' }];
  const writes = [{ id: 'a', type: 'flight', title: 'X', startAt: '2026-01-01T00:00:00', updatedAt: 'not-a-date' }];
  const r = mergeItems(server, writes);
  eq(r.skipped, [{ id: 'a', reason: 'invalid-timestamp' }], 'skipped=invalid-timestamp');
}

console.log('Test 6: mixed batch');
{
  const server = [
    { id: 'a', type: 'flight', title: 'A', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T09:00:00Z' },
    { id: 'b', type: 'hotel', title: 'B', startAt: '2026-01-02T00:00:00', updatedAt: '2026-06-18T11:00:00Z' },
  ];
  const writes = [
    { id: 'a', type: 'flight', title: 'A2', startAt: '2026-01-01T00:00:00', updatedAt: '2026-06-18T10:00:00Z' },
    { id: 'b', type: 'hotel', title: 'B2', startAt: '2026-01-02T00:00:00', updatedAt: '2026-06-18T10:00:00Z' },
    { id: 'c', type: 'train', title: 'C', startAt: '2026-01-03T00:00:00', updatedAt: '2026-06-18T12:00:00Z' },
  ];
  const r = mergeItems(server, writes);
  eq(r.applied.sort(), ['a', 'c'], 'applied=[a,c]');
  eq(r.skipped, [{ id: 'b', reason: 'stale' }], 'skipped=[b,stale]');
  eq(r.next.length, 3, 'next.length=3');
}

console.log('Test 7: equal timestamp is stale (server wins)');
{
  const ts = '2026-06-18T10:00:00Z';
  const server = [{ id: 'a', type: 'flight', title: 'SERVER', startAt: '2026-01-01T00:00:00', updatedAt: ts }];
  const writes = [{ id: 'a', type: 'flight', title: 'CLIENT', startAt: '2026-01-01T00:00:00', updatedAt: ts }];
  const r = mergeItems(server, writes);
  eq(r.applied, [], 'applied=[]');
  eq(r.skipped, [{ id: 'a', reason: 'stale' }], 'skipped=[{a,stale}]');
  eq(r.next[0].title, 'SERVER', 'server value preserved');
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
