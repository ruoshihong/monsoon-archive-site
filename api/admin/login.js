import { clearSessionCookie, isAdmin, json, passwordsMatch, sessionCookie } from '../_lib.js';

export async function GET(request) {
  return json({ authenticated: isAdmin(request) });
}

export async function POST(request) {
  const { password } = await request.json().catch(() => ({}));
  if (!passwordsMatch(password)) return json({ error: '密码错误' }, 401);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie() });
}

export async function DELETE() {
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie });
}
