"""Encode existing PNG sprite strips without resizing or changing their pixels.

Usage: python3 tools/encode-sprite-webp.py <source-dir> <game-dir> <name>...
Requires Pillow with WebP support. Raster normalization is a separate step.
"""
from pathlib import Path
import sys
from PIL import Image

source, target = map(Path, sys.argv[1:3])
for name in sys.argv[3:]:
    with Image.open(source / (name + '.png')) as image:
        assert image.size == (3072, 768), name
        image = image.convert('RGBA')
        dest = target / (name + '.webp')
        image.save(dest, 'WEBP', lossless=True, exact=True, method=6)
        with Image.open(dest) as decoded:
            assert decoded.convert('RGBA').tobytes() == image.tobytes(), name
        print(name, 'RGBA preserved', flush=True)
