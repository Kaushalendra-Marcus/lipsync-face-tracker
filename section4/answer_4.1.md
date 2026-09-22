# Section 4.1 — Multi-speaker Hindi dub (ready to paste into the PDF)

## Approach

The video `two_people_sidebyside.mp4` (1216×1080, 30 fps, 1740 frames, 58 s)
shows two speakers side by side for the full duration. One lip-sync job cannot
cover both faces, so I prepared **two jobs — one per speaker** — each with the
same video, that speaker's Hindi audio, and that speaker's face track. Both
face tracks (and a combined preview) were created with the FaceTrack Annotator
built in Section 1 (`lipsync-face-tracker` repo).

## Input files used

| File | Role |
|------|------|
| `two_people_sidebyside.mp4` | Source video for both jobs |
| `speaker1_stem_1.wav` (stereo, 58 s) | Hindi audio — Speaker 1 (left, grey shirt) |
| `speaker2_stem_2.wav` (stereo, 58 s) | Hindi audio — Speaker 2 (right, red suit) |
| `speaker1_stem.wav` / `speaker2_stem.wav` (mono) | Original stems — reference only, not dubbed |

The `_1` / `_2` files are the Hindi dubs (stereo mixes, match the 58 s video
duration); the mono stems are the original-language reference.

## Face tracks created (verified)

| Track file | Frames | With box | Absent (`[]`) | Keyframes |
|------------|--------|----------|---------------|-----------|
| `speaker1_bbox.pkl` | 1740 | 481 | 1259 | speaking segments tracked, rest absent |
| `speaker2_bbox.pkl` | 1740 | 1013 | 727 | speaking segments tracked, rest absent |

Validation: `len(pickle.load(...)) == 1740` for both files; every entry is
`[x1, y1, x2, y2]` ints (top-left origin) or `[]`. Per-speaker previews
(`speaker1_preview.mp4`, `speaker2_preview.mp4`) and a combined preview
(`combined_preview.mp4`) are H.264 + AAC, rendered from the same per-frame
lists. `combined_preview.mp4` attached for review.

## Request payloads

```json
{
  "input": [
    { "type": "video", "url": "two_people_sidebyside.mp4" },
    { "type": "audio", "url": "speaker1_stem_1.wav", "refId": "audio_1" }
  ],
  "bounding_box_url": "speaker1_bbox.pkl",
  "output_filename": "speaker1_hindi_lipsync.mp4"
}
```

```json
{
  "input": [
    { "type": "video", "url": "two_people_sidebyside.mp4" },
    { "type": "audio", "url": "speaker2_stem_2.wav", "refId": "audio_1" }
  ],
  "bounding_box_url": "speaker2_bbox.pkl",
  "output_filename": "speaker2_hindi_lipsync.mp4"
}
```

## Notes

- Absent (`[]`) ranges = frames where that speaker is not the active speaker, so
  the original video is retained there and only speaking segments are dubbed.
- If the dub requires fully continuous tracks instead, re-export each speaker
  with boxes on all 1740 frames (static camera — one keyframe each suffices).
