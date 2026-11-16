# Trunks — uma animação por imagem, seis frames de 500px

Esta versão substitui o kit de quatro frames e pranchetas com ações misturadas.
São **40 animações do lutador e 8 camadas auxiliares**, cada uma produzida em
uma imagem própria com **6 desenhos consecutivos**: 288 frames no total.

## Tamanhos e arquivos

| Pasta | Conteúdo | Dimensões |
|---|---|---|
| `originais/` | Uma animação gerada por imagem, grade 3×2 | 1536×1024; células nativas de 512×512 |
| `pranchas/` | PNGs com alpha real, uma animação por imagem, grade 3×2 | 1500×1000; células de 500×500 |
| `tiras/` | PNGs mestres com seis frames lado a lado | 3000×500 |
| `production/sprites/final/trunks/` | 40 tiras WebP para o jogo | 3000×500 |
| `production/sprites/final/trunks-fx/` | 8 tiras WebP para cães e efeitos | 3000×500 |

As fontes foram geradas em definição maior que a célula final. Não há ampliação
de desenhos pequenos para simular 500px. Os PNGs mestres preservam a imagem sem
compressão com perdas; os WebPs de execução usam qualidade 96 e alpha 100.

## Proporções e transparência

A referência é o Trunks original do repositório: dreads claros, moletom roxo,
crucifixo dourado, calça xadrez larga e tênis branco/vermelho. Cada animação
recebe uma escala uniforme calibrada pela área visível do rosto no primeiro
frame. Essa escala se aplica ao corpo inteiro e a todos os seis frames. A pose
em pé tem cerca de 400px entre a cabeça e os pés; poses agachadas, curvadas ou
deitadas ficam naturalmente mais baixas, mantendo as proporções anatômicas.

O apoio fica em (250,456) na célula de 500px. Não há normalização individual
pela altura de cada pose, nem deformação de membros. O jogo conserva seu
sistema de coordenadas e usa `spriteScale: 0.7574`, calibrado para cerca de
470px de altura em pé junto do restante do elenco.

O fundo é alpha real, não uma grade pintada. A importação rejeita fontes com
alpha de fundo nos cantos; ruído residual de exportação até 3/255 é zerado.
Os pixels inteiramente transparentes também têm RGB zerado. As duas fontes
que apresentaram névoa de fundo foram corrigidas/regeneradas com `image_gen`.
Os prompts e a calibração de cada animação estão em `PLANO.json`; dimensões,
recortes, alpha, escala e hashes estão em `manifest.json`.

## Animações

Os 19 estados cobrem movimento, três defesas, três danos, queda, levantar,
recuo, escape, rolamento, tontura e vitória. Os 21 golpes correspondem a todas
as entradas de `trunks.moves`, incluindo Puxão, Dentada, Chamada, Abocanhada,
Ombrada, Gancho da Rua, A Ligação e Legião de Cães.

As oito camadas são corrida/mordida/salto/ataque final dos cães, ambulância
caindo, explosão, marca da Chamada e super dentes. Cada camada também tem
sua própria imagem e seis frames.

O perfil `six-frame` usa três desenhos na preparação, mantém o quarto no
contato real e usa os dois últimos na recuperação. Os estados percorrem seus
seis desenhos dentro da duração correspondente. O dano, as hitboxes, os
custos, as trajetórias e os tempos das regras de combate foram preservados.

## Refazer e revisar

```sh
npm ci
node tools/import-trunks-v3.mjs
npm test
npm run build
node tools/build-trunks-preview.mjs work/trunks-previa-500px.html
python3 -m http.server 8000
```

Abra `http://localhost:8000/production/qa/trunks-sprites.html` para a revisão
pelo leitor real. A prévia mostra uma animação por vez em 500×500, com pausa,
avanço, espelhamento, exportação do frame e fundos de contraste para verificar
o alpha. O arquivo independente exportado abre sem carregar imagens externas.
