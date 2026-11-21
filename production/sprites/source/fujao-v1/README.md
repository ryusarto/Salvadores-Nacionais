# Fujão — fontes da arte cartunesca v1

Arte aprovada pelo autor, produzida com a ferramenta integrada image_gen. Rosto de testa ampla, cabelo curto repartido, olhos pequenos, nariz arredondado e queixo curto; terno carvão, camisa branca aberta, sapatos marrons, óculos aviador e mala marrom. Contornos fortes, cores simplificadas e sombras chapadas.

198 pranchas PNG de três poses formam 99 animações de seis quadros (594 desenhos), mais o retrato. São 42 animações corporais por direção e 15 efeitos compartilhados. Esquerda e direita possuem desenhos próprios. Fotografias do usuário e revisões descartadas não são publicadas.

`runtime-manifest.json` relaciona hashes dos atlas, quadros e fontes. `body-export.json` e `effects-export.json` preservam os metadados de recorte e registro da produção; seus caminhos são relativos à pasta de trabalho original. No repositório, as fontes estão em `originais/` e os atlas em `../../final/`.

`art-direction.json` reúne a direção visual e a coreografia final consolidada. Não é uma transcrição dos prompts individuais. Os registros individuais de geração continuam preservados na pasta de produção do projeto.

Atlas lossless WebP 3000×500, células 500×500, alpha real; apoio corporal [250,456], altura em pé 400px. Escala do personagem no jogo 0.7631; os recortes dos FX são convertidos para as coordenadas canônicas de 768px do renderer. Danos, hitboxes e regras de combate ficam na simulação.

Prévia: [galeria animada](../../../qa/fujao-v1.html). Teste do jogo: `npm run test:fujao`; para testar Pages use `FUJAO_BASE_URL=https://ryusarto.github.io/Salvadores-Nacionais/ node tools/smoke-fujao.mjs` com `CHROMIUM_PATH` apontando para Chromium/Chrome.
