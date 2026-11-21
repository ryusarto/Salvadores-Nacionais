# Cenário 07 — Inferno: O Último Refrão

Arena final do Djabo, conforme `docs/MODO-HISTORIA.md`, ART-19 de `docs/PRODUCAO-ARTE.md` e `src/data/characters/djabo.js`. O trono vazio, as correntes e o coro de almas são peças de cenário; as duas formas do chefe e seus ataques continuam no sistema de combate.

## Conteúdo e fontes

22 assets de runtime: 13 imagens/tiras geradas, um título digitado, seis áudios e duas imagens de apresentação derivadas da montagem real. Quatro tiras de seis quadros somam 24 quadros ambientais: corrente, fogo elevado, lava distante e coro de almas. Cada tira mede 3000×500, com seis células de 500×500, crop comum e registro explícito.

Mestres PNG e prompts completos são preservados em `source/generated/` e `source/prompts-completos.json`. A arte foi criada com a ferramenta integrada ImageGen pelo coordenador. O exportador não redesenha pinturas: somente recorte, registro de apoio, escala uniforme entre células, packing e WebP. As pranchas normalizadas ficam em `source/pranchas/`; dimensões, origem, pivô, offsets e hashes dos exports e mestres constam de `source/exports.json` e `manifest.json`. A fonte Bangers é aplicada diretamente pela TTF via Pillow; a fonte e licença SIL OFL ficam em `ui/`.

A revisão visual 2 usa `esqueletos-coro.png` na chave estável `almas-coro`: três esqueletos cantam em seis poses. Os mestres humanos anteriores permanecem como histórico de produção, sem uso no runtime. São 13 visuais selecionados; os PNGs históricos adicionais não ampliam a contagem de assets do pack. A nova fonte e seus prompts ficam preservados byte a byte.

## Montagem e leitura do combate

Mundo 2600×1080, viewport 1920×1080, câmera 0–680, piso a partir de y=826 e pés y=930. O piso de basalto é escuro e neutro, sem lava, chamas ou faixa segura pintadas na região de combate. A lava distante termina acima de y=826. Oito grupos de chamas, com alturas de 180–290px e fases diferentes, se apoiam na lava distante em y=805 e parallax 0,2. São desenhados antes de portal, coro e escadaria. Dois braseiros laterais mantêm as cubas de apoio e chamas ampliadas; o fogo perigoso continua sendo desenhado pelas entidades reais sobre o chão.

As correntes incluem a fixação em rocha e usam apoio superior registrado em (250,20); seus pontos e o teto compartilham parallax 0,8. Os demais loops mantêm a base em (250,480). Braseiros e chamas têm profundidade solidária e apoio físico. A escadaria sustenta o trono; portal e coro ficam atrás da luta. `anchors` e `objects[].support` registram pontos de inspeção.

Nenhuma alteração de dano, hitbox, transformação ou regra pertence a este pack. O trecho seguro do Inferno Nacional é sempre o intervalo real sorteado pelo core, com largura 360. A prévia pode chamar a criação real do super para demonstrar aviso/ativo e a geometria, sem simular dano; essa demonstração é desligada nas imagens de apresentação. Não existe safezone no bitmap. O corpo do Djabo conserva a representação atualmente integrada.

## Áudio e reprodução

Seis OGGs originais sintetizados, com medições e licença em `audio/manifest.json`. `audio-lava-distante` é a chave do OGG no pack para não colidir com a tira visual `lava-distante`; o arquivo continua `audio/lava-distante.ogg`. Áudio na prévia só inicia pelo controle do usuário.

Requer Node com dependências do projeto, Python 3 com Pillow e FFmpeg para recriar áudio. Capturas usam Chrome/Chromium (`BROWSER_EXECUTABLE` opcional). `INFERNO_SOURCE` pode indicar a pasta dos mestres; se ela não existir, o exportador usa as cópias preservadas no próprio pack.

```sh
python3 tools/export-inferno.py --partial
node tools/finalize-inferno.mjs
node tools/build-inferno-preview.mjs --offline
node tools/capture-inferno-ui.mjs
python3 tools/export-inferno.py
node tools/finalize-inferno.mjs
node tools/build-inferno-preview.mjs
node tools/build-inferno-preview.mjs --offline
node tools/validate-inferno.mjs
```

A primeira exportação pode informar miniatura/carregamento ausentes; a captura gera ambos com o renderer do jogo, sem personagens nem demonstração de perigo. Após qualquer mudança de montagem, recapture UI, reexporte e finalize novamente para atualizar os hashes.

## Evidência e limites

Integridade/alpha/crops/apoios em `production/qa/inferno-validation.json`. Revisão independente, controles de prévia, combate, transformação e faixa segura são níveis adicionais e ficam nos relatórios de QA. Uma composição e os testes estáticos não certificam gameplay, desempenho em aparelho físico ou playtest humano. A revisão visual 2 está aprovada no escopo descrito em `production/qa/inferno-review-v2/final-review.json`; a evidência anterior reaproveitada é identificada separadamente. A produção local não implica publicação no GitHub.

## Revisão original (v1)

A revisão original, registrada no commit `5efa45d` antes dos esqueletos e do fogo adicional, está em `production/qa/inferno-review/final-review.json`: 11 testes unitários, 216 casos isolados de geometria/renderização e 24 casos sobre a composição completa, com o intervalo seguro declarado livre de chamas. Os 22 hashes e os 24 quadros foram conferidos; a prévia decodificou 16 imagens e seis áudios. No jogo, 13 imagens de cenário ficaram preparadas e os seis áudios foram carregados. Versus real confirmou ambas as formas do Djabo, transformação, segundo KO e reinício da rodada. Câmeras, pausa/avanço e mobile emulado foram verificados. Não houve playtest humano ou teste em aparelho físico.

A comparação inicial de pixels da composição apresentou uma diferença também reproduzida com o ataque desligado e a cena parada. Após estabilizar o readback do Canvas, os 24 casos passaram sem alterar a produção. O diagnóstico e os resultados corrigidos foram preservados; a possível troca de backend do navegador é uma inferência documentada.

A build local parte do commit Washington `2d7f197874cfc194d7c65d172b4f5582178b09a3`, preservando seu índice de 26 pacotes/722 tiras de personagens. Alterações posteriores da main em menu e Pai do Fujão não foram incorporadas nesta entrega independente. O problema de índice parcial observado na main ficou separado em `production/qa/main-sprite-index-review.json`, para a revisão geral e futura integração. O comando e os hashes exatos da build estão em `production/qa/inferno-build.json`.

## Revisão visual 2 — esqueletos e fogo ampliado

A nova revisão independente está em `production/qa/inferno-review-v2/final-review.json`, com `passed:true` e nenhum achado pendente. Foram conferidos os 22 hashes, seis poses completas do coro de esqueletos sem matte perceptível, oito apoios de fogo sobre a lava e dois braseiros ampliados. A prévia passou nas três câmeras, pausa/avanço, efeitos reduzidos, galeria e viewport mobile emulado. Seis comparações de aviso/ativo, com o baseline Canvas estabilizado, mantiveram o intervalo seguro de 360 pixels sem mudança de pixels.

O smoke em Versus carregou a arena preparada e exerceu o Inferno Nacional da primeira forma no core real. Nove arquivos de código e os seis áudios permanecem idênticos ao commit `5efa45d`; os 216 casos amplos, transformação e timings da primeira revisão foram reaproveitados por essa equivalência, sem alegar nova execução. A inspeção mobile do jogo capturou o Canvas interno; não certifica toda a interface touch. Sem playtest humano ou aparelho físico.

A entrega revisada pode ser recriada após o commit com `python3 tools/package-inferno-delivery.py --repo CAMINHO_DO_REPOSITORIO --dest PASTA_DA_ENTREGA_V2`. O empacotador exige revisão aprovada, confere hashes da build/manifesto/assets e testa o CRC do ZIP. Os mestres humanos históricos são preservados, mas a fonte selecionada do coro é somente `source/generated/esqueletos-coro.png`.
