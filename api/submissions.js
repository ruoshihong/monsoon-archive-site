import { json, saveSubmission, submissionFrom } from './_lib.js';

export async function POST(request) {
  try {
    const item = submissionFrom(await request.formData());
    await saveSubmission(item);
    return json({ ok: true, id: item.id }, 201);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error && !error.message.includes('Blob') ? error.message : 'Submission storage is unavailable.';
    return json({ error: message }, 400);
  }
}
