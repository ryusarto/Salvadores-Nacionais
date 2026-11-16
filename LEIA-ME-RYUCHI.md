# Ryuchi — kit completo de 500px

Cada sentido tem 49 animações do lutador (19 estados e 30 golpes) e oito efeitos
separados: **114 imagens próprias, 684 frames** no total. Direita e esquerda
mostram flancos diferentes e são selecionadas sem espelhamento automático. Cada imagem contém uma única animação de seis
frames de 500×500px, com alpha real e escala anatômica calibrada.

O gorro acompanha o formato da cabeça, sem tecido caído atrás. A bainha
permanece no quadril direito, conforme o sprite de referência. A mão esquerda
conduz a katana e a direita apoia o cabo durante os cortes. Nas pegadas de
duas mãos, os dois polegares mantêm a mesma orientação superior em direção
à guarda; nenhuma mão usa a pegada invertida. A bainha fica
vazia enquanto a lâmina está fora. Saque, retorno e rolamento seguem essa
continuidade; no rolamento a espada fica embainhada, presa ao quadril.

- `production/sprites/source/ryuchi-v3/pranchas/`: PNGs de 1500×1000, grade3×2.
- `production/sprites/source/ryuchi-v3/tiras/`: mestres PNG de 3000×500.
- `production/sprites/final/ryuchi/`: 49 tiras WebP do personagem.
- `production/sprites/final/ryuchi-fx/`: oito tiras WebP da lâmina e da voz.
- `production/sprites/source/ryuchi-v3/esquerda/`: fontes e PNGs da vista esquerda.
- `production/sprites/final/ryuchi-esquerda/`:49 tiras próprias voltadas à esquerda.
- `production/sprites/final/ryuchi-esquerda-fx/`: oito FX próprios para essa vista.
- `production/qa/ryuchi-sprites.html`: player de 500px com troca real de vista,
  avanço por frame, fundos de verificação e exportação de PNG.

Execute `npm ci`, `npm test`, `npm run build` e sirva a raiz com
`python3 -m http.server 8000`. Jogo: `http://localhost:8000/dist/salvadores-nacionais.html`.
Prévia: `http://localhost:8000/production/qa/ryuchi-sprites.html`.
`node tools/build-ryuchi-preview.mjs` cria a prévia independente para abrir
sem servidor em `production/qa/ryuchi-previa-500px.html`.

Os Três Cortes, quatro níveis do Fio, Postura da Lâmina, Contra-Lâmina,
Agudo e Agudo Supremo têm arte própria. A leitura acompanha as janelas reais
dos golpes e mantém apenas poses embainhadas durante a carga segurada.
Regras, dano e duração de combate não foram alterados.

Os FX novos substituem os rastros, ondas, impactos e defesas provisórios do
Ryuchi. O desenho antigo não é usado como sobreposição durante o carregamento
das novas camadas. Os demais personagens mantêm suas integrações existentes.
