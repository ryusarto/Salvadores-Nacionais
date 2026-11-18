# Pai do Fujão — kit de sprites v1

Salvadores Nacionais. Arte em tinta de quadrinhos e cel shading, seguindo o Chupetinha. Produção pelo image_gen integrado do Codex, em imagens de três poses; cada ação reúne seis desenhos nativos distintos.

- 40 animações do personagem: 19 estados, 18 golpes, Peso da Família turbo e 2 reações de mecânica.
- 20 sequências separadas de efeitos visuais, objetos e capanga.
- 360 quadros individuais, 60 tiras de seis células, mestres e pranchas de revisão.
- Retrato, ícone, modelos do personagem, capanga, bengala, telefone e tornozeleira.

Abra [previa.html](previa.html) para escolher qualquer ação, pausar, avançar quadro a quadro e espelhar. Os PNGs individuais permitem revisar sem abrir uma tira grande.

## Formato

Corpo: tiras de 3000 × 500 px, seis células de 500 × 500 px. Apoio em (250,456). Mestres de 4608 × 768 px com apoio em (384,700). Fontes de maior resolução preservadas em originais/. Imagens de efeitos em fx/. Alpha RGBA preservado. Exportação apenas recorta e reduz; não inventa quadros por interpolação nem amplia o desenho nativo.

Tornozeleira preta com LED no tornozelo esquerdo do modelo, barra da calça levantada; bengala de madeira escura com cabo de latão na mão direita, telefone preto no bolso esquerdo e na mão esquerda durante a chamada. Figurino: blazer marrom, camisa clara, calça carvão e sapatos pretos. O capanga usa terno preto e óculos escuros.

## Arquivos

- previa.html — galeria com as 60 sequências.
- manifest.json — inventário, dimensões, originais e hashes por quadro.
- validacao.json — resultado das verificações estáticas dos PNGs e da galeria.
- perfil-runtime.json e INTEGRACAO.md — proposta de encaixe das animações nas regras existentes.
- quadros/, tiras/, mestres-768/, pranchas/ — personagem.
- fx/ — efeitos, objetos e capanga, com os mesmos formatos.
- ui/ — retrato e ícone exportados.
- producao/jobs.json e producao/fx-jobs.json — todos os prompts e fases de geração.
- correcoes/ — substituições pontuais para manter uma única tornozeleira visível.

## Estado da entrega

Kit de arte para revisão e integração. O código oficial do jogo não foi alterado nesta entrega. Não houve playtest destas novas animações; timing, sobreposição dos efeitos, hitboxes e enquadramento precisam ser conferidos no jogo durante a integração. A galeria é uma prévia de arte.

A descrição de prisão domiciliar e da reação à derrota do filho pertence à narrativa ficcional do personagem fornecida para o jogo.
