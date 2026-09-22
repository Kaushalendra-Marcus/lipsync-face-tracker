/** Thin fetch wrappers for the Flask API. */

export async function getMetadata() {
  const res = await fetch('/api/metadata');
  if (!res.ok) throw new Error('metadata failed: ' + res.statusText);
  return res.json();
}

export function videoUrl() {
  return '/api/video';
}

export async function exportKeyframes(keyframes, label = 'speaker') {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyframes, label }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export async function uploadVideo(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
