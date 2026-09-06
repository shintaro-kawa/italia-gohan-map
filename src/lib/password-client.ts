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
  const m = window.location.hash.match(/[#&]key=([^&]+)/);
  if (m) {
    try {
      localStorage.setItem(PASSWORD_KEY, decodeURIComponent(m[1]));
    } catch {
      // プライベートブラウズ等で localStorage が使えない場合は従来の入力 UI にフォールバック
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
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
