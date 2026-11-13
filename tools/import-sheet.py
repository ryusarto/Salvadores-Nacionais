#!/usr/bin/env python3
"""Importa uma prancheta de sprites JÁ TRANSPARENTE (fundo sem cor) para tiras do jogo.

Uso: python3 tools/import-sheet.py <personagem> <prancheta.png|webp> [--debug pasta]

A tabela SHEETS diz, para cada personagem, onde fica cada trecho da prancheta
(linha y0..y1, colunas x0..x1, quantos quadros) e quais quadros viram cada tira
do jogo (nomes do contrato de animação, src/render/anim.js). Grava
production/sprites/final/<personagem>/<tira>.webp, células de 512 px, pé no
ponto do contrato. Não precisa de modelo de recorte: a transparência já vem pronta.
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

CELL = 512
FOOT_Y = round(700 * CELL / 768)
STAND = round(470 * CELL / 768)

# trecho: (y0, y1, x0, x1, quadros) em pixels da prancheta; no lugar do número de
# quadros pode vir a lista de cortes (x relativo a x0) quando os quadros se encostam
SHEETS = {
    'franco': {
        'ref_width': 1500,  # coordenadas medidas numa prancheta de 1500 px de largura
        'sections': {
            'idle': (8, 115, 380, 1190, 9),
            'andar': (131, 231, 365, 1188, 8),
            'correr': (253, 338, 342, 1200, 8),
            'agachar': (344, 447, 160, 528, 5),
            'pulo': (344, 447, 645, 1242, 8),
            'defesa': (458, 539, 98, 554, 6),
            'queda': (458, 539, 653, 1389, 9),
            'fraco': (553, 632, 47, 692, 7),
            'forte': (553, 632, 793, 1439, 8),
            # cortes marcados à mão: os arcos de tinta encostam nos quadros vizinhos
            'medio': (642, 756, 40, 724, [0, 93, 196, 290, 388, 468, 522, 617, 684]),
            'especial': (642, 756, 745, 1458, 8),
        },
        # tira do jogo: (trecho, quadros usados; None = todos)
        'strips': {
            'parado': ('idle', None), 'andar': ('andar', None), 'correr': ('correr', None),
            'agachar': ('agachar', [0, 2, 3, 4]), 'pulo': ('pulo', [1, 2, 3, 4]), 'recuo': ('andar', [5, 4, 3, 2]),
            'defesa-em-pe': ('defesa', [3]), 'dano-alto': ('queda', [0, 1]), 'dano-baixo': ('queda', [0]),
            'dano-no-ar': ('queda', [1, 2, 2]), 'caido': ('queda', [4]), 'levantar': ('queda', [5, 6, 7, 8]),
            'golpe-5L': ('fraco', None), 'golpe-5M': ('medio', None), 'golpe-5H': ('forte', None),
            'golpe-SA3': ('especial', None), 'golpe-throw': ('fraco', [0, 2, 4, 5]),
        },
    },
}


def split(alpha, n):
    """Corta o trecho em n quadros: cada corte vai para a coluna mais vazia perto do ponto esperado."""
    occ = (alpha > 40).sum(axis=0).astype(float)
    xs = np.where(occ > 0)[0]
    lo, hi = (xs[0], xs[-1] + 1) if len(xs) else (0, len(occ))
    step = (hi - lo) / n
    edges = [lo]
    for k in range(1, n):
        c = lo + k * step
        w0, w1 = int(c - step * 0.35), int(c + step * 0.35)
        win = occ[w0:w1]
        best = np.flatnonzero(win == win.min())
        edges.append(w0 + int(best[np.argmin(np.abs(best + w0 - c))]))
    edges.append(hi)
    return [(edges[i], edges[i + 1]) for i in range(n)]


def components(mask):
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


def clean(a):
    """Tira pedaços de quadros vizinhos que entraram pela lateral; mantém personagem e efeitos."""
    lab, sizes = components(a[:, :, 3] > 40)
    if len(sizes) <= 1:
        return a
    big = int(np.argmax(sizes[1:])) + 1
    w = a.shape[1]
    keep = np.zeros(len(sizes), bool)
    for i in range(1, len(sizes)):
        xs = np.where(lab == i)[1]
        side = xs.min() == 0 or xs.max() == w - 1
        keep[i] = i == big or sizes[i] >= sizes[big] * (0.35 if side else 0.02)
    out = a.copy()
    out[:, :, 3] = np.where(keep[lab] | (a[:, :, 3] <= 40), a[:, :, 3], 0)
    return out


def main():
    who, path = sys.argv[1], sys.argv[2]
    debug = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None
    spec = SHEETS[who]
    sheet = np.asarray(Image.open(path).convert('RGBA'))
    # a mesma prancheta em outra resolução: as coordenadas acompanham a largura
    k = sheet.shape[1] / spec.get('ref_width', sheet.shape[1])
    frames = {}
    for name, (y0, y1, x0, x1, n) in spec['sections'].items():
        y0, y1, x0, x1 = (round(v * k) for v in (y0, y1, x0, x1))
        if isinstance(n, list):
            n = [round(v * k) for v in n]
        band = sheet[y0:y1, x0:x1]
        out = []
        cuts = list(zip(n[:-1], n[1:])) if isinstance(n, list) else split(band[:, :, 3], n)
        for a, b in cuts:
            piece = clean(band[:, a:b])
            ys, xs = np.where(piece[:, :, 3] > 40)
            out.append(None if len(ys) == 0 else (piece[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1], (y1 - y0) - (ys.max() + 1)))
        frames[name] = out
    idle = [f[0].shape[0] for f in frames['idle'] if f]
    sc = STAND / float(np.median(idle))
    out_dir = f'production/sprites/final/{who}'
    os.makedirs(out_dir, exist_ok=True)
    for strip_name, (sec, pick) in spec['strips'].items():
        fl = frames[sec]
        fl = [fl[i] for i in pick] if pick else fl
        fl = [f for f in fl if f]
        strip = Image.new('RGBA', (CELL * len(fl), CELL), (0, 0, 0, 0))
        for i, (px, lift) in enumerate(fl):
            img = Image.fromarray(px, 'RGBA')
            img = img.resize((max(1, round(img.width * sc)), max(1, round(img.height * sc))), Image.LANCZOS)
            al = np.asarray(img)[:, :, 3]
            low = al[int(img.height * 0.88):, :]
            cols = np.where(low.sum(axis=0) > 0)[0]
            fx = (cols.min() + cols.max()) / 2 if len(cols) else img.width / 2
            if img.width > STAND * 0.9:  # golpe largo: o corpo fica no centro e o golpe vai para a frente
                fx = min(fx, img.width * 0.3)
            cell = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
            cell.paste(img, (int(CELL / 2 - fx), int(FOOT_Y - lift * sc - img.height)), img)
            strip.alpha_composite(cell, (i * CELL, 0))
        strip.save(f'{out_dir}/{strip_name}.webp', 'WEBP', quality=90, method=6)
        if debug:
            os.makedirs(debug, exist_ok=True)
            chk = Image.new('RGBA', strip.size, (40, 170, 90, 255))
            chk.alpha_composite(strip)
            chk.convert('RGB').resize((strip.width // 4, strip.height // 4)).save(f'{debug}/{who}-{strip_name}.png')
    print(f'{who}: {len(spec["strips"])} tiras (escala {sc:.2f})')


main()
