# Salvadores Nacionais

Jogo de luta 2D para navegador. Esta é a **build de combate**: as regras da luta
estão completas e os lutadores aparecem como manequins provisórios, que serão
trocados pelos sprites finais sem mexer nas regras.

## Jogar

Abra `dist/salvadores-nacionais.html` no navegador (arquivo único, sem instalação).

| Ação | Teclado | Controle | Celular |
|---|---|---|---|
| Mover / pular / agachar | WASD ou setas | direcional | direcional à esquerda |
| Leve · Médio · Forte | J · K · L | X · Y · B | LEVE · MÉDIO · FORTE |
| Especial (com ←, →, ↓ muda o golpe) | I | A | ESP |
| Defesa (em pé, agachado com ↓, no ar) | U ou Shift | RB | DEF |
| Agarrão | O, ou J+K | LB | LEVE+MÉDIO |
| Super (solta o mais forte; ↓ junto solta o de 1 barra) | P, ou L+I | RT | SUPER |
| Golpes de sequência | → ← + J · ↓ → + K | | iguais |
| Pausa / lista de golpes | Enter | Start | II |

No celular, jogue com o aparelho deitado. A dificuldade (Fácil, Normal, Difícil)
fica no menu inicial. No Treino: F1 mostra as caixas de acerto, F2 muda o
boneco, F3 muda o nível da CPU.

## Desenvolver

```bash
npm install
npm test        # testes das regras e das mecânicas
npm run build   # gera dist/salvadores-nacionais.html
```

- `src/data/system.js` — todos os números globais (tempos, barras, dano).
- `src/data/characters/` — uma ficha por personagem: golpes e mecânica própria.
- `src/core/` — simulação a 60 quadros por segundo, sem depender de tela.
- `src/render/` — manequim, cenário, efeitos e HUD (provisórios).
- `design/game-brief.md` — o desenho do jogo.
- `docs/ARQUITETURA.md` — como criar personagens e aplicar sprites.
