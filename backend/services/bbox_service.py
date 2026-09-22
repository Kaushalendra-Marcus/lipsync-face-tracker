"""Keyframe model + forward-fill logic.

Spec recap:
- Every manual box edit is a keyframe at the current frame.
- Each keyframe's box is copied forward UNCHANGED until the next keyframe.
- `None` keyframe means "absent from here" -> exports [] until next box keyframe.
- Frames before the first keyframe export as [].
- No interpolation anywhere.
"""
from __future__ import annotations


def sanitize_box(raw, width: int, height: int) -> list[int] | None:
    """Clamp raw [x1,y1,x2,y2] to frame bounds. Returns None if unusable."""
    try:
        x1, y1, x2, y2 = [int(round(float(v))) for v in raw]
    except (TypeError, ValueError):
        return None
    x1 = max(0, min(x1, width - 1))
    y1 = max(0, min(y1, height - 1))
    x2 = max(0, min(x2, width - 1))
    y2 = max(0, min(y2, height - 1))
    if x2 <= x1:
        x2 = min(width - 1, x1 + 2)
    if y2 <= y1:
        y2 = min(height - 1, y1 + 2)
    if x2 <= x1 or y2 <= y1:
        return None
    return [x1, y1, x2, y2]


def parse_keyframes(raw: dict, total: int, width: int, height: int) -> dict[int, list[int] | None]:
    """raw: {frame: [x1,y1,x2,y2] | None}. Returns cleaned {frame: box|None}."""
    clean: dict[int, list[int] | None] = {}
    for key, value in (raw or {}).items():
        try:
            frame = int(key)
        except (TypeError, ValueError):
            continue
        if frame < 0 or frame >= total:
            continue
        if value is None:
            clean[frame] = None
        else:
            box = sanitize_box(value, width, height)
            if box is not None:
                clean[frame] = box
    return clean


def build_full_list(raw_keyframes: dict, total: int, width: int, height: int):
    """Forward-fill keyframes into one entry per source frame.

    Returns (full_list, sorted_keyframes).
    Raises ValueError on empty / all-absent input.
    """
    clean = parse_keyframes(raw_keyframes, total, width, height)
    if not clean:
        raise ValueError(
            "No keyframes provided. Draw a box on the first frame where the speaker is present."
        )
    if not any(v is not None for v in clean.values()):
        raise ValueError("All keyframes are 'absent'. Need at least one visible box keyframe.")

    ordered = sorted(clean.keys())
    full: list[list[int]] = []
    current: list[int] | None = None
    ptr = 0
    for frame in range(total):
        while ptr < len(ordered) and ordered[ptr] <= frame:
            current = clean[ordered[ptr]]
            ptr += 1
        full.append(list(current) if current is not None else [])
    return full, ordered


def stats_for(full: list) -> dict:
    with_box = sum(1 for b in full if len(b) == 4)
    return {
        "total_frames": len(full),
        "frames_with_box": with_box,
        "frames_absent": len(full) - with_box,
    }
