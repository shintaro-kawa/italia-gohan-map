// マージロジックの最小検証スクリプト
// 実行: node --experimental-strip-types scripts/test-todos-merge.mjs  (Node 22+)
//        または: pnpm exec tsx scripts/test-todos-merge.mjs
// 終了コード 0 = 全 PASS、非0 = FAIL

import { mergeTodos } from '../src/lib/todos-merge.ts';

let pass = 0, fail = 0;
function eq(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) { pass++; console.log('  PASS:', label); }
  else { fail++; console.log('  FAIL:', label, '\n    actual  :', a, '\n    expected:', e); }
}

function makeTodo(id, title, updatedAt, opts = {}) {
  return {
    id, title, done: opts.done ?? false,
    createdAt: opts.createdAt ?? updatedAt,
    updatedAt,
    ...(opts.deletedAt ? { deletedAt: opts.deletedAt } : {}),
    ...(opts.city ? { city: opts.city } : {}),
  };
}

console.log('Test 1: new id is added');
{
  const server = [];
  const writes = [makeTodo('a', 'task A', '2026-06-23T10:00:00Z')];
  const r = mergeTodos(server, writes);
  eq(r.applied, ['a'], 'applied=[a]');
  eq(r.skipped, [], 'skipped=[]');
  eq(r.next.length, 1, 'next.length=1');
}

console.log('Test 2: newer overwrites older');
{
  const server = [makeTodo('a', 'OLD', '2026-06-23T09:00:00Z')];
  const writes = [makeTodo('a', 'NEW', '2026-06-23T10:00:00Z')];
  const r = mergeTodos(server, writes);
  eq(r.applied, ['a'], 'applied=[a]');
  eq(r.next[0].title, 'NEW', 'title=NEW');
}

console.log('Test 3: older is skipped (stale)');
{
  const server = [makeTodo('a', 'NEW', '2026-06-23T10:00:00Z')];
  const writes = [makeTodo('a', 'OLD', '2026-06-23T09:00:00Z')];
  const r = mergeTodos(server, writes);
  eq(r.applied, [], 'applied=[]');
  eq(r.skipped, [{ id: 'a', reason: 'stale' }], 'skipped=[{a,stale}]');
  eq(r.next[0].title, 'NEW', 'server preserved');
}

console.log('Test 4: tombstone wins over older edit');
{
  const server = [makeTodo('a', 'A', '2026-06-23T09:00:00Z')];
  const writes = [makeTodo('a', 'A', '2026-06-23T10:00:00Z', { deletedAt: '2026-06-23T10:00:00Z' })];
  const r = mergeTodos(server, writes);
  eq(r.applied, ['a'], 'applied=[a] (tombstone)');
  eq(r.next[0].deletedAt, '2026-06-23T10:00:00Z', 'deletedAt set');
}

console.log('Test 5: invalid timestamp is skipped');
{
  const server = [makeTodo('a', 'A', '2026-06-23T10:00:00Z')];
  const writes = [makeTodo('a', 'X', 'not-a-date')];
  const r = mergeTodos(server, writes);
  eq(r.skipped, [{ id: 'a', reason: 'invalid-timestamp' }], 'skipped=invalid-timestamp');
}

console.log('Test 6: mixed batch');
{
  const server = [
    makeTodo('a', 'A', '2026-06-23T09:00:00Z'),
    makeTodo('b', 'B', '2026-06-23T11:00:00Z'),
  ];
  const writes = [
    makeTodo('a', 'A2', '2026-06-23T10:00:00Z'),
    makeTodo('b', 'B2', '2026-06-23T10:00:00Z'),
    makeTodo('c', 'C', '2026-06-23T12:00:00Z'),
  ];
  const r = mergeTodos(server, writes);
  eq(r.applied.sort(), ['a', 'c'], 'applied=[a,c]');
  eq(r.skipped, [{ id: 'b', reason: 'stale' }], 'skipped=[b,stale]');
  eq(r.next.length, 3, 'next.length=3');
}

console.log('Test 7: equal timestamp is stale (server wins)');
{
  const ts = '2026-06-23T10:00:00Z';
  const server = [makeTodo('a', 'SERVER', ts)];
  const writes = [makeTodo('a', 'CLIENT', ts)];
  const r = mergeTodos(server, writes);
  eq(r.applied, [], 'applied=[]');
  eq(r.skipped, [{ id: 'a', reason: 'stale' }], 'skipped=[{a,stale}]');
  eq(r.next[0].title, 'SERVER', 'server value preserved');
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
