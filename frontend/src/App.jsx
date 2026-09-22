import { useCallback, useEffect, useRef, useState } from 'react';
import ExportPanel from './components/ExportPanel';
import PlayerBar from './components/PlayerBar';
import SideLeft from './components/SideLeft';
import SideRight from './components/SideRight';
import Timeline from './components/Timeline';
import TopBar from './components/TopBar';
import VideoStage from './components/VideoStage';
import { useTracks } from './hooks/useTracks';
import { exportKeyframes, getMetadata, uploadVideo, videoUrl } from './utils/api';
import { effectiveBox, slugify } from './utils/bbox';

function fmtClock(frame, fps) {
  if (!fps) return '00:00';
  const s = Math.floor(frame / fps);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function App() {
  const [meta, setMeta] = useState({ fps: 30, width: 0, height: 0, total_frames: 0, basename: '' });
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [msg, setMsg] = useState({ text: '', kind: '' });
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [tool, setTool] = useState('draw');
  const [lockSize, setLockSize] = useState(false);
  const [zoom, setZoom] = useState(1.2);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [projectName, setProjectName] = useState('podcast_tracking');
  const [outName, setOutName] = useState('speaker');
  const [thumbs, setThumbs] = useState([]);
  const [hiddenIds, setHiddenIds] = useState({});
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const projectFileRef = useRef(null);
  const capturedFor = useRef('');
  const tr = useTracks();

  const say = (text, kind = '') => setMsg({ text, kind });
  const active = tr.speakerOf(tr.state.activeId) || tr.state.speakers[0];
  const eff = effectiveBox(tr.activeTrack, frame);

  useEffect(() => {
    getMetadata().then(setMeta).catch((e) => say(String(e.message || e), 'err'));
  }, []);

  const clampFrame = useCallback(
    (f) => Math.max(0, Math.min(meta.total_frames - 1, f || 0)),
    [meta.total_frames],
  );

  const seek = useCallback(
    (f) => {
      const v = videoRef.current;
      if (!v || !meta.fps) return;
      const c = clampFrame(Math.round(f));
      v.pause();
      setPlaying(false);
      if (Math.abs(v.currentTime - c / meta.fps) > 1e-4) v.currentTime = c / meta.fps;
      setFrame(c);
    },
    [clampFrame, meta.fps],
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.playbackRate = speed;
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, [speed]);

  // filmstrip capture (once per video, low-res)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !meta.total_frames || capturedFor.current === meta.basename + meta.total_frames) return;
    capturedFor.current = meta.basename + meta.total_frames;
    let cancelled = false;
    (async () => {
      const wasMuted = v.muted;
      v.muted = true;
      v.pause();
      setPlaying(false);
      const N = 14;
      const cap = document.createElement('canvas');
      cap.width = 120;
      cap.height = 68;
      const ctx = cap.getContext('2d');
      const out = [];
      for (let i = 0; i < N; i++) {
        if (cancelled) return;
        const f = Math.round(((meta.total_frames - 1) * i) / (N - 1));
        v.currentTime = f / meta.fps;
        try {
          await new Promise((res, rej) => {
            const to = setTimeout(() => rej(new Error('seek timeout')), 4000);
            v.addEventListener('seeked', function h() {
              v.removeEventListener('seeked', h);
              clearTimeout(to);
              res();
            });
          });
        } catch {
          break;
        }
        if (cancelled) return;
        try {
          const vw = v.videoWidth || 16;
          const vh = v.videoHeight || 9;
          const s = Math.max(120 / vw, 68 / vh);
          const dw = vw * s;
          const dh = vh * s;
          ctx.drawImage(v, (120 - dw) / 2, (68 - dh) / 2, dw, dh);
          out.push({ frame: f, url: cap.toDataURL('image/jpeg', 0.6) });
        } catch {
          break;
        }
      }
      if (!cancelled) {
        setThumbs(out);
        v.currentTime = 0;
        setFrame(0);
      }
      v.muted = wasMuted;
    })();
    return () => {
      cancelled = true;
    };
  }, [meta]);

  const deleteBoxAt = useCallback((frame_, id) => {
    const gone = tr.removeSourceAt(frame_, id);
    const name = tr.speakerOf(id)?.name || '';
    if (gone === null) say(`No keyframe to delete for ${name} at/before frame ${frame_}`, 'err');
    else if (gone === frame_) say(`Deleted keyframe at ${gone} (${name})`, 'warn');
    else say(`Deleted source keyframe at ${gone} (${name}) — box was copied from there`, 'warn');
  }, [tr]);

  const toggleHide = useCallback((id) => {
    setHiddenIds((h) => ({ ...h, [id]: !h[id] }));
  }, []);

  const commitBox = useCallback(
    (f, box, id) => {
      tr.setBox(f, box, id || tr.state.activeId);
      say(`Keyframe at ${f} (${tr.speakerOf(id || tr.state.activeId)?.name}) — copied forward`, 'ok');
    },
    [tr],
  );

  const markAbsent = useCallback(() => {
    tr.setAbsent(frame);
    say(`Absent from frame ${frame} — exports empty until return`, 'warn');
  }, [tr, frame]);

  const markReturns = useCallback(() => {
    const box = tr.restoreLastBox(frame);
    if (box) say(`Returns at ${frame} — restored [${box}]`, 'ok');
    else say('No previous box to restore — draw one first (B)', 'err');
  }, [tr, frame]);

  const setKeyframe = useCallback(() => {
    if (eff.box) {
      tr.setBox(frame, [...eff.box]);
      say(`Keyframe pinned at ${frame}`, 'ok');
    } else {
      say('No box at this frame — draw one first (B)', 'err');
    }
  }, [tr, eff.box, frame]);

  const doExport = useCallback(async () => {
    if (!tr.keys.length) {
      say('Nothing to export — draw at least one box.', 'err');
      return;
    }
    setExporting(true);
    say('Exporting — forward fill plus H.264 preview with audio…', 'warn');
    try {
      const label = slugify(outName || active.name);
      const r = await exportKeyframes(tr.activeTrack, label);
      setResult(r);
      setShowResult(true);
      say(`Done: ${r.total_frames} frames (${r.frames_with_box} box, ${r.frames_absent} absent) → ${r.pkl_name}`, 'ok');
    } catch (e) {
      say('Export failed: ' + (e.message || e), 'err');
    } finally {
      setExporting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tr.activeTrack, tr.keys.length, outName]);

  const onUploadFile = async (file) => {
    try {
      say('Uploading video…', 'warn');
      const r = await uploadVideo(file);
      setMeta(r.metadata);
      capturedFor.current = '';
      setThumbs([]);
      setResult(null);
      setFrame(0);
      setHiddenIds({});
      tr.clearAllTracks();
      const v = videoRef.current;
      if (v) {
        v.pause();
        setPlaying(false);
        v.src = videoUrl() + '?t=' + Date.now();
        v.load();
      }
      say(`New video uploaded — ${(r.metadata.basename || '').replace(/^uploaded_/, '')}`, 'ok');
    } catch (e) {
      say('Upload failed: ' + (e.message || e), 'err');
    }
  };

  const saveProject = useCallback(() => {
    const data = {
      app: 'facetrack-annotator',
      version: 1,
      projectName,
      video: meta.basename,
      savedAt: new Date().toISOString(),
      state: tr.state,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (projectName || 'project').replace(/[^\w-]+/g, '_') + '.ftrack.json';
    a.click();
    URL.revokeObjectURL(a.href);
    say('Project saved', 'ok');
  }, [projectName, meta.basename, tr.state]);

  const openProject = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data.state || !data.state.speakers) throw new Error('not a FaceTrack project file');
      tr.replaceAll(data.state);
      if (data.projectName) setProjectName(data.projectName);
      say('Project loaded', 'ok');
    } catch (e) {
      say('Open failed: ' + (e.message || e), 'err');
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if ((tag === 'INPUT' && e.target.type !== 'range' && e.target.type !== 'checkbox') || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault(); tr.undo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault(); tr.redo(); return;
      }
      if (e.key === 'Escape' && showResult) { setShowResult(false); return; }
      const k = e.key.toLowerCase();
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowLeft') seek(frame - (e.shiftKey ? 10 : 1));
      else if (e.key === 'ArrowRight') seek(frame + (e.shiftKey ? 10 : 1));
      else if (k === 'b') setTool('draw');
      else if (k === 'm') setTool('move');
      else if (k === 'r') setTool('resize');
      else if (k === 'delete' || k === 'backspace') setTool('delete');
      else if (k === 'k') setKeyframe();
      else if (k === 'n') markAbsent();
      else if (k === 'd') deleteBoxAt(frame, tr.state.activeId);
      else if (k === 'e') doExport();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, seek, frame, tr, doExport, markAbsent, setKeyframe, showResult]);

  return (
    <div className="app">
      <TopBar
        onOpenVideo={() => fileRef.current && fileRef.current.click()}
        onSaveProject={saveProject}
        onExport={doExport}
        exporting={exporting}
        canUndo={tr.canUndo}
        canRedo={tr.canRedo}
        onUndo={tr.undo}
        onRedo={tr.redo}
      />
      <input ref={fileRef} type="file" accept="video/*" hidden
        onChange={(e) => e.target.files[0] && onUploadFile(e.target.files[0])} />
      <input ref={projectFileRef} type="file" accept="application/json" hidden
        onChange={(e) => e.target.files[0] && openProject(e.target.files[0])} />

      <div className="editor3">
        <SideLeft
          meta={meta}
          projectName={projectName}
          onProjectName={setProjectName}
          speakers={tr.state.speakers}
          activeId={tr.state.activeId}
          onSelect={tr.setActive}
          onAddSpeaker={tr.addSpeaker}
          onRemoveSpeaker={tr.removeSpeaker}
          onRename={tr.renameActive}
          tool={tool}
          onTool={setTool}
          lockSize={lockSize}
          onToggleLock={() => setLockSize((s) => !s)}
          onOpenVideo={() => fileRef.current && fileRef.current.click()}
          onOpenProject={() => projectFileRef.current && projectFileRef.current.click()}
          hiddenIds={hiddenIds}
          onToggleHide={toggleHide}
        />

        <section className="panel stage-panel">
          <h3 className="panel-title">Video Player</h3>
          <VideoStage
            ref={canvasRef}
            meta={meta}
            frame={frame}
            tracks={tr.state.tracks}
            speakers={tr.state.speakers}
            activeId={tr.state.activeId}
            hiddenIds={hiddenIds}
            tool={tool}
            lockSize={lockSize}
            onCommitBox={commitBox}
            onDeleteBox={(id) => deleteBoxAt(frame, id || tr.state.activeId)}
            onSelectSpeaker={tr.setActive}
            videoRef={videoRef}
            onFrameChange={(f) => setFrame(clampFrame(f))}
          />
          <PlayerBar
            frame={frame}
            total={meta.total_frames}
            timeLabel={fmtClock(frame, meta.fps)}
            durLabel={fmtClock(meta.total_frames - 1, meta.fps)}
            playing={playing}
            onPlay={togglePlay}
            onPrev={() => seek(frame - 1)}
            onNext={() => seek(frame + 1)}
            onScrub={seek}
            speed={speed}
            onSpeed={(s) => { setSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s; }}
            muted={muted}
            onMute={() => { setMuted((m) => { if (videoRef.current) videoRef.current.muted = !m; return !m; }); }}
            videoRef={videoRef}
          />
          {msg.text && <div className={'msg ' + msg.kind}>{msg.text}</div>}
        </section>

        <SideRight
          frame={frame}
          total={meta.total_frames}
          effBox={eff.box}
          isKey={Object.prototype.hasOwnProperty.call(tr.activeTrack, frame)}
          speakerName={active.name}
          onSeek={seek}
          onSetKeyframe={setKeyframe}
          onClearKeyframe={() => deleteBoxAt(frame, tr.state.activeId)}
          onClearAll={() => {
            if (!window.confirm(`Delete ALL keyframes of ${active.name}?`)) return;
            tr.clearActive();
            say(`Cleared all keyframes of ${active.name}`, 'warn');
          }}
          onCommitBox={(f, box) => commitBox(f, box, tr.state.activeId)}
          onAbsent={markAbsent}
          onReturns={markReturns}
        />
      </div>

      <Timeline
        total={meta.total_frames}
        speakers={tr.state.speakers}
        tracks={tr.state.tracks}
        frame={frame}
        onSeek={seek}
        onDeleteKey={(k, id) => deleteBoxAt(k, id)}
        zoom={zoom}
        onZoom={setZoom}
        thumbs={thumbs}
      />

      <ExportPanel
        outName={outName}
        onOutName={setOutName}
        onExportPkl={doExport}
        onExportPreview={doExport}
        exporting={exporting}
        result={result}
        showResult={showResult}
        onCloseResult={() => setShowResult(false)}
        onViewResult={() => setShowResult(true)}
      />
    </div>
  );
}
