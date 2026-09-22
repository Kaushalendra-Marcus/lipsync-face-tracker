import { useEffect, useMemo, useRef } from 'react';
import { coverageSegments, sortedKeys } from '../utils/bbox';

/**
 * Bottom multitrack timeline: ruler + filmstrip + one lane per speaker
 * with coverage segments, diamond keyframes and a red playhead.
 */
export default function Timeline({ total, speakers, tracks, frame, onSeek, onDeleteKey, zoom, onZoom, thumbs }) {
  const scrollRef = useRef(null);
  const pxPerFrame = zoom; // zoom slider directly = px per frame

  const rulerMarks = useMemo(() => {
    if (!total) return [];
    const step = Math.max(1, Math.round(120 / pxPerFrame / 10) * 10 || 50);
    const marks = [];
    for (let f = 0; f < total; f += step) marks.push(f);
    if (marks[marks.length - 1] !== total - 1) marks.push(total - 1);
    return marks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, Math.round(pxPerFrame * 10)]);

  const width = Math.max(100, (total - 1) * pxPerFrame);

  // follow playhead
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const x = frame * pxPerFrame;
    if (x < el.scrollLeft + 40 || x > el.scrollLeft + el.clientWidth - 80) {
      el.scrollLeft = Math.max(0, x - el.clientWidth / 2);
    }
  }, [frame, pxPerFrame]);

  return (
    <section className="panel timeline-panel">
      <div className="tl-head">
        <h3>6. Timeline</h3>
        <div className="legend">
          {speakers.map((s) => (
            <span key={s.id}><i className="diamond" style={{ background: s.color }} />= {s.name} Keyframe</span>
          ))}
          <span><i className="swatch" />= No Detection</span>
        </div>
      </div>
      <div className="tl-scroll" ref={scrollRef}>
        <div className="tl-inner" style={{ width: width + 160 }}>
          <div className="tl-ruler">
            {rulerMarks.map((f) => (
              <span key={f} style={{ left: 120 + f * pxPerFrame }}>{f}</span>
            ))}
          </div>
          <div className="tl-row">
            <span className="tl-label">Video</span>
            <div className="tl-strip" style={{ width }}>
              {thumbs.map((t, i) => (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                <img key={i} src={t.url} alt="" onClick={() => onSeek(t.frame)} />
              ))}
            </div>
          </div>
          {speakers.map((s) => (
            <Lane
              key={s.id}
              speakerId={s.id}
              name={s.name}
              color={s.color}
              track={tracks[s.id] || {}}
              total={total}
              width={width}
              pxPerFrame={pxPerFrame}
              onSeek={onSeek}
              onDeleteKey={onDeleteKey}
            />
          ))}
          <div className="playhead" style={{ left: 120 + frame * pxPerFrame }} />
        </div>
      </div>
      <div className="tl-zoom">
        <span>Zoom</span>
        <input type="range" min={0.4} max={6} step={0.1} value={zoom} onChange={(e) => onZoom(Number(e.target.value))} />
      </div>
    </section>
  );
}

function Lane({ speakerId, name, color, track, total, width, pxPerFrame, onSeek, onDeleteKey }) {
  const segs = coverageSegments(track, total);
  const keys = sortedKeys(track);
  return (
    <div className="tl-row">
      <span className="tl-label">{name}</span>
      <div
        className="tl-lane"
        style={{ width }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onSeek(Math.round((e.clientX - r.left) / pxPerFrame));
        }}
      >
        {segs.map((s, i) =>
          s.box ? (
            <span
              key={i}
              className="seg"
              style={{ left: s.from * pxPerFrame, width: Math.max(2, (s.to - s.from + 1) * pxPerFrame), background: color }}
            />
          ) : null,
        )}
        {keys.map((k) => (
          <span
            key={k}
            className="diamond big"
            style={{ left: k * pxPerFrame, background: color }}
            title={'Keyframe ' + k + ' — right-click to delete'}
            onClick={(e) => { e.stopPropagation(); onSeek(k); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteKey && onDeleteKey(k, speakerId); }}
          />
        ))}
      </div>
    </div>
  );
}
