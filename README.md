# Salvadores Nacionais

Jogo de luta 2D para navegador, com 8 heróis e uma campanha de 7 chefes, da Capeta Zanata ao Djabo.

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
npm ci
npm test        # testes das regras e das mecânicas
npm run build   # gera dist/salvadores-nacionais.html
npm run dev     # servidor HTTP e rebuild de src/; recarregue a página
npm run check:campaign # 56 partidas: todos os heróis contra todos os chefes
```

- `src/data/system.js` — todos os números globais (tempos, barras, dano).
- `src/data/characters/` — uma ficha por personagem: golpes e mecânica própria.
- `src/core/` — simulação a 60 quadros por segundo, sem depender de tela.
- `src/render/` — manequim, cenário, efeitos e HUD (provisórios).
- `design/game-brief.md` — o desenho do jogo.
- `docs/ARQUITETURA.md` — como criar personagens e aplicar sprites.
- `docs/MODO-HISTORIA.md` — a turnê: premissa, capítulos e os sete chefes.
- `docs/APRENDIZADOS.md` — mecânicas trazidas do estudo de um jogo de luta clássico.
- `src/data/combos.js` — lista de combos; `node tools/combos-check.mjs` executa todos.
- `tools/slice-sheet.py` — recorta uma prancheta de sprites em tiras do jogo.

## História e aprendizado

A campanha começa **diretamente contra a Capeta Zanata**, sem enfrentar aliados.
Cada Salvador percorre os sete capítulos: Zanata → Chupetinha → Pavanassi →
Fujão → Pai do Fujão → Laranjão → Djabo. Os outros Salvadores ajudam nos
shows, nas cozinhas e na mobilização da população. Os duelos entre heróis
continuam disponíveis no Versus.

Há checkpoint por confronto, progresso por herói e galeria de finais. Saves
antigos mantêm os capítulos concluídos; checkpoints antigos de duelos entre
aliados são descartados. O Djabo começa cada round na forma política e se
transforma ao perder a primeira barra.

**Aprender a lutar** ensina movimento, defesa, combo básico e combo aéreo.
Etapas puladas são registradas separadamente das cumpridas. No celular, os
menus aceitam toque direto; a luta pausa ao girar para retrato ou interromper
a janela. Depois, escolha Continuar. O Treino oferece botões para mudar
boneco, CPU, caixas e reiniciar; há botão próprio de agarrão e Questionar
quando a cabine do Pavanassi está ativa.

Em **Opções**, ajuste posição/tamanho dos botões e reduza tremor e clarões
de tela. Essa opção não remove todos os efeitos embutidos nas artes.

## Validação e produção

- `npm test`: regras, campanha, saves, resets e contratos de arte.
- `npm run check:campaign`: verifica os 56 encontros possíveis no motor; não substitui playtest humano.
- `node tools/balance.mjs 4`: torneio entre heróis; `--bosses` inclui chefes assimétricos.
- `npm run test:browser`: smoke em Chromium, com capturas em `artifacts/smoke/`.
  Requer Chromium instalado; use `CHROMIUM_PATH` para informar o executável.
  O teste usa a porta 8767 (`SMOKE_PORT` permite trocar) e encerra somente seu próprio servidor.
- `npm run dev -- --port=8766`: porta alternativa. Não há hot reload; recarregue após o rebuild.

[História atual](docs/MODO-HISTORIA.md) · [Fila e contrato de arte](docs/PRODUCAO-ARTE.md) ·
[Atualizações de direção](docs/ATUALIZACOES-DIRECAO.md).
As artes finais de chefes e das arenas posteriores continuam em produção.
Palco e banheiros têm variações funcionais provisórias; não são cenários finais pintados.

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

### Trunks — seis frames de 500px por animação

40 animações próprias e 8 camadas auxiliares, cada uma em imagem separada com
seis frames de 500×500px e alpha real: **288 frames**. PNGs em pranchas de
1500×1000 e tiras de 3000×500, com proporções calibradas pela referência do
personagem. Inclui todos os estados, golpes, supers, cães e ambulância.
[Prévia em 500px](production/qa/trunks-sprites.html) e
[fontes e instruções](production/sprites/source/trunks-v3/README.md).

### Belga — seis frames de 500px por animação

Rosto, porte, boné, tatuagens, colete bege e calça estampada baseados nas
referências fotográficas. **40 animações e 8 efeitos, 288 frames** com alpha
real, proporções calibradas e uma animação por PNG de 1500×1000. Tiras do jogo
em 3000×500. O Um-Dois acompanha os dois contatos; os supers acompanham os três
e sete lançamentos reais de vinil. As regras de combate e o BPM são preservados.
[Prévia em 500px](production/qa/belga-sprites.html),
[prévia independente para baixar](production/qa/belga-previa-500px.html) e
[fontes e instruções](LEIA-ME-BELGA.md).

### Ryuchi — katana e voz em seis frames de 500px

49 animações e oito efeitos **por sentido**, com arte própria para direita e
esquerda: **114 imagens e 684 frames** com alpha real, sem espelhamento. Gorro
justo, bainha no quadril direito e mão esquerda conduzindo a katana com apoio
da direita, com os dois polegares na orientação superior da pegada. Inclui os Três Cortes, os quatro níveis do Fio, contra-ataque e
os dois supers de voz, sincronizados com o combate.
[Prévia](production/qa/ryuchi-sprites.html),
[prévia independente](production/qa/ryuchi-previa-500px.html) e
[instruções e fontes](LEIA-ME-RYUCHI.md).

### Cenário — Belém / Ver-o-Peso

[Cenário completo](production/stages/belem/README.md): 36 grupos de assets,
45 arquivos finais, camadas com parallax, feira e barcos animados, 66 frames
de ambiente, trilha e sons originais sintetizados, miniatura e apresentação.
[Prévia interativa com câmera e galeria](production/qa/belem-cenario.html).
O jogo usa a arte nova; `?stage=off` permite comparar com o desenho provisório.

### Cenário 02 — Belém / Frente do Palco

[Pacote modular v1](production/stages/palco/README.md): 60 grupos, 87 arquivos finais,
18 tiras e 108 quadros ambientais. Palco, som, cozinha, público, luzes e arquitetura
são peças separadas, com originais e prompts preservados. A arena do Chupetinha
carrega o pacote quando é exibida e mantém fallback completo durante a carga.
[Prévia e galeria](production/qa/palco-cenario.html).
`node tools/build-palco-preview.mjs --offline` gera uma prévia independente.

### Elenco, retratos e interface em quadrinhos

Trunks, Ryuchi e Belga agora têm cerca de **470px de altura em pé**, na escala
dos demais heróis. Um material comum aproxima luz, sombra e contorno do elenco
sem alterar os desenhos originais, hitboxes ou regras. O material pode ser
comparado com `?material=off`.

Menus de início, seleção, versus, pausa e resultado usam a linguagem do cartaz
original, com amarelo, vermelho, creme, tinta preta e a fonte Bangers (SIL OFL).
A tela inicial mostra **os oito heróis**; os retratos têm animação discreta na
seleção e respeitam a preferência por movimento reduzido. O HUD usa os nove
ícones próprios, vida com dano recente, Ginga, rounds, combo e super em três níveis.

[Galeria e comparação de escala](production/qa/elenco-hud.html) ·
[Arquivos e direção de arte](production/ui/comic-v1/README.md).

## Capeta Zanata — sprites completos

A Zanata tem 41 animações de corpo e 12 efeitos **por sentido**, com seis
quadros próprios por animação: **106 tiras e 636 quadros**. Inclui todos os
estados do motor, os 19 golpes, três turbos, supers, Fúria e recuperação.
Direita e esquerda foram geradas separadamente; retrato e ícone seguem o
mesmo modelo visual. Dano, alcance e IA permanecem iguais.

[Galeria dos dois sentidos](production/qa/zanata-sprites.html) ·
[Fontes e contrato](production/sprites/source/zanata-v1/README.md).

- `node tools/import-zanata.mjs`: exporta os PNGs/WebP e os manifestos.
- `node tools/zanata-preview.mjs`: gera a galeria.
- `node tools/smoke-zanata.mjs`: testa renderização no Chromium após a build.
- `node tools/backup-zanata.mjs`: pacote local com fontes, tiras, retrato,
  código e SHA-256. GitHub é a cópia remota principal.

## Pavanassi — sprites completos nos dois sentidos

41 animações corporais por sentido e 16 efeitos separados: **98 tiras e 588
quadros**, com alpha real e seis desenhos por tira. Inclui golpes, turbos,
supers, carimbos, cerca, cabine, proibições e reação à Pergunta. Direita e
esquerda têm desenhos próprios; retrato e ícone seguem o mesmo personagem.

[Galeria e imagens originais](production/qa/pavanassi-v1.html) ·
[Contrato e inventário](docs/PAVANASSI-ARTE-V1.md).
`npm run test:pavanassi` verifica 20 cenas, ambos os sentidos e a decodificação
das 98 tiras no Chromium. Informe o executável com `CHROMIUM_PATH`.
