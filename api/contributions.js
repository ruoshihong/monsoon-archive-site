import { json, listSubmissions, publicItem } from './_lib.js';

export async function GET() {
  try {
    const items = (await listSubmissions()).filter(item => item.status === 'approved').map(publicItem);
    return json({ items });
  } catch (error) {
    console.error(error);
    return json({ error: 'Contributions are unavailable.' }, 503);
  }
}
