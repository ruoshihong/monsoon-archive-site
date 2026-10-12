import { isAdmin, json, readPhoto, readSubmission } from './_lib.js';

export async function GET(request) {
  const item = await readSubmission(new URL(request.url).searchParams.get('id'));
  if (!item || (item.status !== 'approved' && !isAdmin(request))) return json({ error: 'Not found' }, 404);
  const photo = await readPhoto(item);
  if (!photo) return json({ error: 'Not found' }, 404);
  return new Response(photo.stream, { headers: { 'Content-Type': item.photoType || 'image/jpeg', 'Cache-Control': item.status === 'approved' ? 'public, max-age=3600' : 'private, no-store' } });
}
