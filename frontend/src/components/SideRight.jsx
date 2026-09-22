import { EyeIcon, EyeReturnIcon, PinIcon, TrashIcon } from './icons';
import { boxToXywh, xywhToBox } from '../utils/bbox';

/** Right column: 4. Keyframe Controls + 5. Playback. */
export default function SideRight({
  frame, total, effBox, isKey, speakerName, onSeek, onSetKeyframe,
  onClearKeyframe, onClearAll, onCommitBox, onAbsent, onReturns,
}) {
  const { x, y, w, h } = boxToXywh(effBox);

  const setField = (key, raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const cur = { x: 0, y: 0, w: 50, h: 50, ...boxToXywh(effBox) };
    const nx = { ...cur, [key]: Math.round(n) };
    if (nx.w < 3 || nx.h < 3) return;
    onCommitBox(frame, xywhToBox(nx.x, nx.y, nx.w, nx.h));
  };

  const status = !effBox
    ? { label: 'Absent', cls: 'st-absent' }
    : isKey
      ? { label: `Keyframe @ ${frame}`, cls: 'st-key' }
      : { label: 'Tracked', cls: 'st-tracked' };

  return (
    <div className="rightcol">
      <section className="panel">
        <h3>4. Keyframe Controls</h3>
        <div className="kf-status">
          <span className={'chip ' + status.cls}>{status.label}</span>
          <span className="dim small">{speakerName}</span>
        </div>

        <button className="wide primary" onClick={onSetKeyframe}><PinIcon /> Set Keyframe (K)</button>

        <div className="btn-grid">
          <button onClick={onAbsent}><EyeIcon /> Absent</button>
          <button onClick={onReturns}><EyeReturnIcon /> Returns</button>
          <button onClick={onClearKeyframe}><TrashIcon /> Clear key</button>
          <button className="danger" onClick={onClearAll} title="Delete ALL keyframes of this speaker">
            <TrashIcon /> Clear all
          </button>
        </div>

        <div className="frame-go">
          <label>Frame
            <input
              type="number" min={0} max={Math.max(0, total - 1)} value={frame}
              onChange={(e) => onSeek(Number(e.target.value))}
            />
          </label>
          <span className="dim">/ {Math.max(0, total - 1)}</span>
        </div>

        <div className="fld">Bounding Box</div>
        <div className="xywh">
          <label>X<input type="number" value={x} onChange={(e) => setField('x', e.target.value)} /></label>
          <label>Y<input type="number" value={y} onChange={(e) => setField('y', e.target.value)} /></label>
          <label>W<input type="number" min={3} value={w} onChange={(e) => setField('w', e.target.value)} /></label>
          <label>H<input type="number" min={3} value={h} onChange={(e) => setField('h', e.target.value)} /></label>
        </div>
        {!effBox && <p className="dim small">No box here — draw one (B) or mark absent.</p>}
      </section>

      <section className="panel">
        <h3>5. Playback</h3>
        <div className="step-grid">
          <button onClick={() => onSeek(frame - 1)}>← Prev</button>
          <button onClick={() => onSeek(frame + 1)}>Next →</button>
          <button onClick={() => onSeek(frame - 10)}>-10</button>
          <button onClick={() => onSeek(frame + 10)}>+10</button>
        </div>
      </section>
    </div>
  );
}
