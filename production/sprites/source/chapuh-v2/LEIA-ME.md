> Atualização: este pacote foi integrado e alinhado a células reais de 768px. Consulte INTEGRACAO.md. As observações de integração pendente abaixo descrevem a entrega de arte anterior.

# Chapuh — pacote de sprites

Arte gerada com a ferramenta integrada `image_gen`, usando os sprites de Chapuh do repositório Salvadores Nacionais para roupa e linguagem visual e o vídeo IMG_3508.MOV enviado pelo usuário para identidade facial. Expressões variam por ação: concentração, esforço, dor, assobio, comando e comemoração.

## Conteúdo

- `raw/`: pranchas originais em PNG com quatro quadros, em grade 2 × 2. Versões revistas levam `-v2` ou `-v3`; o arquivo selecionado consta no manifesto.
- `tiras-768/`: tiras horizontais de 3072 × 768, quatro células de 768 × 768, com transparência.
- `quadros-768/`: cada desenho separado em PNG de 768 × 768.
- `manifest.json`: arquivos selecionados, escala aplicada e verificações de transparência e margem.
- `PLANO.json`, `EXPRESSOES.json` e `REVISOES-PLANO.json`: movimentos, pedidos e critérios de revisão.
- `preview.html`: prévia local com reprodução, avanço de quadro e espelhamento. A velocidade da prévia é apenas ilustrativa.

As resoluções de entrega são normalizadas. Elas não representam resolução nativa adicional: o tamanho exato de cada original está no manifesto. A normalização conserva proporções e usa uma escala única por sequência; poses baixas e aéreas têm alturas ajustadas para o jogo.

## Cobertura do personagem

19 sequências de estado: parado, andar, andar para trás, correr, agachar, pular, recuar, escapar do agarrão, recuperar rolando, três defesas, três reações de dano, caído, levantar, tonto e vitória.

21 sequências de combate: 5L, 5M, 5H, 2L, 2M, 2H, 3H, 6M, jL, jM, jH, agarrão, blindado, 5S, 2S, 6S, 4S, c1, c2, SA1 e SA3. Os nomes dos arquivos correspondem ao contrato de animação do código consultado.

## Integração

Este pacote entrega a arte e a prévia. A integração ao jogo e a validação de temporização em combate ainda precisam ser feitas. Para importar o personagem, usar apenas as 40 tiras do personagem listadas no manifesto, preservando seus nomes, e revisar:

1. Os `spriteAlias` de Chapuh atualmente têm prioridade sobre as tiras de mesmo nome. Remover os aliases substituídos por arte específica.
2. Configurar `spriteRecovery` para o escape de agarrão e o rolamento de recuperação.
3. Sincronizar os quatro desenhos de cada golpe com preparação, antecipação, contato e recuperação, usando o mecanismo `spritePhasedMoves` já existente.
4. O contrato atual usa uma pose em várias defesas e reações de dano. Ajustar esse contrato se forem reproduzidas as quatro fases fornecidas.
5. Pés de referência das tiras do personagem: `(384, 700)` em células de 768 × 768. Poses no ar preservam o deslocamento relativo dos membros.

Pinscher e efeitos são elementos separados. Exigem registro e posicionamento no leitor de entidades/efeitos; não devem ser tratados como poses do lutador. Ajustar a escala destes elementos ao tamanho definido pelo combate.

Fontes consultadas em 13/11/2026: `production/sprites/README.md`, `src/render/anim.js`, `src/render/sprites.js`, `src/data/movekit.js` e `src/data/characters/chapuh.js` de https://github.com/ryusarto/Salvadores-Nacionais.

## Entrega e verificação final

48 sequências, 192 quadros: 40 do Chapuh, quatro do pinscher caramelo baseadas nas fotos enviadas e quatro efeitos de tinta. A pasta extras/ contém as pranchas, tiras e quadros do pinscher e dos efeitos. Os originais descartados não fazem parte do pacote final.

QA.json confirma as dimensões de todas as tiras e quadros, quatro quadros diferentes por sequência e ausência de conteúdo cortado nas bordas das células exportadas. As margens e a transparência dos originais também foram conferidas. A arte foi inspecionada visualmente. Isso é verificação dos arquivos de arte; a sincronização em combate depende da integração descrita acima.

A prévia contém os dados do manifesto e pode ser aberta localmente depois de extrair o ZIP, sem servidor. O JavaScript foi validado sintaticamente; não houve teste de reprodução em navegador nesta entrega.
