/** Keyframe math (mirrors backend/services/bbox_service.py). */

export function sortedKeys(keyframes) {
  return Object.keys(keyframes).map(Number).sort((a, b) => a - b);
}

/** Effective box at frame f: last keyframe <= f. Returns {box, keyFrame} (box may be null). */
export function effectiveBox(keyframes, f) {
  const ks = sortedKeys(keyframes);
  let best = -1;
  for (const k of ks) {
    if (k <= f) best = k;
    else break;
  }
  if (best < 0) return { box: null, keyFrame: -1 };
  return { box: keyframes[best], keyFrame: best };
}

export function clampBox(box, vw, vh) {
  let [x1, y1, x2, y2] = box.map(Math.round);
  x1 = Math.max(0, Math.min(vw - 1, x1));
  y1 = Math.max(0, Math.min(vh - 1, y1));
  x2 = Math.max(0, Math.min(vw - 1, x2));
  y2 = Math.max(0, Math.min(vh - 1, y2));
  return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
}

export function isValidBox(box) {
  return box && box.length === 4 && box[2] - box[0] >= 3 && box[3] - box[1] >= 3;
}

/** Coverage segments for timeline rendering: [{from, to, box|null}]. */
export function coverageSegments(keyframes, total) {
  const ks = sortedKeys(keyframes);
  if (!ks.length || total <= 0) return [];
  const segs = [];
  let prev = 0;
  let cur = null;
  // gap before first keyframe
  if (ks[0] > 0) segs.push({ from: 0, to: ks[0] - 1, box: null });
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    if (i > 0 && prev < k) segs.push({ from: prev, to: k - 1, box: cur });
    cur = keyframes[k];
    prev = k;
  }
  segs.push({ from: prev, to: total - 1, box: cur });
  return segs;
}

export function slugify(name, fallback = 'speaker') {
  const s = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  if (s === 'speaker_1') return 'speaker';
  return s || fallback;
}

export function xywhToBox(x, y, w, h) {
  return [Math.round(x), Math.round(y), Math.round(x + w), Math.round(y + h)];
}

export function boxToXywh(box) {
  if (!box || box.length !== 4) return { x: '', y: '', w: '', h: '' };
  return { x: box[0], y: box[1], w: box[2] - box[0], h: box[3] - box[1] };
}
