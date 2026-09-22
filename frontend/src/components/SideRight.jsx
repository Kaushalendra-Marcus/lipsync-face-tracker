import { PinIcon, TrashIcon } from './icons';
import { boxToXywh, xywhToBox } from '../utils/bbox';

/** Right column: 4. Keyframe Controls + 5. Playback. */
export default function SideRight({
  frame, total, effBox, onSeek, onSetKeyframe, onClearKeyframe, onClearAll,
  onCommitBox, onAbsent, onReturns, onPrev, onNext,
}) {
  const { x, y, w, h } = boxToXywh(effBox);

  const num = (v, setter) => ({
    value: v,
    onChange: (e) => {
      const n = Number(e.target.value);
      if (!Number.isFinite(n)) return;
      setter(n);
    },
  });

  const setField = (key, n) => {
    const cur = { x: 0, y: 0, w: 50, h: 50, ...boxToXywh(effBox) };
    const nx = { ...cur, [key]: Math.round(n) };
    if (nx.w < 3 || nx.h < 3) return;
    onCommitBox(frame, xywhToBox(nx.x, nx.y, nx.w, nx.h));
  };

  return (
    <div className="rightcol">
      <section className="panel">
        <h3>4. Keyframe Controls</h3>
        <button className="wide primary" onClick={onSetKeyframe}><PinIcon /> Set Keyframe (K)</button>
        <button className="wide" onClick={onClearKeyframe}><TrashIcon /> Clear Keyframe</button>
        <button className="wide danger-ghost" onClick={onClearAll} title="Delete ALL keyframes of this speaker">
          <TrashIcon /> Clear All (this speaker)
        </button>
        <div className="btn-row">
          <button className="wide" onClick={onAbsent}>Speaker Absent</button>
        </div>
        <div className="btn-row">
          <button className="wide" onClick={onReturns}>Speaker Returns</button>
        </div>
        <label className="fld">Current Frame
          <input
            type="number" min={0} max={Math.max(0, total - 1)} value={frame}
            onChange={(e) => onSeek(Number(e.target.value))}
          />
        </label>
        <div className="fld">Bounding Box</div>
        <div className="xywh">
          <label>X <input type="number" {...num(x, (n) => setField('x', n))} /></label>
          <label>Y <input type="number" {...num(y, (n) => setField('y', n))} /></label>
          <label>Width <input type="number" min={3} {...num(w, (n) => setField('w', n))} /></label>
          <label>Height <input type="number" min={3} {...num(h, (n) => setField('h', n))} /></label>
        </div>
        {!effBox && <p className="dim small">No box at this frame — draw one (B) or mark absent.</p>}
      </section>

      <section className="panel">
        <h3>5. Playback</h3>
        <div className="step-grid">
          <button onClick={() => onSeek(frame - 1)}>Prev Frame (←)</button>
          <button onClick={() => onSeek(frame + 1)}>Next Frame (→)</button>
          <button onClick={() => onSeek(frame - 10)}>-10 Frames</button>
          <button onClick={() => onSeek(frame + 10)}>+10 Frames</button>
        </div>
      </section>
    </div>
  );
}
