# Salvadores Nacionais

Jogo de luta 2D para navegador. Esta é a **build de combate**: as regras da luta
estão completas e os lutadores aparecem como manequins provisórios, que serão
trocados pelos sprites finais sem mexer nas regras.

## Jogar

Abra `dist/salvadores-nacionais.html` no navegador (arquivo único, sem instalação).

| Ação | Teclado | Controle |
|---|---|---|
| Mover / pular / agachar | WASD ou setas | direcional |
| Leve · Médio · Forte | J · K · L | X · Y · B |
| Especial | I (com ←, →, ↓ muda o golpe) | A |
| Ginga (aparar) | U | RB |
| Agarrão | O, ou J+K | LB |
| Super | P, ou L+I (↓ para o de 3 barras) | RT |
| Pausa / lista de golpes | Enter | Start |

No Treino: F1 mostra as caixas de acerto, F2 muda o boneco, F3 muda o nível da CPU.

## Desenvolver

```bash
npm install
npm test        # 24 testes das regras e das mecânicas
npm run build   # gera dist/salvadores-nacionais.html
```

- `src/data/system.js` — todos os números globais (tempos, barras, dano).
- `src/data/characters/` — uma ficha por personagem: golpes e mecânica própria.
- `src/core/` — simulação a 60 quadros por segundo, sem depender de tela.
- `src/render/` — manequim, cenário, efeitos e HUD (provisórios).
- `design/game-brief.md` — o desenho do jogo.
