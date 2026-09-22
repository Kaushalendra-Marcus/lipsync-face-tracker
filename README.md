# Video BBox Tool — FDE Assignment Section 1

Local app to track **one speaker** with keyframed bounding boxes for lip-sync.
Stack: **React (Vite) frontend + modular Flask backend (Python)**.

## Structure

```
video_bbox_app/
├── backend/
│   ├── main.py              # entry point + CLI (--video/--port/--outdir)
│   ├── __init__.py          # Flask app factory (create_app)
│   ├── config.py            # AppConfig (paths, ports, output filenames)
│   ├── routes/
│   │   ├── api.py           # /api/metadata, /api/video, /api/upload, /api/export, /api/download
│   │   └── views.py         # serves React build (frontend/dist)
│   └── services/
│       ├── video_service.py # cv2 probing: fps/size/frame-count, mime
│       ├── bbox_service.py  # keyframe model + forward-fill (NO interpolation)
│       └── export_service.py# pickle + MP4 preview from the same box list
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── App.jsx          # layout + state wiring + shortcuts
│   │   ├── components/      # VideoStage, TransportBar, Toolbar, KeyframePanel
│   │   ├── hooks/           # useKeyframes (store + localStorage persist)
│   │   └── utils/           # bbox math, api wrappers
│   └── dist/                # production build (served by Flask)
├── backend/
│   ├── .venv/               # python env (tumne yahan banaya hai)
│   └── requirements.txt
└── README.md
```

Each layer is independent — UI changes stay in `frontend/src`, export logic in
`services/export_service.py`, keyframe rules in `services/bbox_service.py`.

## Features (maps to assignment spec)

- Load local video, play / pause / seek / frame-by-frame + frame number.
- Draw, move, resize box on canvas. **Every edit = keyframe** at current frame.
- Keyframe box **copied forward unchanged** until next keyframe. **No interpolation.**
- **Mark absent** → exports `[]` from that frame until a new visible keyframe.
- Export `speaker_bbox.pkl`: one item per source frame, `[x1,y1,x2,y2]` ints
  (top-left origin) or `[]` when absent.
- Preview `speaker_bbox_preview.mp4`: full source video with box + `FRAME n` burned in.

## Setup

```bash
# backend (venv backend/.venv me hai)
source backend/.venv/bin/activate
pip install -r backend/requirements.txt

# frontend (needs Node 18+)
cd frontend && npm install && npm run build && cd ..
```

## Run (single server — use this for the Loom demo)

```bash
source backend/.venv/bin/activate
python backend/main.py --video /path/to/multi_speker_demo.mov --port 5000 --outdir ./outputs
# open http://127.0.0.1:5000
```

Dev mode (hot reload UI):

```bash
# terminal 1
python backend/main.py --video /path/to/video.mp4 --port 5000
# terminal 2
cd frontend && npm run dev   # open http://127.0.0.1:5173 (proxies /api to Flask)
```

If the browser can't play `.mov`, remux without re-encoding:

```bash
ffmpeg -i multi_speker_demo.mov -c copy multi_speker_demo.mp4
```

## Annotate (fast path)

1. Scrub to first frame where your speaker appears → draw box (keyframe).
2. Step forward; adjust (move/resize) only when the old box stops fitting.
3. Speaker leaves / fully occluded → **Mark ABSENT**; on return → fresh box.
4. **Export** → `outputs/speaker_bbox.pkl` + `outputs/speaker_bbox_preview.mp4`.

Tip: no keyframe needed every frame — only where the box must change.

## Assumptions

- One speaker per annotation session (re-run per speaker for multi-speaker dubs).
- Constant FPS; `round(currentTime * fps)` is the frame index (±1 frame tolerance;
  OpenCV frame count is authoritative).
- Coordinates: top-left origin, `[x1,y1,x2,y2]` ints, clamped to frame bounds.

## Known limitations / future improvements

- Fully manual tracking (per spec). Next step: seed keyframes with a face
  detector (`services/` is ready for a `detect_service.py`), then hand-correct.
- No interpolation by design; fast motion needs denser keyframes.
- Preview is H.264 + AAC (browser-playable, source audio muxed via ffmpeg).
  If ffmpeg is missing on the machine, export falls back to a silent preview.
