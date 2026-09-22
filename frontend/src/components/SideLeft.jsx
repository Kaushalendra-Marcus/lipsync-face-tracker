import { CursorIcon, EyeIcon, EyeOffIcon, FolderOpenIcon, HandIcon, LockIcon, PlusIcon, ResizeIcon, TrashIcon, XIcon } from './icons';

/** Left column: 1. Video & Project, 2. Speaker Selection, 3. Annotation Tools. */
export default function SideLeft({
  meta, projectName, onProjectName,
  speakers, activeId, onSelect, onAddSpeaker, onRemoveSpeaker, onRename,
  tool, onTool, lockSize, onToggleLock, onOpenVideo, onOpenProject,
  hiddenIds, onToggleHide,
}) {
  return (
    <div className="leftcol">
      <section className="panel">
        <h3>1. Video &amp; Project</h3>
        <button className="wide" onClick={onOpenVideo}><FolderOpenIcon /> Load Video</button>
        <button className="wide ghost" onClick={onOpenProject}><FolderOpenIcon /> Open Project</button>
        <div className="file-meta">
          <b>{meta.basename || '—'}</b>
          <div><span>Duration:</span> {fmtDur(meta.total_frames, meta.fps)}</div>
          <div><span>FPS:</span> {Number(meta.fps).toFixed(meta.fps % 1 ? 2 : 0)}</div>
          <div><span>Total Frames:</span> {meta.total_frames}</div>
          <div><span>Resolution:</span> {meta.width} × {meta.height}</div>
        </div>
        <label className="fld">Project Name
          <input value={projectName} onChange={(e) => onProjectName(e.target.value)} />
        </label>
      </section>

      <section className="panel">
        <h3>2. Speaker Selection</h3>
        <div className="radios">
          {speakers.map((s, i) => (
            <label key={s.id} className="radio">
              <input
                type="radio"
                checked={s.id === activeId}
                onChange={() => onSelect(s.id)}
              />
              <span className="dot" style={{ background: s.color }} />
              {s.name}
              {speakers.length > 1 && (
                <button
                  className="mini-del"
                  title={'Remove ' + s.name}
                  onClick={(e) => { e.preventDefault(); onRemoveSpeaker(s.id); }}
                >
                  <XIcon />
                </button>
              )}
              {i < 2 && <small className="hint">{i === 0 ? '(Left)' : '(Right)'}</small>}
              <button
                className="mini-eye"
                title={(hiddenIds && hiddenIds[s.id] ? 'Show ' : 'Hide ') + s.name + ' on canvas'}
                onClick={(e) => { e.preventDefault(); onToggleHide(s.id); }}
              >
                {(hiddenIds && hiddenIds[s.id]) ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </label>
          ))}
        </div>
        <button className="wide" onClick={onAddSpeaker}><PlusIcon /> Add Speaker</button>
        <label className="fld">Label
          <input
            value={(speakers.find((s) => s.id === activeId) || {}).name || ''}
            onChange={(e) => onRename(e.target.value)}
          />
        </label>
      </section>

      <section className="panel">
        <h3>3. Annotation Tools</h3>
        <div className="tools">
          <ToolBtn active={tool === 'draw'} onClick={() => onTool('draw')} icon={<CursorIcon />} label="Draw Box (B)" primary />
          <ToolBtn active={tool === 'move'} onClick={() => onTool('move')} icon={<HandIcon />} label="Move (M)" />
          <ToolBtn active={tool === 'resize'} onClick={() => onTool('resize')} icon={<ResizeIcon />} label="Resize" />
          <ToolBtn active={tool === 'delete'} onClick={() => onTool('delete')} icon={<TrashIcon />} label="Delete (Del)" />
        </div>
        <label className={'check' + (lockSize ? ' on' : '')} title="Lock box size while moving">
          <input type="checkbox" checked={lockSize} onChange={onToggleLock} />
          <LockIcon /> Preserve Size
        </label>
      </section>
    </div>
  );
}

function ToolBtn({ active, onClick, icon, label, primary }) {
  return (
    <button className={'tool-wide' + (active ? ' active' : '') + (primary ? ' primary' : '')} onClick={onClick}>
      {icon} {label}
    </button>
  );
}

function fmtDur(total, fps) {
  if (!fps || !total) return '—';
  const s = Math.round(total / fps);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
