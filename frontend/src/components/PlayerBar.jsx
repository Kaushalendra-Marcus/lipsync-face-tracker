import { FullscreenIcon, MuteIcon, PauseIcon, PlayIcon, StepBackIcon, StepFwdIcon, VolumeIcon } from './icons';

/** Transport row directly under the player. */
export default function PlayerBar({
  frame, total, timeLabel, durLabel, playing, onPlay,
  onPrev, onNext, progress, onScrub, speed, onSpeed,
  muted, onMute, onFullscreen, videoRef,
}) {
  return (
    <div className="playerbar">
      <input
        className="progress"
        type="range" min={0} max={Math.max(0, total - 1)} value={Math.min(frame, Math.max(0, total - 1))}
        onChange={(e) => onScrub(Number(e.target.value))}
        aria-label="Video progress"
      />
      <div className="transport-row">
        <button onClick={onPlay} title="Play/Pause (Space)">{playing ? <PauseIcon /> : <PlayIcon />}</button>
        <button onClick={onPrev} title="Previous frame"><StepBackIcon /></button>
        <button onClick={onNext} title="Next frame"><StepFwdIcon /></button>
        <button onClick={onMute} title="Mute">
          {muted ? <MuteIcon /> : <VolumeIcon />}
        </button>
        <span className="time">{timeLabel} / {durLabel}</span>
        <span className="frames">Frame: {frame} / {Math.max(0, total - 1)}</span>
        <span className="spacer" />
        <select value={speed} onChange={(e) => onSpeed(Number(e.target.value))} title="Playback speed">
          {[0.25, 0.5, 1, 1.5, 2].map((s) => (
            <option key={s} value={s}>{s}x</option>
          ))}
        </select>
        <button
          onClick={() => {
            const wrap = videoRef.current && videoRef.current.closest('.stage-box');
            if (wrap && wrap.requestFullscreen) wrap.requestFullscreen();
          }}
          title="Fullscreen"
        >
          <FullscreenIcon />
        </button>
      </div>
    </div>
  );
}
