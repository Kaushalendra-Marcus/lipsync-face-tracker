"""Video probing helpers (metadata + mime). Single place for all cv2 probing."""
from __future__ import annotations

import mimetypes
import os

import cv2


def get_metadata(video_path: str) -> dict:
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")
    try:
        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or fps != fps:  # NaN guard
            fps = 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if total <= 0:
            raise RuntimeError("Could not determine frame count (unsupported container?)")
        return {
            "fps": float(fps),
            "width": width,
            "height": height,
            "total_frames": total,
            "duration_sec": total / fps if fps else 0.0,
            "basename": os.path.basename(video_path),
        }
    finally:
        cap.release()


def guess_mime(video_path: str) -> str:
    mime, _ = mimetypes.guess_type(video_path)
    return mime or "video/mp4"
