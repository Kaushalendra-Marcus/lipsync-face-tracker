import { useState } from 'react';
import { DownloadIcon, FolderOpenIcon, GearIcon, LogoIcon, RedoIcon, SaveIcon, UndoIcon } from './icons';

/** Top application bar: brand + project actions. SVG only. */
export default function TopBar({ onOpenVideo, onSaveProject, onExport, exporting, canUndo, canRedo, onUndo, onRedo }) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-logo"><LogoIcon /></span>
        <div>
          <div className="brand-title">FaceTrack Annotator</div>
          <div className="brand-sub">Track faces. Create keyframes. Export for lip-sync.</div>
        </div>
      </div>
      <div className="top-actions">
        <button onClick={onOpenVideo}><FolderOpenIcon /> Open Video</button>
        <button onClick={onSaveProject}><SaveIcon /> Save Project</button>
        <button className="tool-icon" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"><UndoIcon /></button>
        <button className="tool-icon" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"><RedoIcon /></button>
        <button className="pill export" onClick={onExport} disabled={exporting}>
          <DownloadIcon /> {exporting ? 'Exporting…' : 'Export'}
        </button>
        <button className="tool-icon" onClick={() => setShowHelp((s) => !s)} title="Shortcuts"><GearIcon /></button>
      </div>
      {showHelp && (
        <div className="help-pop">
          <b>Shortcuts</b>
          <div>Space play/pause · ←/→ 1f · Shift 10f</div>
          <div>B draw · M move · R resize · Del delete tool</div>
          <div>K keyframe · N absent · D delete key · E export</div>
          <div>Ctrl+Z / Ctrl+Y undo / redo</div>
          <button onClick={() => setShowHelp(false)}>Close</button>
        </div>
      )}
    </header>
  );
}
