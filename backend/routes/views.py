"""Serves the React SPA (frontend/dist) with fallback to index.html."""
from __future__ import annotations

import os

from flask import Blueprint, send_from_directory

bp = Blueprint("views", __name__)


def _dist_dir() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(os.path.dirname(here), "..", "frontend", "dist")


@bp.get("/")
def index():
    dist = _dist_dir()
    entry = os.path.join(dist, "index.html")
    if os.path.exists(entry):
        return send_from_directory(dist, "index.html")
    return (
        "<h3>Frontend not built yet</h3>"
        "<p>Run <code>cd frontend && npm install && npm run build</code>, "
        "then reload. API is live at <code>/api/metadata</code>.</p>",
        200,
    )


@bp.get("/<path:filename>")
def spa_static(filename: str):
    dist = _dist_dir()
    full = os.path.join(dist, filename)
    if os.path.exists(full) and os.path.isfile(full):
        return send_from_directory(dist, filename)
    entry = os.path.join(dist, "index.html")
    if os.path.exists(entry):
        return send_from_directory(dist, "index.html")
    return {"error": "frontend not built"}, 404
