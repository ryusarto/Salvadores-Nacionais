#!/usr/bin/env python3
"""Importa um kit de tiras de sprite já recortadas e limpa cada quadro.

Uso: python3 tools/import-kit.py <pasta-do-kit> [personagem ...] [--debug pasta]

A pasta do kit tem <personagem>/<tira>.png, com células de 768x768 lado a lado
e o pé em (384, 700) — o formato do contrato de animação (src/render/anim.js).

Para cada quadro: passa pelo modelo de recorte (rembg, isnet-general-use) para
tirar sobras da prancheta (retângulos escuros, faixas, textos e números), tira
manchas soltas, iguala o tamanho do personagem ao da tira "parado" e grava
production/sprites/final/<personagem>/<tira>.webp com células de 512 px.

Requer: pip install rembg onnxruntime pillow numpy
"""
import os
import sys

import numpy as np
from PIL import Image

SRC_CELL = 768
CELL = 512
FOOT_Y = round(700 * CELL / 768)
BG = (18, 12, 16)  # fundo escuro parecido com o das pranchetas

# Tiras que mostram o personagem em pé no primeiro quadro: a escala da tira vem dele.
STANDING_FIRST = ('golpe-',)
# Tiras de movimento: usam a escala da tira "andar" (desenhada no mesmo tamanho).
LIKE_WALK = ('correr', 'agachar', 'pulo')


def remove_bg(img, session):
    from rembg import remove
    a = np.asarray(img)
    ys, xs = np.where(a[:, :, 3] > 10)
    if len(ys) == 0:
        return None
    pad = 24
    y0, y1 = max(0, ys.min() - pad), min(img.height, ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(img.width, xs.max() + pad)
    crop = img.crop((x0, y0, x1, y1))
    flat = Image.new('RGBA', crop.size, BG + (255,))
    flat.alpha_composite(crop)
    k = 2
    big = flat.convert('RGB').resize((crop.width * k, crop.height * k), Image.LANCZOS)
    m = 60
    canvas = Image.new('RGB', (big.width + 2 * m, big.height + 2 * m), BG)
    canvas.paste(big, (m, m))
    out = remove(canvas, session=session, only_mask=True).crop((m, m, m + big.width, m + big.height))
    mask = np.asarray(out.resize(crop.size, Image.LANCZOS)).astype(float) / 255
    mask = np.clip((mask - 0.25) * 1.6, 0, 1)
    ca = np.asarray(crop).copy()
    ca[:, :, 3] = (ca[:, :, 3] * mask).astype(np.uint8)
    full = np.zeros_like(a)
    full[y0:y1, x0:x1] = ca
    return full


def drop_dark_blocks(rgba, k=11, thr=26, fill=0.82):
    """Apaga áreas pretas sólidas (sobras da prancheta). Contornos finos não chegam à densidade exigida."""
    a = rgba.copy()
    dark = ((a[:, :, :3].max(axis=2) < thr) & (a[:, :, 3] > 40)).astype(np.int32)
    ii = np.pad(dark, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    r = k // 2
    h, w = dark.shape
    y0 = np.clip(np.arange(h) - r, 0, h); y1 = np.clip(np.arange(h) + r + 1, 0, h)
    x0 = np.clip(np.arange(w) - r, 0, w); x1 = np.clip(np.arange(w) + r + 1, 0, w)
    s = ii[y1][:, x1] - ii[y0][:, x1] - ii[y1][:, x0] + ii[y0][:, x0]
    area = (y1 - y0)[:, None] * (x1 - x0)[None, :]
    solid = (s / area) > fill
    # cresce um pouco para pegar a borda do bloco
    grow = np.pad(solid, 2)
    solid = np.zeros_like(solid)
    for dy in range(5):
        for dx in range(5):
            solid |= grow[dy:dy + h, dx:dx + w]
    a[:, :, 3] = np.where(solid & (a[:, :, :3].max(axis=2) < thr + 20), 0, a[:, :, 3])
    return a


def components(mask):
    from collections import deque
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    sizes = [0]
    n = 0
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not lab[y, x]:
                n += 1
                lab[y, x] = n
                q = deque([(y, x)])
                s = 0
                while q:
                    cy, cx = q.popleft()
                    s += 1
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n
                            q.append((ny, nx))
                sizes.append(s)
    return lab, sizes


def clean(rgba):
    """Mantém o maior pedaço (personagem) e os grandes (efeitos); tira números, letras e manchas."""
    k = 4
    al = rgba[:, :, 3]
    small = al[::k, ::k] > 60
    lab, sizes = components(small)
    if len(sizes) <= 1:
        return rgba
    big = int(np.argmax(sizes[1:])) + 1
    keep = np.array([i == big or s >= sizes[big] * 0.12 for i, s in enumerate(sizes)])
    keep[0] = False
    km = np.kron(keep[lab], np.ones((k, k), bool))[: al.shape[0], : al.shape[1]]
    out = rgba.copy()
    out[:, :, 3] = np.where(km, al, 0)
    return out


def bbox(a):
    ys, xs = np.where(a[:, :, 3] > 40)
    return None if len(ys) == 0 else (ys.min(), ys.max() + 1, xs.min(), xs.max() + 1)


def foot_x(a, box):
    y0, y1, x0, x1 = box
    low = a[y1 - max(4, (y1 - y0) // 9): y1, x0:x1, 3]
    cols = np.where(low.sum(axis=0) > 0)[0]
    return x0 + ((cols.min() + cols.max()) / 2 if len(cols) else (x1 - x0) / 2)


def load_frames(path, session):
    im = Image.open(path).convert('RGBA')
    n = max(1, round(im.width / SRC_CELL))
    out = []
    for i in range(n):
        cell = im.crop((i * SRC_CELL, 0, (i + 1) * SRC_CELL, SRC_CELL))
        a = remove_bg(cell, session)
        orig = np.asarray(cell)
        kept = (a[:, :, 3] > 40).sum() if a is not None else 0
        if a is None or kept < 0.35 * (orig[:, :, 3] > 40).sum():
            # o modelo apagou o personagem: fica o recorte do kit, sem os blocos pretos da prancheta
            a = drop_dark_blocks(orig.copy())
        a = clean(a)
        if bbox(a) is None and out:
            a = out[-1]  # quadro vazio: repete o anterior
        out.append(a)
    return out


def main():
    from rembg import new_session
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    debug = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None
    if debug in args:
        args.remove(debug)
    kit, only = args[0], set(args[1:])
    session = new_session('isnet-general-use')
    for ch in sorted(os.listdir(kit)):
        if only and ch not in only or not os.path.isdir(f'{kit}/{ch}'):
            continue
        strips = {f[:-4]: load_frames(f'{kit}/{ch}/{f}', session) for f in sorted(os.listdir(f'{kit}/{ch}')) if f.endswith('.png')}
        h = lambda fr: (bbox(fr)[1] - bbox(fr)[0]) if fr is not None and bbox(fr) else 0
        stand = float(np.median([h(f) for f in strips['parado'] if h(f)]))
        walk = float(np.median([h(f) for f in strips.get('andar', strips['parado']) if h(f)]))
        out_dir = f'production/sprites/final/{ch}'
        os.makedirs(out_dir, exist_ok=True)
        for name, frames in strips.items():
            if name == 'parado':
                k = 1.0
            elif name == 'andar' or name in LIKE_WALK:
                k = stand / walk
            else:
                # golpes: a pose mais alta da tira é o personagem em pé
                tallest = max(h(f) for f in frames) or stand
                k = min(2.2, max(0.85, stand / tallest))
            sc = k * CELL / SRC_CELL
            strip = Image.new('RGBA', (CELL * len(frames), CELL), (0, 0, 0, 0))
            for i, a in enumerate(frames):
                if a is None or bbox(a) is None:
                    continue
                y0, y1, x0, x1 = bbox(a)
                fx = foot_x(a, (y0, y1, x0, x1))
                piece = Image.fromarray(a[y0:y1, x0:x1], 'RGBA')
                piece = piece.resize((max(1, round(piece.width * sc)), max(1, round(piece.height * sc))), Image.LANCZOS)
                # pé no centro; a distância do chão (pulo, efeitos no alto) é preservada
                lift = (700 - y1) * sc
                px = int(i * CELL + CELL / 2 - (fx - x0) * sc)
                py = int(FOOT_Y - lift - piece.height)
                tile = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
                tile.alpha_composite(piece, (px - i * CELL, py)) if 0 <= px - i * CELL and px - i * CELL + piece.width <= CELL and py >= 0 else tile.paste(piece, (px - i * CELL, py), piece)
                strip.alpha_composite(tile, (i * CELL, 0))
            strip.save(f'{out_dir}/{name}.webp', 'WEBP', quality=88, method=6)
            if debug:
                os.makedirs(debug, exist_ok=True)
                chk = Image.new('RGBA', strip.size, (40, 170, 90, 255))
                chk.alpha_composite(strip)
                chk.convert('RGB').resize((strip.width // 4, strip.height // 4)).save(f'{debug}/{ch}-{name}.png')
        print(f'{ch}: {len(strips)} tiras importadas')


main()
