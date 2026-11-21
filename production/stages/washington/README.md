# Cenário 06 — Washington: A Turnê Contra a Fome

Arena modular do Laranjão em frente ao palácio, conforme o roteiro e ART-18. Palácio, obelisco, chafariz, jardim e apoio comunitário estão em peças independentes. A população é acolhedora e a sátira permanece no chefe.

## Conteúdo

33 assets de runtime: 12 imagens/tiras novas, dez reusos registrados, três gráficos digitados, seis áudios e duas imagens de apresentação derivadas do renderer. São seis tiras de seis quadros (36 quadros ambientais): bandeira, água dos jatos, gotas/ondulação e três NPCs.

Mestres PNG originais e prompts integrais criados com a ferramenta integrada ImageGen estão em `source/generated/` e `source/prompts-completos.json`. Cada mestre teve uma chamada; nenhum foi sobrescrito. A exportação apenas recorta, registra o ponto de apoio, organiza células, redimensiona e codifica WebP. Não há geração por API/CLI nem redesenho procedural das pinturas. As bandeiras conservam o registro inicial de mastro/base em (160,480); os jatos usam origem fixa em (250,480). Grades 3000×500, células 500×500, crops comuns e offsets constam do manifesto. A fonte Bangers e sua licença SIL OFL são preservadas em `ui/`; os textos são digitados separadamente.

A comida, mesa, tenda, microfone, som e comunidade reaproveitam arquivos dos cenários anteriores com SHA256 e referência de origem por asset. Isso mantém a continuidade da turnê. Os originais desses reusos permanecem em seus packs de origem.

## Montagem e contrajogo

Mundo 2600×1080, janela 1920×1080, câmera 0–680, topo do gramado y=826 e pés y=930. O gramado usa projeção `flat` e não contém sombras pintadas de pessoas: somente o verdadeiro Laranjão recebe a sombra dinâmica do jogo. Clones/manchetes e armadura continuam desenhados pelo renderer real, sem alterações de regra.

Bandeiras incluem mastros, amarrações e base nos seis quadros. O chafariz e a origem dos jatos compartilham profundidade/apoio. Público, mesas, palco comunitário e equipamentos ficam atrás da luta e principalmente nas laterais. O microfone pequeno está apoiado na mesa, junto das marmitas. As placas acompanham a cobertura física da tenda.

`muralha-interativa` está em `interactive`, nunca nos objetos do fundo. `drawGoldWall` desenha a peça nas dimensões e posição da entidade; rachaduras por HP, animação de entrada, texto e fallback continuam vivos. A muralha do Laranjão tem seis HP e 640px de altura conforme o core; decoração não adiciona colisão. A prévia pode demonstrar muralha inteira/danificada, clones com manchetes e armadura através dos renderers reais. Os corpos continuam usando a representação atualmente integrada do chefe, sem novo kit corporal neste pacote.

## Reprodução

Requer Node e dependências do projeto, Python 3 com Pillow. Pillow aplica a fonte TTF diretamente, sem depender de fontes do sistema. Chrome/Chromium instalado é usado nas capturas (`BROWSER_EXECUTABLE` opcional). O áudio é reproduzido por Python stdlib/FFmpeg conforme a ferramenta do pack.

```sh
node tools/export-washington.mjs --partial
node tools/finalize-washington.mjs
node tools/build-washington-preview.mjs --offline
node tools/capture-washington-ui.mjs
node tools/export-washington.mjs
node tools/finalize-washington.mjs
node tools/build-washington-preview.mjs
node tools/build-washington-preview.mjs --offline
node tools/validate-washington.mjs
```

A primeira importação pode informar somente miniatura/carregamento ausentes; a captura os produz a partir da composição do jogo sem lutadores. Depois de mudar a montagem, repita exportação/finalização/captura e atualize hashes. A prévia offline abre diretamente; a vinculada fica em `production/qa/washington-cenario.html`. `WASHINGTON_SOURCE` pode indicar a pasta dos mestres em uma nova importação. Os PNGs copiados no pack são preservados.

## Evidência e limites

Integridade e crops em `production/qa/washington-validation.json`; revisão independente/execução são registradas separadamente pela equipe em `production/qa/`. A captura primária usa câmera 140 para mostrar o apoio comunitário e a fonte; a prévia permite percorrer todo o mapa. Esta entrega não afirma playtest humano, desempenho em aparelho físico ou publicação. A revisão de combate deve comprovar sombra/clones, armadura, muralha HP6, câmeras, pausa, carregamento e áudio antes do aceite final.

A primeira importação conserva os seis WebPs iniciais aprovados e seus metadados em `source/initial-manifest.json`. O master, registro e SHA continuam explícitos; os demais exports são reproduzidos a partir dos PNGs.

## Aceite desta entrega

A revisão independente aprovou o escopo testado, sem achados pendentes: 33/33 hashes, 27 imagens e seis áudios decodificados na prévia, 24 imagens em cena com `prepared:true`. Foram exercitados câmeras, pausa/avanço, efeitos reduzidos, galeria, filtros, controles de demonstração e mobile emulado. Os 15 testes focados passaram, incluindo três regressões novas da muralha e as mecânicas do Laranjão.

No Versus real, foram confirmados clones, muralha 6→3→1→quebra por projéteis, bloqueio de salto, armadura máxima de três cargas e consumo, banimento por 120 quadros e retorno com 1500 de dano. Instrumentação de desenho confirmou sombra no chefe real e no herói, nenhuma nos clones. O prop pintado da muralha foi usado no caminho preparado. Mastros, água, microfone e placas foram inspecionados na montagem final. Relatórios/capturas: `production/qa/washington-review/`.

A build local preserva o índice oficial de 26 pacotes/722 tiras; em checkout esparso pode ser reproduzida com `node tools/build-stage-release.mjs --stage=washington`, conforme opções do script. Os sprites ausentes na QA vieram da versão publicada com verificação de hash; o mapa novo foi servido localmente. O Laranjão conserva sua representação corporal da main: esta entrega produz cenário e muralha, não um kit novo do personagem.

O áudio pode ser regenerado por `python3 tools/create-washington-audio-lite.py`, com FFmpeg disponível (`FFMPEG_PATH` opcional). Não houve publicação desta entrega de Washington; integração ao jogo local e revisão em navegador não equivalem a playtest humano ou teste em aparelho físico.
