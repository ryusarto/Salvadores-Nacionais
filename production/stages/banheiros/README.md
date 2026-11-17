# Cenário 03 — Belém: Banheiros Químicos

Arena de Pavanassi, montada com o mesmo contrato modular do cenário 02. Cada cabine, equipamento, personagem ambiental, texto, FX e áudio permanece em seu próprio arquivo; `manifest.json` posiciona as instâncias. A sátira mira a fiscalização excludente. O público e os serviços comunitários são acolhedores.

## Entrega

- 70 arquivos de runtime: 22 imagens novas, 34 imagens reutilizadas, seis gráficos digitados, seis áudios e duas imagens de apresentação.
- 14 tiras ambientais com 84 quadros: quatro novas e dez reutilizadas. Cada tira tem seis células de 500×500, layout horizontal de 3000×500 e recorte comum aos seis quadros.
- 24 PNGs originais preservados em `source/generated/`: 22 gerações iniciais e duas revisões de recorte, sem sobrescrever fontes. As revisões selecionadas de cabine acessível e papel são `*-v2.png`.
- Quatro pranchas normalizadas em `source/pranchas/`, prompts completos e hashes em `source/prompts-completos.json`, dimensões/crops/proveniência em `source/exports.json` e manifesto final.
- Trilha instrumental original a 104 BPM, intro/loop e ambiente sanitário sintetizados. Público/água/vento têm reutilização explícita; `audio/manifest.json` registra arquivos de origem, hashes, duração, pico/RMS e loops. Não há voz inteligível ou gravações externas.
- Tipografia Bangers digitada separadamente, fonte preservada e licença SIL OFL em `ui/FONTE-OFL.txt`.

Os mestres foram criados com a ferramenta integrada ImageGen, uma chamada por asset ou prancha, mais duas edições para recorte com alpha. Não foi usada a API/CLI de geração. Os PNGs conservam o resultado original; a exportação só organiza células, aplica recorte, redimensiona e codifica WebP. O texto permanece em arquivos gráficos próprios. As imagens da interface vêm da composição renderizada pelo jogo, sem substituir as peças por uma pintura achatada.

## Montagem e combate

Canvas lógico de 1920×1080, mundo de 2600px, câmera de 0 a 680, topo do piso em y=826 e pés em y=930. Objetos usam x=centro/y=base; parallax, tamanhos, FPS e fase estão no manifesto. `ground/calcamento.webp` usa a projeção existente de Belém. Cabines e público decorativos ficam atrás da luta, sem colisão nova.

`interactive` registra `cabine-fiscal`, `cerca-fiscal` e `carimbo-fiscal`. `drawStageProp` os desenha nas posições e dimensões atuais das entidades; cabine/cerca nunca são pintadas no fundo. A cabine cobalto/vermelha se distingue das cabines de fundo. Placas, trava pulsante, selo PROIBIDO, duração e rachaduras por HP continuam vivos no renderer. Regras, dano e hitboxes foram preservados. O carimbo pequeno sobre a mesa é apenas uma instância decorativa do mesmo arquivo.

O pack é solicitado quando a arena é exibida; se Pavanassi criar um objeto em outra arena, o desenho da entidade pode solicitá-lo. Enquanto carrega ou falta um prop, o fallback anterior permanece disponível. As animações usam o relógio da partida, congelam na pausa e ficam numa pose com efeitos reduzidos.

## Reprodução e inspeção

Requer Node com as dependências do projeto, Python 3 com Pillow e FFmpeg no PATH ou em `FFMPEG_PATH`. Os testes de navegador usam Chrome/Chromium instalado; é possível informar `BROWSER_EXECUTABLE`.

```sh
python3 tools/export-banheiros.py
node tools/finalize-banheiros.mjs
node tools/build-banheiros-preview.mjs
node tools/build-banheiros-preview.mjs --offline
python3 tools/validate-banheiros.py
node tools/check-banheiros-browser.mjs
node tools/build.mjs --external-assets --min --out=production/qa/banheiros-game.html
node tools/smoke-banheiros-game.mjs
```

A primeira exportação sem UI pode usar `--partial`. Depois gere a prévia offline, execute `node tools/capture-banheiros-ui.mjs` e repita exportação/finalização/prévias. `tools/create-banheiros-audio-lite.py` reproduz o áudio em memória com Python stdlib e FFmpeg; os arquivos de Belém/palco devem existir no checkout para os reusos.

`production/qa/banheiros-cenario.html` é a galeria vinculada ao repositório. `PREVIA_CENARIO_03.html` é sua versão autossuficiente, para abrir diretamente: câmera, pausa, avanço de pose, linha dos pés, personagens em escala, objetos, FX, piso, efeitos reduzidos, galeria isolada/download e demonstração dos objetos do Pavanassi intactos/danificados. O áudio só toca pelo controle do usuário. `ENTREGA_CENARIO_03.zip` reúne pack/fontes, prévia offline e instruções; não substitui a build completa do jogo.

## Validação e limites

Revisão independente: 49 testes de renderer, núcleo, história, regressões e mecânicas do Pavanassi passaram. Integridade dos 70 assets/14 tiras/84 quadros, hashes, alpha real, crops, fontes/reutilizações e decodificação dos seis OGGs confirmada. Relatórios em `production/qa/banheiros-validation.json`, `banheiros-browser.json` e `banheiros-game-browser.json`.

Chrome executou a arena pelo Versus, com carregamento sob demanda, seis áudios, pausa e estados reais do core: cabine5→4 HP, fila, cerca, proibição e A PERGUNTA(1300 de dano, tontura e remoção da cabine). A prévia passou por três câmeras, galeria, isolamento, efeitos e danos. Capturas em `production/qa/evidence/banheiros-*`.

O viewport mobile emulado foi 844×390; desempenho em aparelho físico e playtest humano não foram medidos. Runtime em torno de 9,20MB e estimativa de imagens decodificadas em torno de135,5MiB, sem contar áudio/GPU. Pavanassi ainda usa o corpo/retrato provisórios existentes; esta entrega cobre cenário e objetos de gameplay. Não há troca narrativa automática de cenário após a vitória. Merge e publicação do jogo são etapas separadas do envio da branch/PR.


## Revisão das bandeirolas

As duas fileiras e a bandeira retangular estão amarradas aos três mastros de madeira. Os mastros, os varais e a bandeira compartilham o parallax; os pontos de fixação são explícitos em `objects[].suspension`. `tools/check-stage-hangings.mjs` verifica geometria nas câmeras0/340/680 e alpha real nos apoios e nos seis quadros dos tecidos. O PNG do mastro e seu prompt são compartilhados com o segundo cenário.
