#!/usr/bin/env python3
"""Importa tiras soltas e transparentes (uma imagem por animação, quadros lado a lado).

Uso:
  python3 tools/import-strips.py <personagem> --ref <imagem-em-pe> <tira>=<imagem>[@quadros] ...
  (ex.: defesa-em-pe=defesa.png@0 usa só o primeiro quadro)

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


def frames_of(path, equal=0):
    a = np.asarray(Image.open(path).convert('RGBA'))
    if equal:  # efeito liga os quadros: divide em colunas iguais
        w = a.shape[1] // equal
        out = []
        for i in range(equal):
            sub = a[:, i * w:(i + 1) * w]
            ys = np.where((sub[:, :, 3] > 40).any(axis=1))[0]
            xs = np.where((sub[:, :, 3] > 40).any(axis=0))[0]
            out.append((sub[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1], ys.max() + 1))
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
    ref_h = float(np.median([f[0].shape[0] for f in frames_of(ref)]))
    sc = STAND / ref_h
    out_dir = f'production/sprites/final/{who}'
    os.makedirs(out_dir, exist_ok=True)
    for name, path in pairs:
        pick = None
        if '@' in path:  # tira=arquivo@0,2 usa só esses quadros
            path, sel = path.rsplit('@', 1)
            pick = [int(i) for i in sel.split(',')]
        equal = 0
        if '%' in path:  # tira=arquivo%4 divide em 4 colunas iguais
            path, n = path.rsplit('%', 1)
            equal = int(n)
        fl = frames_of(path, equal)
        ground = max(b for _, b in fl)
        if pick:
            fl = [fl[i] for i in pick]
        strip = Image.new('RGBA', (CELL * len(fl), CELL), (0, 0, 0, 0))
        for i, (px, bottom) in enumerate(fl):
            img = Image.fromarray(px, 'RGBA')
            img = img.resize((max(1, round(img.width * sc)), max(1, round(img.height * sc))), Image.LANCZOS)
            al = np.asarray(img)[:, :, 3]
            low = al[int(img.height * 0.88):, :]
            cols = np.where(low.sum(axis=0) > 0)[0]
            fx = (cols.min() + cols.max()) / 2 if len(cols) else img.width / 2
            if img.width > STAND * 0.75:  # pose larga: o corpo no centro, o braço/arma para a frente
                fx = min(fx, img.width * 0.42)
            cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
            cell.paste(img, (int(CELL / 2 - fx), int(FOOT_Y - (ground - bottom) * sc - img.height)), img)
            strip.alpha_composite(cell, (i * CELL, 0))
        strip.save(f'{out_dir}/{name}.webp', 'WEBP', quality=90, method=6)
        print(f'{who}/{name}: {len(fl)} quadros')


main()
