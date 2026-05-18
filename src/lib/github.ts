import { Octokit } from '@octokit/rest';
import { createHash } from 'node:crypto';
import type { Restaurant } from '../types/restaurant.js';

const OWNER = process.env.GITHUB_OWNER ?? 'shintaro-kawa';
const REPO = process.env.GITHUB_REPO ?? 'italia-gohan-map';
const FILE_PATH = 'data/restaurants.json';
const BRANCH = 'main';

function client() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');
  return new Octokit({ auth: token });
}

function generateId(name: string, city: string): string {
  const hash = createHash('sha1').update(`${name}|${city}`).digest('hex').slice(0, 8);
  return `${city.toLowerCase()}-${hash}`;
}

export async function fetchCurrentData(): Promise<{ data: Restaurant[]; sha: string }> {
  const gh = client();
  const res = await gh.repos.getContent({
    owner: OWNER,
    repo: REPO,
    path: FILE_PATH,
    ref: BRANCH,
  });
  if (Array.isArray(res.data) || res.data.type !== 'file') {
    throw new Error('Expected file at ' + FILE_PATH);
  }
  const content = Buffer.from(res.data.content, 'base64').toString('utf-8');
  return { data: JSON.parse(content), sha: res.data.sha };
}

export async function appendRestaurant(candidate: Restaurant): Promise<{ id: string; commitSha: string }> {
  const gh = client();
  const { data: existing, sha } = await fetchCurrentData();

  // Generate id if missing
  const id = candidate.id || generateId(candidate.name, candidate.city);

  // Duplicate detection
  if (existing.some((r) => r.id === id || (r.name === candidate.name && r.city === candidate.city))) {
    throw new Error(`Duplicate restaurant: ${candidate.name} (${candidate.city})`);
  }

  const newEntry: Restaurant = { ...candidate, id };
  const updated = [...existing, newEntry];
  const newContent = JSON.stringify(updated, null, 2) + '\n';

  const commitMessage = `Add ${newEntry.name} (${newEntry.city}/${newEntry.genre}) via in-app chat`;

  const res = await gh.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: FILE_PATH,
    message: commitMessage,
    content: Buffer.from(newContent, 'utf-8').toString('base64'),
    sha,
    branch: BRANCH,
    committer: { name: 'Italia Gohan Bot', email: 'bot@italia-gohan.local' },
    author: { name: 'Italia Gohan Bot', email: 'bot@italia-gohan.local' },
  });

  return { id, commitSha: res.data.commit.sha ?? 'unknown' };
}
