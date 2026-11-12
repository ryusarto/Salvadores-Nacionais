# Salvadores Nacionais

Jogo de luta 2D para navegador. Esta é a **build de combate**: as regras da luta
estão completas e os lutadores aparecem como manequins provisórios, que serão
trocados pelos sprites finais sem mexer nas regras.

## Jogar

Abra `dist/salvadores-nacionais.html` no navegador (arquivo único, sem instalação).

| Ação | Teclado | Controle (PS5/PS4/Xbox) | Celular |
|---|---|---|---|
| Mover / pular / agachar | WASD ou setas | direcional ou analógico | direcional à esquerda |
| Leve · Médio · Forte | J · K · L | □ · △ · ○ | LEVE · MÉDIO · FORTE |
| Especial (com ←, →, ↓ muda o golpe) | I | ✕ | ESP |
| Defesa (em pé, agachado com ↓, no ar) | U ou Shift | R1 ou L2 | DEF |
| Agarrão | O, ou J+K | L1 | LEVE+MÉDIO |
| Super (solta o mais forte; ↓ junto solta o de 1 barra) | P, ou L+I | R2 | SUPER |
| Golpes de sequência | → ← + J · ↓ → + K | → ← + □ · ↓ → + △ | iguais |
| Pausa / lista de golpes e combos | Enter | Options | II |

**Controle de PS5:** ligue por USB ou Bluetooth no computador, abra o jogo e
aperte qualquer botão; aparece "CONTROLE CONECTADO". Nos menus, ✕ confirma e
○ volta. Em **Controles** (menu inicial ou pausa) dá para testar cada botão e
trocar o mapeamento; a troca fica salva no navegador. O controle vibra nos
acertos.

**Lista de combos:** na pausa, cada personagem tem 4 combos. No Treino, escolha
um combo para treinar (o painel marca cada etapa que você acerta) ou peça a
demonstração (a CPU mostra como se faz). O Treino também mostra as últimas
entradas do controle à direita, para conferir os comandos.

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
- `docs/APRENDIZADOS.md` — mecânicas trazidas do estudo de um jogo de luta clássico.
- `src/data/combos.js` — lista de combos; `node tools/combos-check.mjs` executa todos.
- `tools/slice-sheet.py` — recorta uma prancheta de sprites em tiras do jogo.
