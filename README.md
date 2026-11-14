# Salvadores Nacionais

Jogo de luta 2D para navegador, com 8 heróis e a chefona Capeta Zanata.

**Jogue online:** https://ryusarto.github.io/Salvadores-Nacionais/

O código é aberto (licença MIT): qualquer pessoa pode copiar, alterar e
melhorar o jogo. Veja [Contribuir](#contribuir).

## Jogar

Abra o link acima para jogar.
A build em `dist/salvadores-nacionais.html` carrega as imagens de
`production/sprites/final/` separadamente. Para jogar no seu computador, sirva a raiz do projeto por HTTP
(por exemplo, `python3 -m http.server 8000`) e abra `http://localhost:8000/dist/salvadores-nacionais.html`.
Para gerar uma edição offline de arquivo único, execute
`node tools/build.mjs --out=dist/salvadores-nacionais-offline.html`.

O kit de 15 animações novas do Dney pode ser revisado em
[`production/qa/dney-sprites.html`](production/qa/dney-sprites.html).

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

**Versus 2 jogadores:** no menu, escolha VERSUS 2 JOGADORES e cada pessoa
aperta ✕ no seu controle para entrar (o teclado também pode ser um dos
jogadores, com Enter). Cada um escolhe o personagem com o próprio cursor e
confirma com ✕; ○ desfaz. Na luta, cada controle comanda o seu lutador e vibra
pelo seu lado. Não há desvantagem de dificuldade nesse modo.

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

## Contribuir

Qualquer pessoa pode mexer no jogo:

1. Clique em **Fork** no topo desta página: o GitHub cria uma cópia do jogo na sua conta.
2. Altere o que quiser na sua cópia (golpes em `src/data/characters/`, números em
   `src/data/system.js`, sprites em `production/sprites/`).
3. Rode `npm test` e `npm run build` e abra `dist/salvadores-nacionais.html` para testar.
4. Para mandar a mudança para o jogo oficial, abra um **Pull Request**. Depois de
   aceito, ele aparece no link de jogar.

Ideias e problemas também podem ser enviados pela aba **Issues**.

## Licença

[MIT](LICENSE): use, copie, altere e distribua à vontade, mantendo o aviso de licença.

## Chapuh completo

40 animações alinhadas em células de 768 × 768 com origem dos pés (384,700), além de oito camadas do pinscher caramelo e da tinta. Revisão: [production/qa/chapuh-sprites.html](production/qa/chapuh-sprites.html). Fontes e prompts: [production/sprites/source/chapuh-v2](production/sprites/source/chapuh-v2).

### Majis — sprites completos

40 animações e 8 FX próprios, alinhados em células de 768×768 com apoio em (384,700). Figurino e rosto conforme referências, cabelo preto, Flying V e silhueta magra. [Revisão das animações e efeitos](production/qa/majis-sprites.html). Fontes e prompts em `production/sprites/source/majis-v2/`.

### MDEP — dez quadros por ação

49 tiras PNG com alpha: 19 estados, 22 golpes e 8 efeitos separados. Cada tira tem dez células de 768×768, sem ampliar poses dobradas para simular definição. Moletom vermelho, lenço branco/vermelho, cargo preta e botas grandes, sem óculos. [Prévia interativa](production/qa/mdep-sprites.html) e [manifesto e prompts](production/sprites/source/mdep-v3/). SA1 e SA3 compartilham a sequência compatível do fuzil; os quatro e dez disparos seguem o combate real.

### Franco — integração do fork francothesir

44 tiras próprias e 18 efeitos separados, incluindo especiais turbinados, flashes, tinta e Obra-Prima. A mesma integração acrescenta sete efeitos do Dney e o laser dos olhos. [Registro da contribuição](production/qa/FRANCO-DNEY.md). As contribuições de Majis e Chapuh foram preservadas.
