// クライアント側のパスワード保存を一元化する (D-034 マジックリンク認証)。
// 保存先は localStorage (端末ごとに 1 回セットすれば永続)。
// `#key=<ADMIN_PASSWORD>` 付き URL を開くと自動保存される。

const PASSWORD_KEY = 'italia-gohan-chat-password';

/**
 * URL フラグメント `#key=...` からパスワードを取り込んで localStorage に保存し、
 * URL から即座に除去する。各ページのクライアントスクリプト冒頭で呼ぶこと。
 * クエリ (`?key=`) ではなくフラグメントを使うのは、サーバー・アクセスログに
 * 送信されないため。旧 sessionStorage 保存分もここで localStorage へ移行する。
 */
export function bootstrapPasswordFromUrl(): void {
  // #key= を優先しつつ ?key= も受け付ける。メッセージアプリ (LINE 等) のリンク自動検出は
  // `#` の手前で切れることがあり、フラグメントが届かないケースの保険 (D-034 追補)。
  let key: string | null = null;
  const hashMatch = window.location.hash.match(/[#&]key=([^&]+)/);
  if (hashMatch) {
    try {
      key = decodeURIComponent(hashMatch[1]);
    } catch {
      key = hashMatch[1];
    }
  }
  const params = new URLSearchParams(window.location.search);
  if (!key) key = params.get('key');
  if (key) {
    try {
      localStorage.setItem(PASSWORD_KEY, key);
    } catch {
      // プライベートブラウズ等で localStorage が使えない場合は従来の入力 UI にフォールバック
    }
    params.delete('key');
    // LINE の外部ブラウザ強制パラメータ (openExternalBrowser=1) も役目を終えているので除去
    params.delete('openExternalBrowser');
    const qs = params.toString();
    history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }

  // sessionStorage 時代 (〜D-033) の保存分を移行
  try {
    const legacy = sessionStorage.getItem(PASSWORD_KEY);
    if (legacy) {
      if (!localStorage.getItem(PASSWORD_KEY)) localStorage.setItem(PASSWORD_KEY, legacy);
      sessionStorage.removeItem(PASSWORD_KEY);
    }
  } catch {
    /* noop */
  }
}

export function getPassword(): string | null {
  return localStorage.getItem(PASSWORD_KEY);
}

export function setPassword(p: string): void {
  localStorage.setItem(PASSWORD_KEY, p);
}

export function clearPassword(): void {
  localStorage.removeItem(PASSWORD_KEY);
  try {
    sessionStorage.removeItem(PASSWORD_KEY);
  } catch {
    /* noop */
  }
}
