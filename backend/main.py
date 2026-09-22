"""Entry point: python -m backend.main --video FILE [--port 5000] [--outdir outputs]"""
from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import create_app  # noqa: E402
from backend.services import video_service  # noqa: E402


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Video bbox annotation tool (modular Flask + React)")
    parser.add_argument("--video", default=None,
                        help="Path to input video (.mp4/.mov). If omitted, resumes last uploaded video.")
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--outdir", default="outputs")
    return parser.parse_args(argv)


def _resume_video(outdir: str) -> str | None:
    try:
        with open(os.path.join(os.path.abspath(outdir), ".last_video")) as handle:
            path = handle.read().strip()
        return path if path and os.path.exists(path) else None
    except OSError:
        return None


def main(argv=None) -> None:
    args = parse_args(argv)
    video = args.video or _resume_video(args.outdir)
    if not video or not os.path.exists(video):
        print("ERROR: no video. Pass --video /path/to/file.mp4", file=sys.stderr)
        raise SystemExit(1)
    meta = video_service.get_metadata(os.path.abspath(video))
    print(f"Video: {os.path.abspath(video)}")
    print(f"Metadata: {json.dumps(meta, indent=2)}")
    print(f"Outputs -> {os.path.abspath(args.outdir)}/speaker_bbox.pkl + speaker_bbox_preview.mp4")
    print(f"Open http://{args.host}:{args.port} (build frontend first: cd frontend && npm run build)")
    app = create_app(video, args.outdir)
    app.run(host=args.host, port=args.port, debug=False, threaded=True)


if __name__ == "__main__":
    main()
