# Cenário 05 — Mansão: Prisão Domiciliar

Arena do Pai do Fujão, na sala da mansão. Segue o roteiro de `docs/MODO-HISTORIA.md`, a fila ART-17 em `docs/PRODUCAO-ARTE.md` e a ficha atual `src/data/characters/pai-fujao.js`. A comunidade permanece mobilizada do lado de fora na narrativa; o duelo ocorre dentro da sala.

## Assets separados

30 arquivos de runtime: 18 imagens/tiras novas, dois reusos de papelaria, dois gráficos digitados, seis áudios e duas imagens de apresentação. As quatro tiras ambientais têm seis quadros cada (24 quadros): lustre, cortinas, fogo e relógio. Cada faixa horizontal mede 3000×500, com células de 500×500 e recorte comum.

Papéis de parede, piso de mármore, lambri, sanca, porta, moldura da janela, vista do jardim, sofá, mesa, telefone, retrato, palmeira, lareira e arandela conservam arquivos independentes. `manifest.json` posiciona todas as instâncias; `PLANO.json` relaciona o inventário. Reusos de documentos/prancheta vêm do cenário dos banheiros, com SHA256 da origem registrado.

Os 19 mestres PNG estão em `source/generated/`: 18 gerações iniciais e uma correção de transparência das cortinas. Cada asset/prancha teve uma chamada da ferramenta integrada ImageGen; a correção foi uma edição na mesma ferramenta. Não foi usada API/CLI de geração. O primeiro resultado das cortinas tinha fundo branco sem transparência e foi preservado; o selecionado é `cortinas-vento-v2.png`. As quatro pranchas normalizadas estão em `source/pranchas/`. `source/prompts-completos.json` preserva todos os prompts, a seleção e a referência do retrato.

O retrato mantém o rosto, terno grafite, camisa branca aberta, óculos sobre a cabeça e mala do modelo aprovado do Fujão. A referência foi copiada de `arte-revisao/fujao-v1-6quadros/originais/right/parado/grupo-1.png`, com hash e função registrados; a cópia está em `source/referencias/fujao-modelo-aprovado.png`. Este prop não substitui a arte corporal do personagem.

Exportação aplica apenas organização das células, recorte comum, redimensionamento uniforme, registro dos apoios e codificação WebP. Nenhuma pose recebe escala individual. Fontes originais não foram sobrescritas. `source/exports.json` registra crops, dimensões, offsets, pivôs e hashes. Tipografia Bangers digitada separadamente; fonte e licença SIL OFL em `ui/`.

## Montagem e mecânicas

Mundo 2600×1080, janela 1920×1080, câmera 0–680, piso em y=826 e linha dos pés em y=930. `ground.projection: "flat"` reutiliza a extensão de piso introduzida no aeroporto. Parede, janela/jardim e todos os objetos internos compartilham parallax 1 para manter as fixações alinhadas.

Lustre e cortinas têm registro no apoio superior (250,20). O lustre inclui roseta e corrente; as cortinas incluem varão, argolas e suportes. Os pontos no mundo estão em `objects[].support` e `anchors`. O relógio é registrado pela base em x=250/y=480; a correção horizontal conserva a caixa no lugar enquanto o pêndulo oscila. O fogo também mantém a base. Telefone e papéis se apoiam no ponto calculado da superfície pintada da mesa. A vista do jardim fica atrás da moldura vazada, sem fundo aparecendo por fora.

A zona da tornozeleira não está pintada no mármore nem confundida com um tapete. O renderer original `drawAnkleZone` a desenha dinamicamente após o cenário: centro x=1560, raio 420, elipse com centro em y=940 e raio vertical 34. Na câmera 0, os últimos 60px do raio direito ficam além do viewport; a geometria segue a regra real. A prévia permite demonstrar posições neutra, perto da borda e fora da zona, chamando esse mesmo renderer. Essa demonstração não simula dano ou imunidade.

Nenhuma mudança em regras, hitboxes, dano, tempos, colisões ou estado do chefe. Choque, Foro, fúria, telefone e capanga continuam vinculados ao core. O chefe mantém a representação corporal da main. A porta é decorativa, como na montagem provisória; não foi criada uma nova animação de abertura ou transição para a cozinha comunitária. O final narrativo existente permanece preservado.

## Áudio

Seis OGGs originais sintetizados: intro de 5s e loop de 40s a 96 BPM, ambiente de sala, vento do jardim, relógio e cristais (16s cada). Sem gravações externas, samples, fala ou citação musical. `audio/manifest.json` registra origem/licença, duração, sample rate, canais, pico/RMS, medida da emenda e SHA256. Todos foram decodificados na produção; pico máximo medido 0,186279, sem clipping. Áudio na prévia começa somente pelos controles do usuário.

## Reprodução

Requer dependências Node do projeto, Python 3 com Pillow e FFmpeg (`FFMPEG_PATH` pode indicar o executável). Capturas usam Chrome/Chromium instalado, com `BROWSER_EXECUTABLE` opcional.

```sh
python3 tools/create-mansao-audio-lite.py
python3 tools/export-mansao.py --partial
node tools/finalize-mansao.mjs
node tools/build-mansao-preview.mjs --offline
node tools/capture-mansao-ui.mjs
python3 tools/export-mansao.py
node tools/finalize-mansao.mjs
node tools/build-mansao-preview.mjs
node tools/build-mansao-preview.mjs --offline
python3 tools/validate-mansao.py
node --test tests/unit/pai-fujao.test.js tests/unit/aeroporto-stage.test.js tests/unit/palco-stage.test.js tests/unit/banheiros-stage.test.js
node tools/build.mjs --external-assets --min
```

Na primeira exportação, somente miniatura/carregamento podem faltar; a captura os gera a partir da sala desenhada pelo renderer real. Após mudanças de montagem, repita captura/exportação/finalização para renovar os hashes. Uma build completa exige checkout dos sprites; na cópia esparsa usada nesta produção, o índice oficial de 26 pacotes/722 tiras foi preservado integralmente da main.

`production/qa/mansao-cenario.html` é a galeria vinculada; `mansao-cenario-offline.html` abre diretamente sem servidor. Câmera, pausa, avanço de pose, efeitos reduzidos, filtros, isolamento/download por peça, linha dos pés, lutadores opcionais em escala, demonstração da zona e pontos de apoio estão disponíveis.

## Base e revisão

Base local: main `91c8772` mais a entrega do aeroporto em `2338e51`, branch `art/cenario-05-mansao-pai-fujao-20261117`. O PR #25 é independente: quando reunir suas mudanças, a projeção flat precisa ser respeitada também no caminho preparado daquele PR (`drawPreparedGround`/`drawFast`), além do caminho normal presente aqui.

Inventário e integridade: `production/qa/mansao-validation.json`. Build/índice de personagens: `production/qa/mansao-build.json`. Revisão independente e capturas: `production/qa/mansao-review/`. Os níveis de evidência e limites são registrados nesses relatórios; mobile emulado não equivale a teste em aparelho físico nem a playtest humano. A produção e execução são locais; não constituem publicação do jogo.


## Resultado da revisão desta entrega

A revisão independente aprovou o escopo testado, sem achados pendentes. Foram executados 20 testes (seis do Pai do Fujão, quatro de piso e dez dos cenários anteriores), conferidos 30/30 hashes e decodificados 24 imagens/seis áudios da prévia e 21 imagens do cenário no jogo. Foram exercitados câmeras 0/340/680, seis poses, pausa/avanço, efeitos reduzidos, filtros, galeria/isolamento, apoios e viewport mobile emulado 844×390, sem erros de JavaScript, HTTP ou rede.

No Versus Belga→Pai do Fujão, o carregamento ocorreu sob demanda e a pausa congelou o core. Estados reais confirmaram borda em x=1980, choque de 900/dizzy de 80 quadros, três imunidades iniciais com dano mínimo de 1 conforme o core existente, cassação após seis cargas e retorno após 480 quadros, fúria em 50% de vida com multiplicador 1,2 e chamada de capanga. A base do relógio foi corrigida após o achado QA-MAN-01 e retestada: centros x=250 e base y=480 em todos os seis quadros.

Build local SHA256 `31b7294847986ee5b6b4f79b41d68ffca565f75883131d341452271e7da7bdca`. Na execução, sprites ausentes do checkout esparso vieram do jogo publicado com verificação do SHA da URL; os cenários novos permaneceram locais. Não houve publicação nem merge. Os relatórios não comprovam diversão, desempenho em aparelho físico ou playtest humano.

Runtime do pack: 6.222.506 bytes. Estimativa de imagens decodificadas: 76.453.376 bytes, incluindo UI, sem áudio/GPU; não é uma medição de uso de memória em hardware.
