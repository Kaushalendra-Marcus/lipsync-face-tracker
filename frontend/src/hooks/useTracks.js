import { useCallback, useRef, useState } from 'react';
import { effectiveBox, sortedKeys } from '../utils/bbox';

const LIMIT = 100;
const PALETTE = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6'];
const STORE_KEY = 'facetrack-project-v1';

function freshState() {
  return {
    speakers: [
      { id: 'sp1', name: 'Speaker 1', color: PALETTE[0] },
      { id: 'sp2', name: 'Speaker 2', color: PALETTE[1] },
    ],
    tracks: { sp1: {}, sp2: {} },
    activeId: 'sp1',
  };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (raw && Array.isArray(raw.speakers) && raw.tracks) return { ...freshState(), ...raw };
  } catch {
    /* ignore */
  }
  return freshState();
}

/**
 * Multi-speaker track store.
 * state = { speakers:[{id,name,color}], tracks:{id:{frame:box|null}}, activeId }
 * Single undo/redo history over the whole state.
 */
export function useTracks() {
  const [state, setState] = useState(load);
  const past = useRef([]);
  const future = useRef([]);

  const commit = useCallback(
    (next, record = true) => {
      if (record) {
        past.current.push(state);
        if (past.current.length > LIMIT) past.current.shift();
        future.current = [];
      }
      setState(next);
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [state],
  );

  const setActive = useCallback(
    (id) => commit({ ...state, activeId: id }),
    [state, commit],
  );

  const patchTrack = useCallback(
    (id, patch) => commit({ ...state, tracks: { ...state.tracks, [id]: patch } }),
    [state, commit],
  );

  const activeTrack = state.tracks[state.activeId] || {};

  const setBox = useCallback(
    (frame, box, id = state.activeId) =>
      patchTrack(id, { ...(state.tracks[id] || {}), [frame]: box }),
    [state, patchTrack],
  );

  const setAbsent = useCallback(
    (frame, id = state.activeId) =>
      patchTrack(id, { ...(state.tracks[id] || {}), [frame]: null }),
    [state, patchTrack],
  );

  const removeAt = useCallback(
    (frame, id = state.activeId) => {
      const t = state.tracks[id] || {};
      if (!Object.prototype.hasOwnProperty.call(t, frame)) return;
      const next = { ...t };
      delete next[frame];
      patchTrack(id, next);
    },
    [state, patchTrack],
  );

  const clearActive = useCallback(() => patchTrack(state.activeId, {}), [state, patchTrack]);

  /** Wipe tracks of ALL speakers (used on video switch). Keeps speaker list. */
  const clearAllTracks = useCallback(() => {
    const empty = {};
    for (const s of state.speakers) empty[s.id] = {};
    commit({ ...state, tracks: empty });
  }, [state, commit]);

  /** Delete the keyframe responsible for `frame`: exact key if present,
   *  else the source keyframe it was copied forward from. Returns deleted frame or null. */
  const removeSourceAt = useCallback(
    (frame, id = state.activeId) => {
      const t = state.tracks[id] || {};
      if (Object.prototype.hasOwnProperty.call(t, frame)) {
        const next = { ...t };
        delete next[frame];
        patchTrack(id, next);
        return frame;
      }
      const ks = sortedKeys(t).filter((k) => k <= frame);
      if (!ks.length) return null;
      const src = ks[ks.length - 1];
      const next = { ...t };
      delete next[src];
      patchTrack(id, next);
      return src;
    },
    [state, patchTrack],
  );

  const renameActive = useCallback(
    (name) => {
      const clean = String(name || '').slice(0, 40) || 'Speaker';
      commit({
        ...state,
        speakers: state.speakers.map((s) => (s.id === state.activeId ? { ...s, name: clean } : s)),
      });
    },
    [state, commit],
  );

  const addSpeaker = useCallback(() => {
    const n = state.speakers.length;
    const id = 'sp' + Date.now().toString(36);
    commit({
      ...state,
      speakers: [...state.speakers, { id, name: `Speaker ${n + 1}`, color: PALETTE[n % PALETTE.length] }],
      tracks: { ...state.tracks, [id]: {} },
      activeId: id,
    });
  }, [state, commit]);

  const removeSpeaker = useCallback(
    (id) => {
      if (state.speakers.length <= 1) return;
      const speakers = state.speakers.filter((s) => s.id !== id);
      const tracks = { ...state.tracks };
      delete tracks[id];
      commit({
        ...state,
        speakers,
        tracks,
        activeId: id === state.activeId ? speakers[0].id : state.activeId,
      });
    },
    [state, commit],
  );

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return false;
    future.current.push(state);
    setState(prev);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(prev));
    } catch {
      /* ignore */
    }
    return true;
  }, [state]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return false;
    past.current.push(state);
    setState(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return true;
  }, [state]);

  /** Restore most recent box of a speaker as fresh keyframe at frame. */
  const restoreLastBox = useCallback(
    (frame, id = state.activeId) => {
      const t = state.tracks[id] || {};
      const ks = sortedKeys(t);
      for (let i = ks.length - 1; i >= 0; i--) {
        const box = t[ks[i]];
        if (box && box.length === 4) {
          patchTrack(id, { ...t, [frame]: [...box] });
          return box;
        }
      }
      return null;
    },
    [state, patchTrack],
  );

  const replaceAll = useCallback((next) => commit({ ...freshState(), ...next }), [commit]);

  const keys = sortedKeys(activeTrack);
  const getEffective = useCallback((f) => effectiveBox(activeTrack, f), [activeTrack]);
  const speakerOf = useCallback((id) => state.speakers.find((s) => s.id === id), [state.speakers]);

  return {
    state, activeTrack, keys, getEffective, speakerOf,
    setActive, setBox, setAbsent, removeAt, removeSourceAt, clearActive, clearAllTracks,
    renameActive, addSpeaker, removeSpeaker,
    undo, redo, restoreLastBox, replaceAll,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
