#!/usr/bin/env python3
"""Recorta uma prancheta de sprites em tiras no formato do jogo.

Uso: python3 tools/slice-sheet.py <personagem> [--debug pasta]

Requer: pip install rembg onnxruntime pillow numpy (o modelo isnet-general-use
é baixado na primeira execução). Leva alguns minutos por personagem.

Lê production/sprites/source/<personagem>-prancheta.png e a tabela SHEETS
abaixo (onde fica cada linha e quantos quadros tem), separa o personagem do
fundo com um modelo de recorte, divide a linha em quadros e grava
production/sprites/final/<personagem>/<tira>.webp com células de 512x512 e o
pé no ponto do contrato de animação (src/render/anim.js).
"""
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

# A tira sai em células de 512 px (o jogo amplia para 768): mesma nitidez, um terço do peso.
CELL = 512
FOOT_Y = round(700 * CELL / 768)
STAND = round(470 * CELL / 768)  # altura do personagem em pé

# Linhas da prancheta: nome -> (y0, y1, x0, x1, quadros), em pixels da prancheta.
SHEETS = {
    'mdep': {
        'idle': (38, 200, 500, 1500, 9), 'andar': (222, 354, 520, 1530, 10), 'correr': (378, 484, 540, 1520, 8),
        'agachar': (510, 608, 450, 820, 4), 'pular': (486, 608, 970, 1520, 6),
        'fraco': (646, 776, 430, 980, 5), 'forte': (646, 776, 1000, 1500, 5), 'especial': (830, 1002, 380, 1500, 8),
    },
    'franco': {
        'idle': (36, 196, 530, 1440, 9), 'andar': (224, 346, 555, 1480, 10), 'correr': (370, 470, 570, 1480, 8),
        'agachar': (486, 587, 440, 790, 4), 'pular': (474, 592, 940, 1450, 6),
        'fraco': (622, 747, 420, 950, 5), 'forte': (622, 747, 980, 1460, 5), 'especial': (798, 952, 350, 1480, 7),
    },
    'majis': {
        'idle': (36, 200, 520, 1520, 9), 'andar': (226, 352, 520, 1530, 10), 'correr': (376, 484, 560, 1520, 8),
        'agachar': (518, 614, 440, 830, 4), 'pular': (492, 614, 970, 1530, 6),
        'fraco': (648, 772, 430, 970, 5), 'forte': (648, 772, 1030, 1520, 5), 'especial': (812, 1002, 400, 1530, 7),
    },
}

# Tiras do jogo -> (linha da prancheta, quadros usados). None = todos.
OUTPUT = {
    'parado': ('idle', None), 'andar': ('andar', None), 'correr': ('correr', None),
    'agachar': ('agachar', [0, 1, 2, 2]), 'pulo': ('pular', [1, 2, 3, 4]),
    'golpe-5L': ('fraco', None), 'golpe-5M': ('fraco', None), 'golpe-5H': ('forte', None),
    'golpe-SA3': ('especial', None),
}
EXTRA = {'mdep': {'golpe-SA1': ('especial', None), 'golpe-jH': ('forte', None)}}
# Quadros escolhidos à mão (os outros têm só efeito, sem o personagem).
PICKS = {
    'franco': {'golpe-SA3': [0, 2, 2, 6, 6, 6], 'golpe-5H': [0, 1, 2, 3, 4]},
    'mdep': {'golpe-SA3': [0, 1, 3, 4, 6, 6], 'golpe-SA1': [1, 3, 4, 6]},
    'majis': {'golpe-SA3': [0, 1, 3, 4, 4, 4]},
}


def occupancy(band):
    """Colunas ocupadas por algo diferente do fundo (máscara rápida, só para dividir os quadros)."""
    px = band.astype(int)
    bg = np.median(px[:6].reshape(-1, 3), axis=0)
    diff = np.abs(px - bg).max(axis=2)
    sat = px.max(axis=2) - px.min(axis=2)
    return ((diff > 38) | (sat > 70)).sum(axis=0)


def split(band, n):
    """Corta a linha em n quadros: cada corte vai para a coluna mais vazia perto do ponto esperado."""
    occ = occupancy(band).astype(float)
    xs = np.where(occ > 1)[0]
    lo, hi = (xs[0], xs[-1] + 1) if len(xs) else (0, len(occ))
    step = (hi - lo) / n
    edges = [max(0, lo - 4)]
    for k in range(1, n):
        c = lo + k * step
        w0, w1 = int(c - step * 0.32), int(c + step * 0.32)
        win = occ[w0:w1]
        best = np.flatnonzero(win == win.min())
        edges.append(w0 + int(best[np.argmin(np.abs(best + w0 - c))]))
    edges.append(min(len(occ), hi + 4))
    return [(edges[i], edges[i + 1]) for i in range(n)]


def matte_frame(img, session):
    """Recorta um quadro com o modelo de IA (ampliado e com margem, como o modelo prefere)."""
    from rembg import remove
    k = 4
    big = img.resize((img.width * k, img.height * k), Image.LANCZOS)
    pad = 80
    bg = tuple(int(v) for v in np.asarray(img)[2, 2])
    canvas = Image.new('RGB', (big.width + 2 * pad, big.height + 2 * pad), bg)
    canvas.paste(big, (pad, pad))
    out = np.asarray(remove(canvas, session=session).crop((pad, pad, pad + big.width, pad + big.height))).copy()
    al = out[:, :, 3].astype(float)
    out[:, :, 3] = np.clip((al - 70) * 2.2, 0, 255).astype(np.uint8)
    out = clean(out)
    ys, xs = np.where(out[:, :, 3] > 20)
    if len(ys) == 0:
        return None
    return Image.fromarray(out[ys.min(): ys.max() + 1, xs.min(): xs.max() + 1], 'RGBA')


def components(mask):
    """Rótulos de componentes conectados (4-vizinhos)."""
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
                size = 0
                while q:
                    cy, cx = q.popleft()
                    size += 1
                    for ny, nx in ((cy + 1, cx), (cy - 1, cx), (cy, cx + 1), (cy, cx - 1)):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n
                            q.append((ny, nx))
                sizes.append(size)
    return lab, sizes


def clean(rgba):
    """Mantém o personagem e o que for grande (efeitos); tira manchas soltas e pedaços de quadros vizinhos nas bordas."""
    al = rgba[:, :, 3]
    k = 4
    small = al[::k, ::k] > 40
    lab, sizes = components(small)
    if len(sizes) <= 1:
        return rgba
    big = int(np.argmax(sizes[1:])) + 1
    w = small.shape[1]
    keep = np.zeros(len(sizes), bool)
    for i in range(1, len(sizes)):
        ys, xs = np.where(lab == i)
        touches_side = xs.min() == 0 or xs.max() == w - 1
        # pedaços de quadros vizinhos encostam na borda e são pequenos; o personagem pode encostar e ser grande
        keep[i] = i == big or (sizes[i] >= sizes[big] * (0.3 if touches_side else 0.05))
    km = np.kron(keep[lab], np.ones((k, k), bool))[: al.shape[0], : al.shape[1]]
    out = rgba.copy()
    out[:, :, 3] = np.where(km, al, 0)
    return out


def frames_of(src, box, n, session):
    y0, y1, x0, x1 = box
    band = np.asarray(src.crop((x0, y0, x1, y1)))
    return [matte_frame(src.crop((x0 + a, y0, x0 + b, y1)), session) for a, b in split(band, n)]


def foot_center(img):
    al = np.asarray(img)[:, :, 3]
    low = al[int(img.height * 0.88):, :]
    cols = np.where(low.sum(axis=0) > 0)[0]
    return (cols.min() + cols.max()) / 2 if len(cols) else img.width / 2


def main():
    from rembg import new_session
    who = sys.argv[1]
    debug = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None
    session = new_session('isnet-general-use')
    src = Image.open(f'production/sprites/source/{who}-prancheta.png').convert('RGB')
    out_dir = f'production/sprites/final/{who}'
    os.makedirs(out_dir, exist_ok=True)
    rows = {}
    for name, (y0, y1, x0, x1, n) in SHEETS[who].items():
        rows[name] = frames_of(src, (y0, y1, x0, x1), n, session)
        print(f'{who}/{name}: {sum(1 for f in rows[name] if f)} de {n} quadros')
    # Cada linha da prancheta tem seu próprio tamanho de desenho: a escala vem
    # de um quadro em pé da própria linha (ou da linha vizinha desenhada igual).
    def h(row, pick):
        fs = [f for f in rows[row] if f]
        return float(np.median([f.height for f in fs])) if pick == 'median' else fs[0].height
    ref = {'idle': h('idle', 'median'), 'andar': h('andar', 'median')}
    for row in ('fraco', 'forte', 'especial'):
        ref[row] = h(row, 'first')
    ref['correr'] = ref['agachar'] = ref['pular'] = ref['andar']
    scales = {row: STAND / ref[row] for row in rows}
    idle = [f for f in rows['idle'] if f]
    for tira, (row, pick) in {**OUTPUT, **EXTRA.get(who, {})}.items():
        pick = PICKS.get(who, {}).get(tira, pick)
        frames = rows[row]
        frames = [frames[i] for i in pick] if pick else frames
        frames = [f for f in frames if f] or [idle[0]]
        strip = Image.new('RGBA', (CELL * len(frames), CELL), (0, 0, 0, 0))
        for i, f in enumerate(frames):
            sc = scales[row]
            f = f.resize((max(1, round(f.width * sc)), max(1, round(f.height * sc))), Image.LANCZOS)
            # o pé fica no centro da célula; em golpes largos o corpo fica à esquerda e o golpe vai para a frente
            cx = foot_center(f)
            if f.width > 2.2 * STAND * 0.45:
                cx = min(cx, f.width * 0.4)
            x = int(i * CELL + CELL / 2 - cx)
            x = max(i * CELL - f.width // 3, min(x, (i + 1) * CELL - f.width))
            strip.alpha_composite(f.crop((max(0, i * CELL - x), 0, f.width, f.height)) if x < i * CELL else f, (max(x, i * CELL), max(0, FOOT_Y - f.height)))
        strip.save(f'{out_dir}/{tira}.webp', 'WEBP', quality=88, method=6)
        if debug:
            os.makedirs(debug, exist_ok=True)
            chk = Image.new('RGBA', strip.size, (40, 170, 90, 255))
            chk.alpha_composite(strip)
            chk.convert('RGB').resize((strip.width // 4, strip.height // 4)).save(f'{debug}/{who}-{tira}.png')
    print(f'{out_dir}: {len(OUTPUT) + len(EXTRA.get(who, {}))} tiras')


main()
