import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { del, get, list, put } from '@vercel/blob';

const ACCESS = 'private';
const META_PREFIX = 'submissions/';
const SESSION_SECONDS = 60 * 60 * 12;

export function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export function clean(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function submissionFrom(form) {
  if (clean(form.get('website'), 20)) throw new Error('Invalid submission');
  const type = clean(form.get('submissionType'), 10);
  const name = clean(form.get('name'), 60);
  const place = clean(form.get('place'), 100);
  if (!['story', 'photo'].includes(type) || !name || !place || form.get('permission') !== 'on') throw new Error('Please complete every required field.');
  const id = randomUUID();
  const base = { id, type, status: 'pending', name, place, language: clean(form.get('language'), 5) || 'en', createdAt: new Date().toISOString() };
  if (type === 'story') {
    const age = clean(form.get('age'), 30);
    const body = clean(form.get('story'), 2500);
    if (!age || body.length < 40) throw new Error('Please provide an age and a story of at least 40 characters.');
    return { ...base, age, title: body.slice(0, 48), excerpt: body.slice(0, 140), body };
  }
  const body = clean(form.get('caption'), 500);
  const photo = form.get('photo');
  if (!body || !(photo instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 4 * 1024 * 1024) throw new Error('Please provide a JPG, PNG, or WebP image smaller than 4 MB.');
  return { ...base, body, photo, photoType: photo.type };
}

export async function saveSubmission(item) {
  const saved = { ...item };
  if (item.photo) {
    const extension = item.photo.type === 'image/png' ? 'png' : item.photo.type === 'image/webp' ? 'webp' : 'jpg';
    saved.photoPath = `photos/${item.id}.${extension}`;
    delete saved.photo;
    await put(saved.photoPath, item.photo, { access: ACCESS });
  }
  await writeSubmission(saved);
  return saved;
}

export async function writeSubmission(item) {
  await put(`${META_PREFIX}${item.id}.json`, JSON.stringify(item), {
    access: ACCESS,
    contentType: 'application/json',
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

async function readBlob(pathname) {
  const result = await get(pathname, { access: ACCESS, useCache: false });
  if (!result) return null;
  return JSON.parse(await new Response(result.stream).text());
}

export async function readSubmission(id) {
  if (!/^[0-9a-f-]{36}$/.test(id || '')) return null;
  return readBlob(`${META_PREFIX}${id}.json`);
}

export async function listSubmissions() {
  const items = [];
  let cursor;
  do {
    const page = await list({ prefix: META_PREFIX, limit: 1000, cursor });
    items.push(...(await Promise.all(page.blobs.map(blob => readBlob(blob.pathname)))).filter(Boolean));
    cursor = page.cursor;
  } while (cursor);
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function removeSubmission(item) {
  await del([`${META_PREFIX}${item.id}.json`, ...(item.photoPath ? [item.photoPath] : [])]);
}

export async function readPhoto(item) {
  if (!item?.photoPath) return null;
  return get(item.photoPath, { access: ACCESS, useCache: false });
}

function secret() {
  return process.env.ADMIN_PASSWORD || '';
}

function signature(expires) {
  return createHmac('sha256', secret()).update(String(expires)).digest('hex');
}

export function passwordsMatch(candidate) {
  const expected = Buffer.from(secret());
  const actual = Buffer.from(String(candidate || ''));
  return expected.length > 0 && expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function sessionCookie() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `rain_admin=${expires}.${signature(expires)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function isAdmin(request) {
  const match = request.headers.get('cookie')?.match(/(?:^|;\s*)rain_admin=([^;]+)/);
  if (!match || !secret()) return false;
  const [expiresText, supplied] = match[1].split('.');
  const expires = Number(expiresText);
  const expected = signature(expiresText);
  if (!Number.isFinite(expires) || expires < Date.now() / 1000 || supplied?.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export const clearSessionCookie = 'rain_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

export function publicItem(item) {
  const result = { id: item.id, type: item.type, name: item.name, place: item.place, body: item.body, createdAt: item.createdAt };
  if (item.type === 'story') Object.assign(result, { age: item.age, title: item.title, excerpt: item.excerpt });
  else result.photoUrl = `/api/media?id=${encodeURIComponent(item.id)}`;
  return result;
}
