import { Octokit } from '@octokit/rest';
import type { ItineraryItem } from '../types/itinerary.js';
import type { Todo } from '../types/todo.js';

const FILE_NAME = 'itinerary.json';

export interface GistContent {
  version: 1;
  items: ItineraryItem[];
  lastModifiedAt: string;
}

function client(): Octokit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN not configured');
  return new Octokit({ auth: token });
}

function gistId(): string {
  const id = process.env.ITINERARY_GIST_ID;
  if (!id) throw new Error('ITINERARY_GIST_ID not configured');
  return id;
}

/**
 * Private Gist から旅程データを取得。
 * 未初期化 (空ファイル) なら空の version=1 構造を返す。
 */
export async function fetchItineraryGist(): Promise<GistContent> {
  const gh = client();
  const res = await gh.gists.get({ gist_id: gistId() });
  const file = res.data.files?.[FILE_NAME];
  if (!file || !file.content) {
    return { version: 1, items: [], lastModifiedAt: new Date().toISOString() };
  }
  try {
    const parsed = JSON.parse(file.content);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.items)) {
      return parsed as GistContent;
    }
  } catch {
    // fall through
  }
  return { version: 1, items: [], lastModifiedAt: new Date().toISOString() };
}

/**
 * Private Gist の旅程データを更新。
 * 全置換 (差分更新ではない、呼び出し側が完全な items を渡す)。
 */
export async function updateItineraryGist(items: ItineraryItem[]): Promise<GistContent> {
  const gh = client();
  const content: GistContent = {
    version: 1,
    items,
    lastModifiedAt: new Date().toISOString(),
  };
  await gh.gists.update({
    gist_id: gistId(),
    files: {
      [FILE_NAME]: { content: JSON.stringify(content, null, 2) },
    },
  });
  return content;
}

const TODOS_FILE_NAME = 'todos.json';

export interface TodosGistContent {
  version: 1;
  todos: Todo[];
  lastModifiedAt: string;
}

/**
 * Private Gist から todos データを取得。
 * `todos.json` がまだ存在しない (初回) ケースでは空の構造を返す。
 */
export async function fetchTodosGist(): Promise<TodosGistContent> {
  const gh = client();
  const res = await gh.gists.get({ gist_id: gistId() });
  const file = res.data.files?.[TODOS_FILE_NAME];
  if (!file || !file.content) {
    return { version: 1, todos: [], lastModifiedAt: new Date().toISOString() };
  }
  try {
    const parsed = JSON.parse(file.content);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.todos)) {
      return parsed as TodosGistContent;
    }
  } catch {
    // fall through
  }
  return { version: 1, todos: [], lastModifiedAt: new Date().toISOString() };
}

/**
 * Private Gist の todos データを更新。`itinerary.json` には触らない。
 */
export async function updateTodosGist(todos: Todo[]): Promise<TodosGistContent> {
  const gh = client();
  const content: TodosGistContent = {
    version: 1,
    todos,
    lastModifiedAt: new Date().toISOString(),
  };
  await gh.gists.update({
    gist_id: gistId(),
    files: {
      [TODOS_FILE_NAME]: { content: JSON.stringify(content, null, 2) },
    },
  });
  return content;
}
