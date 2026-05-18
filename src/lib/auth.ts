/**
 * パスワード認証ユーティリティ。API ルートで使う。
 * クライアントは X-Admin-Password ヘッダーで送信。
 */

export function checkAuth(request: Request): { ok: true } | { ok: false; status: number; message: string } {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { ok: false, status: 500, message: 'ADMIN_PASSWORD not configured on server' };
  }
  const given = request.headers.get('x-admin-password');
  if (!given) {
    return { ok: false, status: 401, message: 'Missing X-Admin-Password header' };
  }
  if (given !== expected) {
    return { ok: false, status: 401, message: 'Invalid password' };
  }
  return { ok: true };
}
