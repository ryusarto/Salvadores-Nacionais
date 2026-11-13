# Produção de sprites

Os sprites finais são desenhados por cima dos **guias de pose** que o jogo gera
do manequim. Cada guia é uma tira de quadros em células de 768×768 px, com o pé
sempre no mesmo ponto (a cruz na linha do chão).

## Gerar os guias

```bash
node tools/pose-guides.mjs franco            # todas as tiras
node tools/pose-guides.mjs franco parado golpe-5M   # só algumas
```

Saída: `production/sprites/guides/<personagem>/<tira>.png`.

## Teste de consistência (fazer antes de produzir tudo)

Gere só duas tiras do Franco: `parado.png` (4 quadros) e `golpe-5M.png` (6 quadros).
Se o rosto, o cabelo e a roupa ficarem iguais entre os quadros, o método serve.

## Pedido para o gerador de imagem

Envie junto: (1) a tira-guia e (2) a imagem de referência do personagem.

> Redesenhe esta tira de quadros de animação para um jogo de luta 2D.
> Mantenha exatamente o mesmo número de quadros, o mesmo tamanho de cada célula
> (768×768), a mesma pose do boneco em cada quadro e os pés no mesmo ponto.
> Substitua o boneco pelo personagem da imagem de referência: FRANCO, THE SIR! —
> cabelo cacheado volumoso, cavanhaque, brinco de argola, regata verde com
> faixas amarela e azul, colar de pérolas, tatuagens no braço, bermuda jeans
> escura larga, meias brancas e tênis preto e branco.
> Estilo: HQ com contorno preto de nanquim, três tons por cor (base, sombra,
> luz) e retícula de pontos nas sombras. Vista lateral, olhando para a direita.
> Fundo liso cinza, sem chão, sem sombra no chão, sem texto, sem efeitos de
> golpe (o jogo desenha os efeitos). O personagem deve ser idêntico em todos os
> quadros: mesmo rosto, mesmas cores, mesmas proporções.

## Entrega

Salve cada tira redesenhada com o mesmo nome em
`production/sprites/final/<personagem>/<tira>.png`, com o mesmo tamanho da guia.
O recorte do fundo e o alinhamento são feitos depois, por script.

## Situação

- Guias do Franco: gerados (37 tiras, incluindo os golpes de sequência).
- Leitor de sprites no jogo: pronto e testado com os próprios guias no lugar
  dos sprites (`production/qa/evidence/07-teste-leitor-de-sprites.png`).
  `npm run build` embute o que estiver em `production/sprites/final/`.
- Nomes das tiras e quadros: `src/render/anim.js` (contrato de animação).


## Pranchetas recebidas (recorte automático)

Franco, M'Dep e Majis chegaram como pranchetas prontas, guardadas em
`production/sprites/source/`. O recorte é feito por:

```bash
pip install rembg onnxruntime pillow numpy
python3 tools/slice-sheet.py franco
```

A tabela `SHEETS` no script diz onde fica cada linha da prancheta; `OUTPUT`
diz qual linha vira qual tira do jogo; `PICKS` escolhe quadros quando algum
saiu ruim. Animações que a prancheta não tem (defesa, dano, queda, vitória)
usam uma tira parecida do mesmo personagem com um ajuste de pose, então o
personagem nunca vira manequim no meio da luta. Para ficarem completas, as
próximas pranchetas precisam destas linhas: defesa em pé e agachado, dano,
queda, levantar, vitória e os especiais (I, → + I, ↓ + I).

## Kit de tiras (os oito heróis)

As tiras de `production/sprites/final/` vêm do kit montado a partir das
pranchetas aprovadas (70 tiras originais). As 234 tiras extras da versão
"cobertura completa" eram cópias exatas de outras tiras e ficaram de fora: o
jogo já faz essas substituições sozinho.

Para importar um kit novo (tiras de 768 px com o pé em 384, 700):

```bash
python3 tools/import-kit.py pasta-do-kit [personagem ...]
```

O importador recorta cada quadro de novo com IA (tira sobras da prancheta),
iguala o tamanho dos golpes ao do personagem parado e grava WebP de 512 px.
Quando o nome da tira não bate com o golpe do jogo, a ficha do personagem diz
qual tira usar em `spriteAlias` (por exemplo, a ambulância do Trunks é o
super de 1 barra).

## Cenário

Um cenário pintado em `production/stages/belem.jpg` (ou .webp/.png) entra no
lugar do cenário desenhado por código. A imagem é ampliada para ficar um pouco
mais larga que a tela e desliza com a câmera.

## Pranchetas transparentes (Franco v2)

Pranchetas que já vêm com fundo transparente entram sem modelo de recorte:

```bash
python3 tools/import-sheet.py franco production/sprites/source/franco-v2.png
```

A tabela `SHEETS` em `tools/import-sheet.py` diz onde fica cada linha e qual
quadro vira cada tira (inclusive defesa, dano, queda e levantar). Quando os
quadros se encostam, a linha leva a lista de cortes no lugar do número de
quadros.
