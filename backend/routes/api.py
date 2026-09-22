"""JSON + video API routes."""
from __future__ import annotations

import os
import re

from flask import Blueprint, current_app, jsonify, request, send_file

from ..services import export_service
from ..services import video_service

bp = Blueprint("api", __name__)

_LABEL_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def _cfg():
    return current_app.config["APP_CONFIG"]


def _label_from(data: dict) -> str:
    raw = str(data.get("label") or "speaker").strip() or "speaker"
    raw = raw.replace(" ", "_")
    if not _LABEL_RE.match(raw):
        return "speaker"
    return raw


@bp.get("/api/metadata")
def metadata():
    cfg = _cfg()
    return jsonify(video_service.get_metadata(cfg.video_path))


@bp.get("/api/video")
def video():
    cfg = _cfg()
    return send_file(cfg.video_path, mimetype=video_service.guess_mime(cfg.video_path),
                     conditional=True)


@bp.post("/api/upload")
def upload():
    cfg = _cfg()
    if "file" not in request.files:
        return jsonify({"error": "no file part"}), 400
    handle = request.files["file"]
    if not handle.filename:
        return jsonify({"error": "empty filename"}), 400
    try:
        prev = video_service.get_metadata(cfg.video_path)
        prev_info = {"basename": prev["basename"], "total_frames": prev["total_frames"]}
    except Exception:
        prev_info = None
    dest = os.path.join(cfg.outdir, "uploaded_" + handle.filename)
    handle.save(dest)
    cfg.video_path = os.path.abspath(dest)
    _remember_video(cfg)
    return jsonify({"ok": True, "video_path": cfg.video_path,
                    "prev_video": prev_info,
                    "metadata": video_service.get_metadata(cfg.video_path)})


def _remember_video(cfg) -> None:
    """Persist current video so restarts don't silently revert to startup file."""
    try:
        with open(os.path.join(cfg.outdir, ".last_video"), "w") as handle:
            handle.write(cfg.video_path)
    except OSError:
        pass


@bp.post("/api/export")
def export():
    cfg = _cfg()
    data = request.get_json(force=True) or {}
    label = _label_from(data)
    meta = video_service.get_metadata(cfg.video_path)
    try:
        result = export_service.run_export(
            cfg.video_path, cfg.outdir, data.get("keyframes", {}),
            meta["width"], meta["height"], meta["total_frames"], label=label)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result)


@bp.post("/api/export_all")
def export_all():
    cfg = _cfg()
    data = request.get_json(force=True) or {}
    raw_tracks = data.get("tracks", {}) or {}
    meta = video_service.get_metadata(cfg.video_path)
    tracks = {}
    seen = set()
    for _id, spec in raw_tracks.items():
        base = _label_from({"label": (spec or {}).get("label", "speaker")})
        label, i = base, 2
        while label in seen:
            label, i = f"{base}_{i}", i + 1
        seen.add(label)
        tracks[label] = {
            "keyframes": (spec or {}).get("keyframes", {}),
            "color": (spec or {}).get("color", "#22c55e"),
            "name": str((spec or {}).get("name", label))[:40],
        }
    try:
        result = export_service.run_export_all(
            cfg.video_path, cfg.outdir, tracks,
            meta["width"], meta["height"], meta["total_frames"])
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    return jsonify(result)


@bp.get("/api/download/<name>")
def download(name: str):
    cfg = _cfg()
    allowed = (
        name in ("speaker_bbox.pkl", "speaker_bbox_preview.mp4")
        or re.match(r"^[A-Za-z0-9_-]{1,64}_bbox\.pkl$", name)
        or re.match(r"^[A-Za-z0-9_-]{1,64}_bbox_preview\.mp4$", name)
    )
    if not allowed:
        return jsonify({"error": "unknown file"}), 404
    path = os.path.join(cfg.outdir, name)
    if not os.path.exists(path):
        return jsonify({"error": "not exported yet"}), 404
    return send_file(path, as_attachment=True)


# Backwards-compatible aliases for the old single-file UI (harmless to keep).
@bp.get("/metadata")
def metadata_legacy():
    return metadata()


@bp.get("/video")
def video_legacy():
    return video()


@bp.post("/export")
def export_legacy():
    return export()


@bp.get("/download/<name_legacy>")
def download_legacy(name_legacy: str):
    return download(name_legacy)
