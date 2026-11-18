# Cenário 04 — Aeroporto: A Fuga

Arena do Fujão na pista ao entardecer, conforme `docs/MODO-HISTORIA.md` e `src/data/characters/fujao.js`. O terminal, a torre, o hangar, o avião e sua escada são peças independentes. O mapa foi montado no renderer existente de JavaScript/Canvas.

## Entrega

41 assets de runtime: 17 imagens/tiras novas, nove reutilizadas dos banheiros com hashes de origem, sete gráficos próprios, seis áudios e duas imagens de apresentação derivadas da montagem real. São nove tiras ambientais de seis quadros, totalizando 54 quadros: equipe de pista, segurança, biruta, baliza, três integrantes da comunidade, poeira e papel ao vento.

Os 17 PNGs originais estão em `source/generated/`; prompts integrais em `source/prompts-completos.json`. Cada asset/prancha teve uma chamada da ferramenta integrada ImageGen. Não foi utilizada API/CLI de geração. A exportação preserva o original e só recorta, redimensiona, registra o apoio dos quadros e codifica WebP. As quatro pranchas normalizadas ficam em `source/pranchas/`. As tiras novas são 3000×500, com seis células de 500×500 e crop comum; a base opaca fica em y=480 em todos os quadros. Registros, pivôs, dimensões e hashes estão em `source/exports.json` e `manifest.json`.

A tipografia é digitada separadamente com Bangers, fonte e licença SIL OFL preservadas em `ui/`. As faixas e a seta da pista têm fonte SVG editável em `source/`. A prancha de composição é uma captura do renderer real, não uma pintura achatada que substitui as peças.

## Montagem

Mundo 2600×1080, janela 1920×1080, câmera 0–680, piso a partir de y=826 e pés em y=930. O novo `ground.projection: "flat"` permite usar o asfalto pintado; os três cenários anteriores conservam sua projeção. Objetos usam x=centro/y=base. O avião e a escada têm parallax 1, e o topo da escada se encaixa no limiar da porta em x=2420/y=730,45; a base chega a y=930. O bico do avião continua além da borda direita da arena, como na montagem provisória, e pode ser visto inteiro na galeria isolada.

Biruta e tecido permanecem ligados ao mastro em todos os quadros; refletores e placas incluem seus postes e bases. A ordem de desenho deixa a comunidade à frente da asa e o texto de embarque legível. As peças decorativas não adicionam colisão. A escada fica no intervalo de embarque existente do Fujão: x=2300 e alcance 280. Dano, cura, tempos, hitboxes e contrajogo não foram alterados.

Áudio: tema instrumental original sintetizado a 112 BPM, intro 4,286 s e loop 34,286 s, mais ambiente de pista, vento, turbina distante e sinal de embarque, com 16 s cada. Sem voz inteligível, gravações externas ou samples. `audio/manifest.json` contém origem/licença, SHA256, duração, pico/RMS e medida da emenda dos loops; todos os seis OGGs foram decodificados. O pico máximo medido é 0,2714, sem clipping.

## Reprodução

Requer Node com as dependências do projeto, Python 3 com Pillow e FFmpeg disponível (`FFMPEG_PATH` pode informar o executável). As capturas usam Chrome/Chromium instalado (`BROWSER_EXECUTABLE` opcional).

```sh
python3 tools/create-aeroporto-audio-lite.py
python3 tools/export-aeroporto.py --partial
node tools/finalize-aeroporto.mjs
node tools/build-aeroporto-preview.mjs --offline
node tools/capture-aeroporto-ui.mjs
python3 tools/export-aeroporto.py
node tools/finalize-aeroporto.mjs
node tools/build-aeroporto-preview.mjs
node tools/build-aeroporto-preview.mjs --offline
python3 tools/validate-aeroporto.py
node --test tests/unit/aeroporto-stage.test.js tests/unit/fujao.test.js tests/unit/palco-stage.test.js tests/unit/banheiros-stage.test.js
node tools/build.mjs --external-assets --min
```

A primeira exportação pode acusar somente miniatura/carregamento ausentes; as capturas os produzem. Depois de mudar o layout, gere a prévia, capture a UI e repita exportação/finalização para renovar os hashes. Uma build completa requer o checkout completo dos sprites; esta entrega preservou o índice oficial da main (26 pacotes/722 tiras) sem criar referências parciais a partir do checkout esparso.

`production/qa/aeroporto-cenario.html` é a galeria ligada ao pack; sua versão `aeroporto-cenario-offline.html` abre diretamente. Inclui câmera, pausa, avanço de quadro, linha dos pés, lutadores em escala opcionais, efeitos reduzidos, filtros, zona de embarque/âncoras, isolamento e download por peça. Áudio só inicia pelo controle do usuário.

## Validação e limites

Inventário dos 41 assets, 17 mestres, 9 tiras/54 quadros, hashes, transparência, crops, bases, origem dos reusos e encaixe porta/escada passaram em `production/qa/aeroporto-validation.json`. Revisão independente executou 18 testes (quatro novos de piso, cenários 2/3 e quatro do Fujão), sem falhas.

O Chrome decodificou 35 imagens e seis áudios da prévia, verificou câmeras 0/340/680, seis poses, pausa/avanço, filtros, isolamento/galeria, efeitos reduzidos e viewport 844×390, sem erros de JavaScript/HTTP/rede. No jogo, o Versus Belga→Fujão carregou a arena sob demanda (32 imagens/6 áudios); pausa congelou o core. Estados reais do core confirmaram embarque, cancelamento por aproximação e cura de 1400 HP após 90 quadros. Evidências e relatório independente: `production/qa/aeroporto-review/`.

Execução foi local. Os sprites ausentes no checkout esparso foram servidos do jogo publicado com verificação do SHA da URL; o novo cenário permaneceu local. Não houve publicação no GitHub nem merge. O Fujão conserva o fallback de personagem da main: este pacote produz o cenário, não altera sua arte corporal. Não há animação automática nova de decolagem/prisão; a conclusão narrativa existente foi preservada. Mobile foi emulado, sem medição em aparelho físico ou playtest humano.

A produção artística partiu da main `91c8772`. A integração conjunta dos cenários 04/05 foi atualizada para a main `a5ba261`, que já inclui o PR #25. O piso `flat` agora é respeitado tanto na prévia editável quanto no caminho preparado da luta. As melhorias de carregamento, worker, paleta e pré-montagem permanecem ativas. Evidências atuais em `production/qa/cenarios-04-05-integration.json` e `production/qa/cenarios-04-05-integration/browser-review.json`; os relatórios anteriores conservam suas bases históricas.
