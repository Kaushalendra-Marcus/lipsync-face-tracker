"""Flask app factory."""
from __future__ import annotations

from flask import Flask

from .config import AppConfig
from .routes import api as api_routes
from .routes import views as view_routes


def create_app(video_path: str, outdir: str) -> Flask:
    app = Flask(__name__)
    app.config["APP_CONFIG"] = AppConfig(video_path=video_path, outdir=outdir)
    app.register_blueprint(api_routes.bp)
    app.register_blueprint(view_routes.bp)
    return app
