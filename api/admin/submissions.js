import { isAdmin, json, listSubmissions, readSubmission, removeSubmission, writeSubmission } from '../_lib.js';

function unauthorized() {
  return json({ error: 'Unauthorized' }, 401);
}

export async function GET(request) {
  if (!isAdmin(request)) return unauthorized();
  return json({ items: await listSubmissions() });
}

export async function PATCH(request) {
  if (!isAdmin(request)) return unauthorized();
  const { id, status } = await request.json().catch(() => ({}));
  if (status !== 'approved') return json({ error: 'Invalid status' }, 400);
  const item = await readSubmission(id);
  if (!item) return json({ error: 'Not found' }, 404);
  await writeSubmission({ ...item, status, approvedAt: new Date().toISOString() });
  return json({ ok: true });
}

export async function DELETE(request) {
  if (!isAdmin(request)) return unauthorized();
  const item = await readSubmission(new URL(request.url).searchParams.get('id'));
  if (!item) return json({ error: 'Not found' }, 404);
  await removeSubmission(item);
  return json({ ok: true });
}
