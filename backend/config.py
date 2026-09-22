"""Central configuration for the bbox tool backend."""
from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class AppConfig:
    video_path: str
    outdir: str
    host: str = "127.0.0.1"
    port: int = 5000

    def __post_init__(self) -> None:
        self.video_path = os.path.abspath(self.video_path)
        self.outdir = os.path.abspath(self.outdir)
        os.makedirs(self.outdir, exist_ok=True)

    @property
    def pkl_path(self) -> str:
        return os.path.join(self.outdir, "speaker_bbox.pkl")

    @property
    def preview_path(self) -> str:
        return os.path.join(self.outdir, "speaker_bbox_preview.mp4")

    def pkl_path_for(self, label: str) -> str:
        return os.path.join(self.outdir, f"{label}_bbox.pkl")

    def preview_path_for(self, label: str) -> str:
        return os.path.join(self.outdir, f"{label}_bbox_preview.mp4")
