#!/usr/bin/env python3
"""Download Malayalam audio clips from URLs listed in audio/sources.json.

Usage:
  python3 scripts/fetch_audio.py
"""

from __future__ import annotations

import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'audio' / 'sources.json'


def download(url: str, target: pathlib.Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=30) as response:
        data = response.read()
    target.write_bytes(data)


def main() -> int:
    if not MANIFEST.exists():
        print(f'Manifest not found: {MANIFEST}')
        return 1

    config = json.loads(MANIFEST.read_text(encoding='utf-8'))
    entries = config.get('files', [])
    if not entries:
        print('No files listed in audio/sources.json')
        return 1

    errors = 0
    for item in entries:
        path = item.get('path')
        url = item.get('url')

        if not path or not url:
            print(f"Skipping invalid entry: {item}")
            continue

        target = ROOT / path
        try:
            download(url, target)
            print(f'✅ Downloaded {path}')
        except Exception as err:  # noqa: BLE001
            errors += 1
            print(f'❌ Failed {path}: {err}')

    if errors:
        print(f'Finished with {errors} error(s).')
        return 2

    print('All audio files downloaded successfully.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
