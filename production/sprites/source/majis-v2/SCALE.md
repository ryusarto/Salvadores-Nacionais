# Correção da escala da Majis

As tiras do golpe forte (`L` do teclado, inclusive segurando para frente), do
golpe de cima e da vitória tinham metas de exportação de 530–540px, enquanto o
repouso usava 470px. Isso ampliava a personagem ao trocar de ação.

As fontes originais foram preservadas. Cada sequência corrigida foi exportada
novamente com um fator único para seus quatro quadros, mantendo a célula de
768×768 e a origem dos pés em (384,700). Também foram corrigidos o forte aéreo,
a Onda Grave, o pulo e a defesa no ar, que ampliavam poses compactas.

Os fatores e as medições estão no manifesto e em
`production/qa/majis-validacao.json`. A comparação visual usa o leitor real do
jogo em `production/qa/majis-scale.html`; seu botão de entrada reproduz o
comando no motor de combate. A exportação WebP foi conferida sem alteração dos
pixels RGBA dos PNGs corrigidos. Nenhum atributo de combate foi alterado.

Para reproduzir a exportação em macOS:

```sh
clang -O2 -fobjc-arc -framework AppKit tools/export-character-strips.m -o /tmp/export-character-strips
/tmp/export-character-strips production/sprites/source/majis-v2 golpe-5H golpe-6M vitoria golpe-jH golpe-2S pulo defesa-no-ar
python3 tools/encode-sprite-webp.py production/sprites/source/majis-v2/tiras-768 production/sprites/final/majis golpe-5H golpe-6M vitoria golpe-jH golpe-2S pulo defesa-no-ar
node tools/audit-majis-scale.mjs
/tmp/export-character-strips production/sprites/source/majis-v2 --overview
```

A etapa WebP requer Pillow com suporte a WebP. Ela apenas codifica o formato;
o tamanho é definido pela geometria e pela escala de cada sequência no manifesto.
