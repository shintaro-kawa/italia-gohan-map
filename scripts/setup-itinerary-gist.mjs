#!/usr/bin/env node
// Private Gist を 1 つ作成し、ITINERARY_GIST_ID に設定すべき ID を出力する。
//
// ⚠ 一度だけ実行。再実行すると新しい Gist が作成され、ID 取り違えやオーファン
// Gist の原因になる。誤実行防止のため CONFIRM_CREATE=1 が必須。
//
// 実行: CONFIRM_CREATE=1 GITHUB_TOKEN=ghp_... node scripts/setup-itinerary-gist.mjs
//   (PowerShell)  $env:CONFIRM_CREATE='1'; $env:GITHUB_TOKEN='ghp_...'; node scripts/setup-itinerary-gist.mjs
//
// 前提: GITHUB_TOKEN に gist scope を含む PAT が設定されていること

import { Octokit } from '@octokit/rest';

if (process.env.CONFIRM_CREATE !== '1') {
  console.error('ERROR: This script creates a real private Gist. Re-running creates additional Gists.');
  console.error('To proceed, set CONFIRM_CREATE=1 in the same command:');
  console.error('  CONFIRM_CREATE=1 GITHUB_TOKEN=ghp_... node scripts/setup-itinerary-gist.mjs');
  console.error('  (PowerShell)  $env:CONFIRM_CREATE=\'1\'; $env:GITHUB_TOKEN=\'ghp_...\'; node scripts/setup-itinerary-gist.mjs');
  process.exit(1);
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('ERROR: GITHUB_TOKEN env var is required.');
  console.error('Hint: set in .env.local or pass inline: GITHUB_TOKEN=ghp_... node scripts/setup-itinerary-gist.mjs');
  process.exit(1);
}

const gh = new Octokit({ auth: token });

const initial = {
  version: 1,
  items: [],
  lastModifiedAt: new Date().toISOString(),
};

try {
  const res = await gh.gists.create({
    description: 'italia-gohan-map itinerary (private, do not share URL)',
    public: false,
    files: {
      'itinerary.json': { content: JSON.stringify(initial, null, 2) },
    },
  });
  const gistId = res.data.id ?? '(unknown)';
  const gistUrl = res.data.html_url ?? '(unknown)';
  console.log('');
  console.log('  ✓ Private Gist created');
  console.log('');
  console.log(`  Gist ID  : ${gistId}`);
  console.log(`  Gist URL : ${gistUrl}`);
  console.log('');
  console.log('  Next steps:');
  console.log('  1. Set Vercel env var ITINERARY_GIST_ID to the ID above:');
  console.log('     - Via CLI : vercel env add ITINERARY_GIST_ID production');
  console.log('     - Via UI  : https://vercel.com/dashboard → Settings → Environment Variables');
  console.log('  2. Add to local .env.local for testing:');
  console.log(`     ITINERARY_GIST_ID=${gistId}`);
  console.log('  3. Trigger Vercel redeploy (git push or manual)');
  console.log('');
} catch (e) {
  console.error('Failed to create gist:', e.message ?? e);
  if (e.message?.includes('scope')) {
    console.error('Hint: your PAT may be missing the `gist` scope. Edit at https://github.com/settings/tokens');
  }
  process.exit(2);
}
