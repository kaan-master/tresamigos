"""Compress brand MP4s for web and extract poster frames.

Targets: ~720p max, H.264 CRF 28, 24fps, no audio (site plays muted).
Writes next to originals, then replaces when smaller.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRS = [
    ROOT / "apps" / "web" / "public" / "assets" / "brand",
    ROOT / "assets" / "brand",
]

# Max long-edge; portrait clips stay portrait.
MAX_EDGE = 720
CRF = "28"
FPS = "24"


def find_ffmpeg() -> str:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise SystemExit("ffmpeg not found on PATH")
    return ffmpeg


def compress(ffmpeg: str, src: Path, dst: Path) -> None:
    # Cap height at MAX_EDGE (portrait → ~405x720; landscape → ~1280x720).
    scale = f"scale=-2:'min({MAX_EDGE},ih)'"
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(src),
        "-vf",
        f"fps={FPS},{scale}",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        CRF,
        "-profile:v",
        "main",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        "-an",
        str(dst),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def extract_poster(ffmpeg: str, src: Path, poster: Path) -> None:
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(src),
        "-ss",
        "0.3",
        "-frames:v",
        "1",
        "-q:v",
        "5",
        str(poster),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def mb(n: int) -> float:
    return round(n / (1024 * 1024), 2)


def process_dir(ffmpeg: str, directory: Path) -> None:
    if not directory.is_dir():
        print(f"skip missing: {directory}")
        return

    # Prefer short slug names; also compress long Instagram export names.
    videos = sorted(directory.glob("*.mp4"))
    seen_bytes: dict[int, Path] = {}

    for src in videos:
        size = src.stat().st_size
        # Skip exact duplicates of already-processed files in this folder.
        if size in seen_bytes and seen_bytes[size] != src:
            print(f"  duplicate skip {src.name} (= {seen_bytes[size].name})")
            continue

        tmp = src.with_suffix(".opt.mp4")
        poster = src.with_suffix(".jpg")
        print(f"  compress {src.name} ({mb(size)} MB)…")
        try:
            compress(ffmpeg, src, tmp)
        except subprocess.CalledProcessError as exc:
            print(f"    FAILED: {exc.stderr.decode(errors='replace')[:400]}")
            tmp.unlink(missing_ok=True)
            continue

        new_size = tmp.stat().st_size
        if new_size < size * 0.95:
            tmp.replace(src)
            print(f"    -> {mb(new_size)} MB ({round(100 * new_size / size)}%)")
        else:
            tmp.unlink(missing_ok=True)
            print(f"    keep original (opt {mb(new_size)} MB not smaller enough)")

        if not poster.exists():
            try:
                extract_poster(ffmpeg, src, poster)
                print(f"    poster {poster.name}")
            except subprocess.CalledProcessError:
                print(f"    poster failed for {src.name}")

        seen_bytes[src.stat().st_size] = src


def main() -> int:
    # Windows consoles often can't print emoji in Instagram export filenames.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[attr-defined]
    except Exception:
        pass

    ffmpeg = find_ffmpeg()
    print(f"ffmpeg: {ffmpeg}")
    for d in DIRS:
        print(f"\n=== {d} ===")
        process_dir(ffmpeg, d)
    return 0


if __name__ == "__main__":
    sys.exit(main())
