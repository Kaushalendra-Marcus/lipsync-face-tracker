![FaceTrack Annotator](docs/banner.svg)

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue?logo=python)](https://www.python.org/)
[![React 18](https://img.shields.io/badge/react-18-61dafb?logo=react)](https://react.dev/)
[![Flask 3](https://img.shields.io/badge/flask-3.x-black?logo=flask)](https://flask.palletsprojects.com/)

# FaceTrack Annotator

Keyframe-based speaker tracking for lip-sync dubbing. Draw a box, step through
frames, mark absent segments, export a per-frame pickle + H.264 preview.

## Run

```bash
python3 -m venv backend/.venv && source backend/.venv/bin/activate
pip install -r backend/requirements.txt

cd frontend && npm install && npm run build && cd ..

python backend/main.py --video /path/to/video.mp4 --outdir ./outputs
# → http://127.0.0.1:5000
```

> `.mov` won't play in-browser? `ffmpeg -i in.mov -c copy out.mp4`

## Use

1. Scrub to the speaker's first frame → draw a box (`B`)
2. Step forward (`→`) → move / resize when it drifts — each edit is a keyframe
3. Speaker leaves → `N` (absent) · returns → restore or redraw
4. Wrong keyframe → `D` · Export → `E`

## Export

- `{name}_bbox.pkl` — one entry per frame: `[x1, y1, x2, y2]` or `[]`
- `{name}_bbox_preview.mp4` — same frames, box + frame number, H.264 + AAC

## Assignment notes

- Bounding boxes are stored in source-video pixel coordinates.
- Keyframes are forward-filled exactly, with no interpolation.
- Absent speaker frames export as `[]`.
- The exported pickle contains one item per source frame.
- Preview rendering uses the same expanded per-frame list as the pickle.

## Structure

```
video_bbox_app/
├── backend/
│   ├── main.py                 # CLI entry point (--video/--port/--outdir)
│   ├── config.py               # AppConfig (paths, output filenames)
│   ├── routes/
│   │   ├── api.py              # /api/metadata, /video, /upload, /export, /download
│   │   └── views.py            # serves the React build
│   └── services/
│       ├── video_service.py    # fps / size / frame-count probing
│       ├── bbox_service.py     # keyframe model + forward-fill
│       └── export_service.py   # pickle + H.264/AAC preview render
├── frontend/src/
│   ├── App.jsx                 # shell, shortcuts, project save/open
│   ├── components/
│   │   ├── TopBar.jsx          # brand, open/save, undo/redo, export
│   │   ├── SideLeft.jsx        # video info, speakers, annotation tools
│   │   ├── SideRight.jsx       # keyframe controls, numeric bbox, playback
│   │   ├── VideoStage.jsx      # video + canvas overlay (draw/move/resize)
│   │   ├── PlayerBar.jsx       # transport, speed, volume, fullscreen
│   │   ├── Timeline.jsx        # filmstrip + per-speaker lanes + playhead
│   │   ├── ExportPanel.jsx     # output name, export buttons, result modal
│   │   └── icons.jsx           # SVG icon set (no emoji)
│   ├── hooks/useTracks.js      # multi-speaker store + undo/redo
│   └── utils/                  # bbox math (bbox.js), api client (api.js)
└── docs/banner.svg
```

## Notes

- Forward-fill, no interpolation. Constant-FPS assumed.
- Manual tracking by design; detector seeding is the natural next step.
- Without FFmpeg, preview falls back to silent `mp4v`.
