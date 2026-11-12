# Arquitetura

O jogo é dividido em três camadas que não se misturam. É isso que permite
reaproveitar o combate em outro jogo e trocar a arte sem mexer nas regras.

```
src/data/      DADOS      números e fichas: nada de lógica de tela
src/core/      REGRAS     simulação a 60 quadros por segundo, sem tela nem som
src/render/    ARTE       desenha o estado; nunca altera as regras
src/ui/        TELAS      menus, teclado, controle, toque, som
```

## Regras (`src/core/`)

- `match.js` — `createMatch({chars, seed, dmgMul})` e `step(estado, entradaJ1, entradaJ2)`.
  Uma luta é só uma função chamada 60 vezes por segundo. Com a mesma semente e
  as mesmas entradas, o resultado é sempre igual (bom para testes e replays).
- `input.js` — memória dos botões: guarda apertos recentes, a direção segurada
  na hora do aperto e as sequências (→ ← e ↓ →).
- `fighter.js` — máquina de estados do lutador e escolha da ação.
- `combat.js` — acerto, defesa, defesa perfeita, blindagem, agarrão, combos.
- `entities.js` — projéteis, marcas, poças, ajudantes.
- `ai.js` — a CPU produz a mesma entrada que um jogador.

A simulação só **emite eventos** (`st.events`): a arte e o som escutam.

## Como criar um personagem

1. Copie uma ficha de `src/data/characters/` (a do Franco é a mais simples).
2. Troque nome, cores e velocidades.
3. Em `moves`, comece de `baseNormals()` e declare os especiais com `mv({...})`:
   tempos, caixa de acerto, dano, e o que mais o golpe fizer.
4. A mecânica própria vai em `mech`, com ganchos opcionais: `init`, `tick`,
   `onHit`, `onBlocked`, `onGotHit`, `modifyMove`, `remap`, `extraCancel`,
   `dmgMul`, `hud`, `aiPlan`.
5. Adicione a ficha em `characters/index.js`.
6. `npm test` confere que todo golpe é válido; `node tools/balance.mjs` mede a força.

## Como aplicar sprites

A ponte entre regras e arte é o **contrato de animação** (`src/render/anim.js`):
ele diz qual tira e qual quadro mostrar em cada estado.

1. `node tools/pose-guides.mjs <personagem>` gera os guias de pose.
2. Desenhe cada tira por cima do guia, no mesmo tamanho.
3. Salve em `production/sprites/final/<personagem>/<tira>.png`.
4. `npm run build` embute as tiras no HTML. O que não tiver tira continua
   aparecendo como manequim, então dá para aplicar a arte aos poucos.

O fundo liso das tiras é recortado sozinho. Efeitos de golpe, sombra e o
chicote da Zanata são desenhados pelo jogo, não entram no sprite.

## Ferramentas

| Comando | O que faz |
|---|---|
| `npm test` | Testes das regras e de cada mecânica |
| `npm run build` | Gera `dist/salvadores-nacionais.html` |
| `node tools/balance.mjs` | Todos contra todos, CPU contra CPU |
| `node tools/difficulty.mjs` | Chance de vitória em cada dificuldade |
| `node tools/pose-guides.mjs franco` | Guias de pose para os sprites |
