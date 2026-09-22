import { forwardRef, useCallback, useEffect, useRef } from 'react';
import { clampBox, effectiveBox, isValidBox, sortedKeys } from '../utils/bbox';

/**
 * Multi-speaker canvas stage.
 * Props: meta, frame, tracks, speakers, activeId, tool, lockSize,
 *        onCommitBox(frame, box, speakerId), onDeleteBox(speakerId),
 *        onSelectSpeaker(id), videoRef, onFrameChange
 */
const VideoStage = forwardRef(function VideoStage(
  { meta, frame, tracks, speakers, activeId, hiddenIds, tool, lockSize,
    onCommitBox, onDeleteBox, onSelectSpeaker, videoRef, onFrameChange },
  canvasRef,
) {
  const drag = useRef(null);
  const tempBox = useRef(null);

  const speakerColor = (id) => (speakers.find((s) => s.id === id) || {}).color || '#fff';
  const speakerName = (id) => (speakers.find((s) => s.id === id) || {}).name || id;

  const drawBox = (ctx, rect, vid, box, color, name, isActive, drawing) => {
    const sx = rect.width / vid.videoWidth;
    const sy = rect.height / vid.videoHeight;
    const [x1, y1, x2, y2] = [box[0] * sx, box[1] * sy, box[2] * sx, box[3] * sy];
    const w = x2 - x1;
    const h = y2 - y1;
    ctx.save();
    if (!isActive) ctx.globalAlpha = 0.55;

    if (isActive) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      for (const t of [1 / 3, 2 / 3]) {
        ctx.beginPath(); ctx.moveTo(x1 + w * t, y1); ctx.lineTo(x1 + w * t, y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1, y1 + h * t); ctx.lineTo(x2, y1 + h * t); ctx.stroke();
      }
    }

    ctx.strokeStyle = drawing ? '#f5a623' : color;
    ctx.lineWidth = isActive ? 2.2 : 1.6;
    ctx.strokeRect(x1, y1, w, h);

    // name tag
    ctx.font = '12px system-ui';
    const tw = ctx.measureText(name).width;
    ctx.fillStyle = color;
    ctx.fillRect(x1, Math.max(0, y1 - 22), tw + 14, 20);
    ctx.fillStyle = '#06130c';
    ctx.fillText(name, x1 + 7, Math.max(0, y1 - 22) + 14);

    if (isActive) {
      ctx.fillStyle = '#ffffff';
      for (const [cx, cy] of [[x1, y1], [x2, y1], [x1, y2], [x2, y2]]) {
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (typeof ctx.roundRect === 'function') {
        const pill = (cx, cy, horiz) => {
          const pw = horiz ? 26 : 8;
          const ph = horiz ? 8 : 26;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(cx - pw / 2, cy - ph / 2, pw, ph, 4);
          ctx.fill();
        };
        pill((x1 + x2) / 2, y1, true);
        pill((x1 + x2) / 2, y2, true);
        pill(x1, (y1 + y2) / 2, false);
        pill(x2, (y1 + y2) / 2, false);
      }
    }
    ctx.restore();
  };

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    const vid = videoRef.current;
    if (!cv || !vid || !vid.videoWidth) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = cv.getBoundingClientRect();
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // others first (dimmed), active last (on top); hidden speakers skipped
    const ordered = [...speakers].sort((a, b) => (a.id === activeId ? 1 : b.id === activeId ? -1 : 0));
    let anyBox = false;
    for (const sp of ordered) {
      if (hiddenIds && hiddenIds[sp.id]) continue;
      const t = tracks[sp.id] || {};
      const { box } = effectiveBox(t, frame);
      const shown = sp.id === activeId && tempBox.current ? tempBox.current : box;
      if (shown && shown.length === 4) {
        anyBox = true;
        drawBox(ctx, rect, vid, shown, sp.color, sp.name, sp.id === activeId, !!tempBox.current && sp.id === activeId);
      }
    }
    if (!anyBox) {
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(10, 10, 150, 28);
      ctx.fillStyle = '#f26d6d';
      ctx.font = '13px system-ui';
      ctx.fillText('NO BOX HERE', 20, 29);
    }
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    const label = 'FRAME ' + frame;
    ctx.font = '12px system-ui';
    const tw = ctx.measureText(label).width;
    ctx.fillRect(10, rect.height - 32, tw + 20, 24);
    ctx.fillStyle = '#fff';
    ctx.fillText(label, 20, rect.height - 15);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, videoRef, frame, tracks, speakers, activeId]);

  /** Size video to fill the stage (preserving aspect), then match canvas. */
  const fit = useCallback(() => {
    const cv = canvasRef.current;
    const vid = videoRef.current;
    if (!cv || !vid || !vid.videoWidth) return;
    const stage = cv.closest('.stage');
    if (stage) {
      const availW = Math.max(80, stage.clientWidth - 12);
      const availH = Math.max(80, stage.clientHeight - 12);
      const scale = Math.min(availW / vid.videoWidth, availH / vid.videoHeight);
      const w = Math.max(50, Math.floor(vid.videoWidth * scale));
      const h = Math.max(50, Math.floor(vid.videoHeight * scale));
      vid.style.width = w + 'px';
      vid.style.height = h + 'px';
    }
    const rect = vid.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.max(2, Math.round(rect.width * dpr));
    cv.height = Math.max(2, Math.round(rect.height * dpr));
    cv.style.width = rect.width + 'px';
    cv.style.height = rect.height + 'px';
    draw();
  }, [canvasRef, videoRef, draw]);

  useEffect(() => {
    const cv = canvasRef.current;
    const stage = cv && cv.closest('.stage');
    if (!stage || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => fit());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [fit]);

  useEffect(() => {
    draw();
  }, [draw, frame, tool]);

  useEffect(() => {
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [fit]);

  const toNative = (e) => {
    const cv = canvasRef.current;
    const vid = videoRef.current;
    const r = cv.getBoundingClientRect();
    return [
      Math.round(((e.clientX - r.left) / r.width) * vid.videoWidth),
      Math.round(((e.clientY - r.top) / r.height) * vid.videoHeight),
    ];
  };

  const dispBox = (e, box) => {
    const cv = canvasRef.current;
    const vid = videoRef.current;
    const r = cv.getBoundingClientRect();
    const sx = r.width / vid.videoWidth;
    const sy = r.height / vid.videoHeight;
    return { r, mx: e.clientX - r.left, my: e.clientY - r.top,
             x1: box[0] * sx, y1: box[1] * sy, x2: box[2] * sx, y2: box[3] * sy };
  };

  /** Topmost visible speaker box under cursor (active first). */
  const pickSpeaker = (e) => {
    const ordered = [...speakers].sort((a, b) => (a.id === activeId ? 1 : b.id === activeId ? -1 : 0));
    for (const sp of ordered) {
      if (hiddenIds && hiddenIds[sp.id]) continue;
      const { box } = effectiveBox(tracks[sp.id] || {}, frame);
      if (!box) continue;
      const { mx, my, x1, y1, x2, y2 } = dispBox(e, box);
      if (mx >= x1 - 6 && mx <= x2 + 6 && my >= y1 - 6 && my <= y2 + 6) return sp;
    }
    return null;
  };

  const grabHandle = (e, box) => {
    const { mx, my, x1, y1, x2, y2 } = dispBox(e, box);
    if (!lockSize) {
      const pts = { tl: [x1, y1], tr: [x2, y1], bl: [x1, y2], br: [x2, y2] };
      for (const [name, [cx, cy]] of Object.entries(pts)) {
        if (Math.hypot(cx - mx, cy - my) < 13) return { zone: 'corner', corner: name };
      }
      const ex = (x1 + x2) / 2;
      const ey = (y1 + y2) / 2;
      if (Math.abs(mx - ex) < 16 && (Math.abs(my - y1) < 9 || Math.abs(my - y2) < 9))
        return { zone: 'edge', edge: my < ey ? 't' : 'b' };
      if (Math.abs(my - ey) < 16 && (Math.abs(mx - x1) < 9 || Math.abs(mx - x2) < 9))
        return { zone: 'edge', edge: mx < ex ? 'l' : 'r' };
    }
    if (mx >= x1 && mx <= x2 && my >= y1 && my <= y2) return { zone: 'inside' };
    return null;
  };

  const onMouseDown = (e) => {
    const vid = videoRef.current;
    if (!vid.videoWidth) return;
    const [nx, ny] = toNative(e);

    if (tool === 'delete') {
      const sp = pickSpeaker(e);
      if (sp) onDeleteBox(sp.id);
      return;
    }

    const sp = pickSpeaker(e);
    if (sp && (tool === 'move' || tool === 'resize' || tool === 'draw')) {
      if (sp.id !== activeId) onSelectSpeaker(sp.id);
      const { box } = effectiveBox(tracks[sp.id] || {}, frame);
      const grab = grabHandle(e, box);
      if (tool === 'resize') {
        if (grab && grab.zone !== 'inside') {
          drag.current = { mode: 'resize', grab, src: [...box], speakerId: sp.id };
          return;
        }
        return; // resize tool: ignore plain clicks
      }
      if (grab && grab.zone !== 'inside' && tool === 'draw') {
        drag.current = { mode: 'resize', grab, src: [...box], speakerId: sp.id };
        return;
      }
      // move (or draw-tool drag inside)
      drag.current = { mode: 'move', off: [nx - box[0], ny - box[1]], speakerId: sp.id };
      return;
    }
    // empty area
    if (tool === 'draw') {
      drag.current = { mode: 'draw', start: [nx, ny], speakerId: activeId };
      tempBox.current = null;
    }
  };

  const onMouseMove = (e) => {
    if (!drag.current) return;
    const vid = videoRef.current;
    const [nx, ny] = toNative(e);
    const d = drag.current;
    const t = tracks[d.speakerId] || {};
    const { box } = effectiveBox(t, frame);
    if (d.mode === 'draw') {
      const [sx2, sy2] = d.start;
      tempBox.current = [Math.min(sx2, nx), Math.min(sy2, ny), Math.max(sx2, nx), Math.max(sy2, ny)];
    } else if (d.mode === 'move' && box) {
      const w = box[2] - box[0];
      const h = box[3] - box[1];
      const x1 = Math.max(0, Math.min(vid.videoWidth - 1, nx - d.off[0]));
      const y1 = Math.max(0, Math.min(vid.videoHeight - 1, ny - d.off[1]));
      tempBox.current = [x1, y1, Math.min(vid.videoWidth - 1, x1 + w), Math.min(vid.videoHeight - 1, y1 + h)];
    } else if (d.mode === 'resize' && d.src) {
      let [x1, y1, x2, y2] = d.src;
      const g = d.grab;
      if (g.zone === 'corner') {
        if (g.corner === 'tl') { x1 = nx; y1 = ny; }
        if (g.corner === 'tr') { x2 = nx; y1 = ny; }
        if (g.corner === 'bl') { x1 = nx; y2 = ny; }
        if (g.corner === 'br') { x2 = nx; y2 = ny; }
      } else {
        if (g.edge === 't') y1 = ny;
        if (g.edge === 'b') y2 = ny;
        if (g.edge === 'l') x1 = nx;
        if (g.edge === 'r') x2 = nx;
      }
      tempBox.current = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
    }
    draw();
  };

  const endDrag = useCallback(() => {
    if (!drag.current) return;
    const vid = videoRef.current;
    if (tempBox.current) {
      const clamped = clampBox(tempBox.current, vid.videoWidth, vid.videoHeight);
      if (isValidBox(clamped)) onCommitBox(frame, clamped, drag.current.speakerId);
    }
    tempBox.current = null;
    drag.current = null;
    draw();
  }, [draw, frame, onCommitBox, videoRef]);

  useEffect(() => {
    window.addEventListener('mouseup', endDrag);
    return () => window.removeEventListener('mouseup', endDrag);
  }, [endDrag]);

  return (
    <div className="stage">
      <div className="stage-box">
        <video
          ref={videoRef}
          src="/api/video"
          preload="auto"
          playsInline
          onLoadedMetadata={fit}
          onSeeked={() => onFrameChange(Math.round(videoRef.current.currentTime * meta.fps))}
          onTimeUpdate={() => {
            if (!videoRef.current.paused) onFrameChange(Math.round(videoRef.current.currentTime * meta.fps));
          }}
        />
        <canvas ref={canvasRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} />
      </div>
    </div>
  );
});

export default VideoStage;
