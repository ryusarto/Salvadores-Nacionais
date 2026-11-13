#!/usr/bin/env python3
"""Importa tiras soltas e transparentes (uma imagem por animação, quadros lado a lado).

Uso:
  python3 tools/import-strips.py <personagem> --ref <imagem-em-pe> <tira>=<imagem>[@quadros] ...
  (ex.: defesa-em-pe=defesa.png@0 usa só o primeiro quadro; arquivo%8 corta em 8 quadros
  encostados; arquivo^ usa a escala própria da prancheta, pelo primeiro quadro em pé)

--ref é uma tira com o personagem em pé: a altura dele define a escala de todas.
Os quadros são separados pelos espaços transparentes entre eles. O chão de cada
tira é a base do quadro mais baixo; pulos e quedas mantêm a altura em relação a ele.
Grava production/sprites/final/<personagem>/<tira>.webp (células de 512 px).
"""
import os
import sys

import numpy as np
from PIL import Image

CELL = 512
FOOT_Y = round(700 * CELL / 768)
STAND = round(470 * CELL / 768)


def keep_main(sub):
    """Tira pedaços de quadros vizinhos que entraram pelas laterais."""
    from collections import deque
    m = sub[:, :, 3] > 40
    k = 3
    small = m[::k, ::k]
    h, w = small.shape
    lab = np.zeros((h, w), np.int32)
    sizes = [0]
    n = 0
    for y in range(h):
        for x in range(w):
            if small[y, x] and not lab[y, x]:
                n += 1
                lab[y, x] = n
                q = deque([(y, x)])
                c = 0
                while q:
                    cy, cx = q.popleft()
                    c += 1
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and small[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n
                            q.append((ny, nx))
                sizes.append(c)
    if n <= 1:
        return sub
    big = int(np.argmax(sizes[1:])) + 1
    keep = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        xs = np.where(lab == i)[1]
        side = xs.min() == 0 or xs.max() == w - 1
        keep[i] = i == big or sizes[i] >= sizes[big] * (0.4 if side else 0.03)
    km = np.kron(keep[lab], np.ones((k, k), bool))[: m.shape[0], : m.shape[1]]
    out = sub.copy()
    out[:, :, 3] = np.where(km, sub[:, :, 3], 0)
    return out


def frames_of(path, equal=0):
    a = np.asarray(Image.open(path).convert('RGBA'))
    if isinstance(equal, list):  # cortes marcados à mão (x em pixels da prancheta)
        out = []
        for x0, x1 in zip(equal[:-1], equal[1:]):
            sub = keep_main(a[:, x0:x1])
            ys = np.where((sub[:, :, 3] > 40).any(axis=1))[0]
            xs2 = np.where((sub[:, :, 3] > 40).any(axis=0))[0]
            out.append((sub[ys.min(): ys.max() + 1, xs2.min(): xs2.max() + 1], ys.max() + 1))
        return out
    if equal:  # quadros encostados: corta no vão mais vazio perto de cada divisa
        occ = (a[:, :, 3] > 40).sum(axis=0).astype(float)
        xs = np.where(occ > 0)[0]
        lo, hi = xs[0], xs[-1] + 1
        step = (hi - lo) / equal
        edges = [lo]
        for k in range(1, equal):
            c = lo + k * step
            w0, w1 = int(c - step * 0.3), int(c + step * 0.3)
            win = occ[w0:w1]
            best = np.flatnonzero(win == win.min())
            edges.append(w0 + int(best[np.argmin(np.abs(best + w0 - c))]))
        edges.append(hi)
        out = []
        for i in range(equal):
            sub = keep_main(a[:, edges[i]:edges[i + 1]])
            ys = np.where((sub[:, :, 3] > 40).any(axis=1))[0]
            xs2 = np.where((sub[:, :, 3] > 40).any(axis=0))[0]
            out.append((sub[ys.min(): ys.max() + 1, xs2.min(): xs2.max() + 1], ys.max() + 1))
        return out
    fg = a[:, :, 3] > 40
    cols = fg.sum(axis=0) > 0
    runs = []
    on = False
    for x, v in enumerate(cols):
        if v and not on:
            on, s = True, x
        if not v and on:
            on = False
            runs.append((s, x))
    if on:
        runs.append((s, len(cols)))
    # pedaços pequenos (um clarão solto) vão para o quadro vizinho mais próximo
    big = [r for r in runs if r[1] - r[0] > a.shape[1] * 0.04]
    out = []
    for x0, x1 in big:
        sub = a[:, x0:x1]
        ys = np.where((sub[:, :, 3] > 40).any(axis=1))[0]
        out.append((sub[ys.min(): ys.max() + 1], ys.max() + 1))
    return out


def main():
    who = sys.argv[1]
    ref = sys.argv[sys.argv.index('--ref') + 1]
    pairs = [p.split('=', 1) for p in sys.argv[2:] if '=' in p]
    rp, req = (ref.split('%') + ['0'])[:2]
    ref_h = float(np.median([f[0].shape[0] for f in frames_of(rp, int(req))]))
    sc = STAND / ref_h
    out_dir = f'production/sprites/final/{who}'
    os.makedirs(out_dir, exist_ok=True)
    for name, path in pairs:
        pick = None
        if '@' in path:  # tira=arquivo@0,2 usa só esses quadros
            path, sel = path.rsplit('@', 1)
            pick = [int(i) for i in sel.split(',')]
        own = path.endswith('^') or '^' in path
        path = path.replace('^', '')
        equal = 0
        if '|' in path:  # tira=arquivo|0,215,448,... cortes marcados à mão
            path, cuts = path.split('|', 1)
            equal = [int(v) for v in cuts.split(',')]
        elif '%' in path:  # tira=arquivo%4 divide em 4 colunas iguais
            path, n = path.rsplit('%', 1)
            equal = int(n)
        fl = frames_of(path, equal)
        ground = max(b for _, b in fl)
        sc_here = (STAND / max(f[0].shape[0] for f in fl)) if own else sc  # ^: o quadro mais alto é o personagem em pé
        if pick:
            fl = [fl[i] for i in pick]
        strip = Image.new('RGBA', (CELL * len(fl), CELL), (0, 0, 0, 0))
        for i, (px, bottom) in enumerate(fl):
            img = Image.fromarray(px, 'RGBA')
            img = img.resize((max(1, round(img.width * sc_here)), max(1, round(img.height * sc_here))), Image.LANCZOS)
            al = np.asarray(img)[:, :, 3]
            low = al[int(img.height * 0.88):, :]
            cols = np.where(low.sum(axis=0) > 0)[0]
            fx = (cols.min() + cols.max()) / 2 if len(cols) else img.width / 2
            if img.width > STAND * 0.75:  # pose larga: o corpo no centro, o braço/arma para a frente
                fx = min(fx, img.width * 0.42)
            cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
            cell.paste(img, (int(CELL / 2 - fx), int(FOOT_Y - (ground - bottom) * sc_here - img.height)), img)
            strip.alpha_composite(cell, (i * CELL, 0))
        strip.save(f'{out_dir}/{name}.webp', 'WEBP', quality=90, method=6)
        print(f'{who}/{name}: {len(fl)} quadros')


main()
