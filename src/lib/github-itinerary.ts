import { Octokit } from '@octokit/rest';
import type { ItineraryItem } from '../types/itinerary.js';

const OWNER = process.env.GITHUB_OWNER ?? 'shintaro-kawa';
const REPO = process.env.GITHUB_REPO ?? 'italia-gohan-map';
const FILE_PATH = 'data/itinerary.json';
const BRANCH = 'main';

function client() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');
  return new Octokit({ auth: token });
}

export async function fetchItinerary(): Promise<{ data: ItineraryItem[]; sha: string }> {
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
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) throw new Error('itinerary.json is not an array');
  return { data: parsed as ItineraryItem[], sha: res.data.sha };
}

async function writeItinerary(
  items: ItineraryItem[],
  sha: string,
  commitMessage: string,
): Promise<{ commitSha: string }> {
  const gh = client();
  const newContent = JSON.stringify(items, null, 2) + '\n';
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
  return { commitSha: res.data.commit.sha ?? 'unknown' };
}

export async function upsertItineraryItem(item: ItineraryItem): Promise<{ commitSha: string; id: string }> {
  const { data: existing, sha } = await fetchItinerary();
  const idx = existing.findIndex((x) => x.id === item.id);
  const next = [...existing];
  if (idx >= 0) {
    next[idx] = item;
  } else {
    next.push(item);
  }
  const message =
    idx >= 0
      ? `Update itinerary item ${item.id} (${item.type})`
      : `Add itinerary item ${item.id} (${item.type})`;
  const { commitSha } = await writeItinerary(next, sha, message);
  return { commitSha, id: item.id };
}

export async function deleteItineraryItem(id: string): Promise<{ commitSha: string; id: string }> {
  const { data: existing, sha } = await fetchItinerary();
  const next = existing.filter((x) => x.id !== id);
  if (next.length === existing.length) {
    throw new Error(`No itinerary item with id ${id}`);
  }
  const { commitSha } = await writeItinerary(next, sha, `Delete itinerary item ${id}`);
  return { commitSha, id };
}
