"""Export orchestration: pickle + rendered MP4 preview from the same box list.

Preview pipeline (two steps):
1. OpenCV draws boxes + frame numbers into a temp silent file.
2. ffmpeg transcodes to H.264 (browser-playable, unlike mp4v) and muxes the
   source audio track back in, so the preview has sound.
If ffmpeg is missing, falls back to the silent OpenCV file.
"""
from __future__ import annotations

import os
import pickle
import shutil
import subprocess
import tempfile

import cv2
import numpy as np

from .bbox_service import build_full_list, stats_for


def render_frames_silent(video_path: str, full_list: list, tmp_path: str) -> str:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video for preview: {video_path}")
    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or fps != fps:
            fps = 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(tmp_path, fourcc, fps, (width, height))
        if not out.isOpened():
            raise RuntimeError("Cannot open VideoWriter for preview (mp4v).")
        try:
            for frame_idx, box in enumerate(full_list):
                ret, frame = cap.read()
                if not ret:
                    frame = np.zeros((height, width, 3), dtype=np.uint8)
                if isinstance(box, (list, tuple)) and len(box) == 4:
                    x1, y1, x2, y2 = (int(v) for v in box)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                label = f"FRAME {frame_idx}"
                (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.9, 2)
                cv2.rectangle(frame, (8, 8), (8 + tw + 12, 8 + th + 12), (0, 0, 0), -1)
                cv2.putText(frame, label, (14, 14 + th), cv2.FONT_HERSHEY_SIMPLEX,
                            0.9, (255, 255, 255), 2, cv2.LINE_AA)
                out.write(frame)
        finally:
            out.release()
    finally:
        cap.release()
    return tmp_path


def transcode_with_audio(silent_path: str, source_path: str, final_path: str) -> bool:
    """H.264 + AAC mux. Returns True on success, False if ffmpeg unavailable/failed."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        return False
    cmd = [
        ffmpeg, "-y", "-v", "error",
        "-i", silent_path,
        "-i", source_path,
        "-map", "0:v:0", "-map", "1:a?",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "20",
        "-c:a", "aac", "-shortest", "-movflags", "+faststart",
        final_path,
    ]
    try:
        subprocess.run(cmd, check=True, timeout=600)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
        return False
    return os.path.exists(final_path)


def render_preview(video_path: str, full_list: list, preview_path: str) -> dict:
    """Render preview; returns {'has_audio': bool, 'codec_note': str}."""
    fd, tmp = tempfile.mkstemp(suffix="_silent.mp4")
    os.close(fd)
    try:
        render_frames_silent(video_path, full_list, tmp)
        if transcode_with_audio(tmp, video_path, preview_path):
            return {"has_audio": True, "codec_note": "h264+aac"}
        shutil.copyfile(tmp, preview_path)
        return {"has_audio": False, "codec_note": "mp4v-silent (ffmpeg missing/failed)"}
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def run_export(video_path: str, outdir: str, keyframes: dict,
               width: int, height: int, total: int, label: str = "speaker") -> dict:
    """Build full list, validate length, write pkl + preview. Returns result dict."""
    full, ordered = build_full_list(keyframes, total, width, height)
    if len(full) != total:
        raise RuntimeError(f"Export length {len(full)} != total {total}")
    os.makedirs(outdir, exist_ok=True)
    pkl_name = f"{label}_bbox.pkl"
    preview_name = f"{label}_bbox_preview.mp4"
    pkl_path = os.path.join(outdir, pkl_name)
    preview_path = os.path.join(outdir, preview_name)
    with open(pkl_path, "wb") as handle:
        pickle.dump(full, handle)
    info = render_preview(video_path, full, preview_path)
    result = {
        "ok": True,
        "label": label,
        "pkl_name": pkl_name,
        "preview_name": preview_name,
        "pkl_path": pkl_path,
        "preview_path": preview_path,
        "num_keyframes": len(ordered),
        "first_keyframe": ordered[0] if ordered else None,
        **info,
    }
    result.update(stats_for(full))
    return result
