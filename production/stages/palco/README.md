# Belém — Frente do Palco · v2

Pacote modular do segundo cenário de Salvadores Nacionais, na luta contra o Chupetinha.

**61 grupos, 88 arquivos finais, 18 tiras e 108 quadros ambientais.**
São 57 imagens novas selecionadas (incluindo o mastro compartilhado), 21 imagens reaproveitadas explicitamente de Belém,
uma arte de texto da faixa, três peças de interface e seis áudios.

O palco, as torres, os refletores, os feixes, os cabos, as mesas, a comida, os NPCs,
os barcos e os elementos da arquitetura continuam em arquivos independentes.
A composição final é somente uma apresentação derivada desses arquivos.

## Conferir

- `../../qa/palco-cenario-offline.html`: prévia independente; abre sem servidor, com câmera,
  pausa, avanço de pose, efeitos reduzidos, galeria, inspeção e download de cada arquivo.
- `../../qa/palco-cenario.html`: versão leve para servir pela raiz do repositório.
- `manifest.json`: assets, hashes, dimensões, recortes, posições, parallax e ordem.
- `PLANO.json`: inventário que orientou a produção.
- `source/prompts-completos.json`: prompts usados no ImageGen integrado.
- `source/generated/`: 59 PNGs originais preservados. A água usa `agua-v2.png`; a NPC de amarelo usa `npc-danca-1-v2.png`, com alpha corrigido.
- `source/pranchas/`: pranchas das dez animações novas.
- `audio/manifest.json`: origem, duração e níveis dos áudios.

O mundo tem 2600px, viewport 1920×1080, câmera 0–680, piso a partir de Y=826 e pés
em Y=930. O palco e a escada são decoração. O celular do chefe permanece no renderer
de combate e não está pintado no fundo. A cortina animada substitui a peça estática;
a alternativa estática continua disponível para inspeção.

## Reproduzir

Instale Pillow para exportação e FFmpeg para áudio:

```sh
python3 tools/export-palco.py
python3 tools/create-palco-audio-lite.py
node tools/finalize-palco.mjs
node tools/build-palco-preview.mjs
node tools/build-palco-preview.mjs --offline
node --test tests/unit/palco-stage.test.js
python3 tools/validate-palco.py
```

O áudio é síntese original com ritmo de rap/carimbó a 110 BPM, sem gravações de voz.
Introdução e loop são separados. Água e vento são reusos explícitos dos ambientes
sintetizados de Belém. A saída é Vorbis estéreo a 44,1 kHz; o sintetizador novo trabalha
a 22,05 kHz antes da exportação. Use `FFMPEG_PATH` caso FFmpeg não esteja no PATH.

Os mestres de animação usam grade 3×2, seis células de 500×500. O runtime usa tiras
3000×500 com alpha. Cada ação tem arquivo próprio. Os exportadores recortam e
dimensionam os originais; não substituem o desenho por código.

A integração usa `src/render/stage-packs.js`, com objetos posicionados, cache de imagens,
crops, tiras, chão e fallback integral. A animação recebe o relógio da partida para
congelar na pausa. Os metadados de fonte e dimensões não alteram colisão ou dano.
O catálogo de arenas é registrado sem baixar as imagens. A primeira apresentação
da arena solicita o seu pacote e mantém o fallback completo durante o carregamento.

A fonte Bangers segue SIL OFL; a licença acompanha `ui/FONTE-OFL.txt`.


## Revisão dos apoios e da transparência

As três fileiras de bandeirolas estão presas aos dois mastros de madeira e às treliças do palco. Todos os pares usam o mesmo parallax. Os pontos de suspensão ficam em `objects[].suspension`; `tools/stage-hangings.mjs` posiciona as peças e `tools/check-stage-hangings.mjs` verifica os dois apoios, a geometria das câmeras e alpha real em cada quadro. O mastro é o mesmo PNG gerado para o cenário dos banheiros, com fonte e prompt preservados nos dois pacotes.

A nuvem clara ao redor de `npc-danca-1` foi removida por edição de extração de fundo no ImageGen integrado, preservando identidade, roupa e seis gestos. A versão original permanece em `source/generated/npc-danca-1.png`. A extração deslocou duas células, corrigidas na normalização em +30px; `frameOffsets` registra o alinhamento. O crop é comum aos seis quadros. A auditoria `production/qa/palco-npc-alpha.json` verifica que o halo sumiu e que o apoio vertical varia no máximo2px de célula.

Para derivar novamente as imagens de interface a partir da composição, gere a prévia offline e execute `node tools/capture-banheiros-ui.mjs palco`, depois repita exportação/finalização/prévias. O script aceita ambos os cenários. Runtime e dimensões atuais estão em `production/qa/palco-validation.json`.
