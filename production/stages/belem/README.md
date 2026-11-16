# Belém / Ver-o-Peso — cenário produzido

**36 grupos completos, 45 arquivos de entrega:** oito bases, 17 variantes de
objetos, oito animações, três efeitos, seis áudios e três peças de interface.
As imagens se inspiram nas três fotos fornecidas pelo usuário: Mercado de
Ferro e casario do Ver-o-Peso, barcos e paneiros no cais, Catedral da Sé.
Luz quente de fim de tarde, sombra violeta e materiais regionais, em traço
ilustrado compatível com os lutadores. Não é uma reconstrução geográfica.

Abra a [prévia interativa](../../qa/belem-cenario.html) por um servidor HTTP
na raiz do repositório. Ela permite percorrer a câmera, pausar, avançar frames,
conferir escala com Ryuchi e Belga, baixar a composição e ouvir os áudios.
O jogo compilado é [dist/salvadores-nacionais.html](../../../dist/salvadores-nacionais.html).

- [PLANO.json](PLANO.json): os 36 grupos, variantes e arquivos produzidos.
- [manifest.json](manifest.json): dimensões, recortes, hashes e metadados.
- `source/`: 20 imagens originais geradas, preservadas; 11 pranchas PNG
  de animação de 1500×1000; relatório de extração em `exports.json`.
- `layers/`: telas com alpha e larguras próprias para o percurso da câmera.
- `props/`: recortes estáticos de 512×512, incluindo variantes reutilizáveis.
- `animations/` e `fx/`: uma ação por arquivo, seis frames de 500×500,
  tira WebP de 3000×500 e transparência real. Total de 66 frames.
- `ground/`: textura de 1024×1024 com bordas fechadas para repetição.
- `audio/`: Vorbis estéreo 44,1 kHz, masterização com folga, manifesto de
  duração/loop; trilha instrumental original a 110 BPM inspirada no carimbó.
  Feira, água, aves e vento são **ambientes estilizados sintetizados**,
  sem gravações de campo ou fala humana inteligível.
- `ui/`: miniatura 960×540, apresentação 1920×1080 derivadas da composição
  renderizada e título SVG. Não há lutadores pintados na apresentação.

## Reprodução e integração

`node tools/import-belem.mjs` reexporta os originais. O exportador apenas
recorta, dimensiona e organiza as imagens: não repinta os mestres. Ruído de
alpha de até 12/255 é zerado. As variantes estáticas têm recorte próprio;
as animações mantêm escala única e ponto de apoio por sequência. As margens
do atlas de vegetação usam divisão em Y=640, preservando árvores completas.
Uma pequena marca de exportação abaixo dos prédios fica fora do recorte.

`python tools/create-belem-audio.py` reproduz a síntese determinística com
NumPy/SciPy e FFmpeg. `node tools/finalize-belem.mjs` atualiza os manifests;
`--ui-from=caminho.png` exporta as duas apresentações da composição capturada.
`npm run build` inclui os URLs com hash; sem `--external-assets`, o empacotador
também suporta embutir todos os arquivos no HTML.

O renderer usa camadas e objetos independentes. A arte substitui o cenário
provisório assim que as bases essenciais carregam; se uma base falhar,
o cenário anterior permanece inteiro. Não há sobreposição entre versões.
O calçamento é projetado por linhas, com escala 1 na altura dos pés Y=930.
Os NPCs ficam atrás do limite Y=826; nada altera hitboxes, dano ou física.
O tempo vem dos frames do jogo, sem depender da taxa de atualização da tela.

O áudio requer uma interação, respeita o botão SOM, menus, pausa e aba oculta.
Introdução e loop musical são agendados no mesmo relógio de áudio. Os outros
ambientes têm loops independentes discretos; nenhum arquivo tenta imitar uma
gravação real. `?stage=off` conserva a versão procedural para comparação.

Consulte [a especificação](../../../docs/CENARIO-01-VER-O-PESO.md) e as
evidências em `production/qa/evidence/belem-*.png`.
