#!/usr/bin/env python3
"""
Download OSM tiles for Amsterdam, z=5..15
Output: public/tiles/{z}/{x}/{y}.png
"""

import mercantile
import requests
import time
import os
import sys
from pathlib import Path

# --- Config ---
BBOX = (4.0, 51.9, 6.0, 52.9)   # west, south, east, north (expanded Amsterdam region)
ZOOM_MIN = 12
ZOOM_MAX = 15
OUTPUT_DIR = Path(__file__).parent / 'public' / 'tiles'

# OSM tile servers (rotating to avoid rate-limits)
TILE_SERVERS = [
    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
]

HEADERS = {
    'User-Agent': 'geo_three_scene/1.0 (https://github.com/local-experiment)',
}

DELAY = 0.1   # seconds between requests (be polite to OSM)
# --------------

def tile_url(server_template, z, x, y):
    return server_template.format(z=z, x=x, y=y)

def download_tile(z, x, y, server_idx):
    url = tile_url(TILE_SERVERS[server_idx % len(TILE_SERVERS)], z, x, y)
    out_path = OUTPUT_DIR / str(z) / str(x) / f'{y}.png'

    if out_path.exists():
        return 'skip'

    out_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        r = requests.get(url, headers=HEADERS, timeout=10)
        if r.status_code == 200:
            # Verify it's actually a PNG (not an error page)
            if r.content[:4] == b'\x89PNG':
                out_path.write_bytes(r.content)
                return 'ok'
            else:
                return f'err:not_png ({r.content[:30]})'
        else:
            return f'err:{r.status_code}'
    except Exception as e:
        return f'exc:{e}'

def main():
    tiles = list(mercantile.tiles(*BBOX, zooms=range(ZOOM_MIN, ZOOM_MAX + 1)))
    total = len(tiles)
    print(f'Тайлов для загрузки: {total}')
    print(f'Папка: {OUTPUT_DIR}\n')

    ok = skip = err = 0

    for i, tile in enumerate(tiles):
        result = download_tile(tile.z, tile.x, tile.y, i)

        if result == 'ok':
            ok += 1
        elif result == 'skip':
            skip += 1
        else:
            err += 1
            print(f'  ОШИБКА z={tile.z} x={tile.x} y={tile.y}: {result}')

        # Progress bar
        done = i + 1
        pct = done / total * 100
        bar = '█' * (done * 40 // total) + '░' * (40 - done * 40 // total)
        sys.stdout.write(f'\r[{bar}] {pct:5.1f}%  {done}/{total}  ✓{ok} ↷{skip} ✗{err}')
        sys.stdout.flush()

        if result == 'ok':
            time.sleep(DELAY)

    print(f'\n\nГотово! Загружено: {ok}, пропущено: {skip}, ошибок: {err}')

if __name__ == '__main__':
    main()
