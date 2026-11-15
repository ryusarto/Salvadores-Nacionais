# Belga v2 — uma animação por imagem

Formato final: seis frames de **500×500px** por animação, PNG RGBA com alpha
real. São 19 estados, 21 golpes e oito camadas de efeitos, totalizando 288
frames. O jogo usa as mesmas seis fases em WebP com alpha.

`originais/` conserva as fontes geradas com seis células nativas de 512px em
1536×1024. `pranchas/` contém uma única animação por PNG de 1500×1000 em grade
3×2, lida da esquerda para a direita, linha superior e depois inferior.
`tiras/` contém os mestres PNG de 3000×500 usados para codificar os WebP.

A identidade visual segue as fotos fornecidas pelo usuário: face mais cheia,
bigode fino, corpo compacto, boné, tatuagens, colete de trabalho bege aberto,
camiseta branca ampla e calça marrom estampada. As fotografias pessoais não
integram este repositório. O modelo gerado de referência é `originais/parado.png`.

`PLANO.json` registra as ações, prompts e a região facial usada para calibrar
a escala. Algumas ações incluem resumos documentados dos prompts, indicados
no próprio plano; todas as fontes geradas correspondentes foram preservadas.

Cada sequência recebe uma escala uniforme, compartilhada pelos seis frames,
com base na área visível do rosto do primeiro frame e na referência parada.
Isso evita ampliar artificialmente as poses dobradas. Nenhum desenho é
ampliado acima da resolução nativa. Os pés são alinhados à linha 456px;
o tamanho anatômico é preservado nas poses aéreas e de queda.

Reproduza os recortes e a codificação com `node tools/import-belga.mjs` na
raiz, após `npm ci`. O importador rejeita fundos opacos nos cantos, desenho
tocando bordas das células originais e cortes nos quadros exportados.
Ele gera também `src/data/belga-art.js`, com os recortes das camadas de FX.
`manifest.json` registra dimensões, escala, limites, SHA-256 e dados por frame.

As oito camadas são `vinil-girar`, `vinil-impacto`, `fx-jab`, `fx-direto`,
`fx-gancho`, `fx-bate-estaca`, `fx-pendulo` e `fx-bpm`. Vinis seguem as entidades
reais da simulação; socos e esquivas seguem suas janelas de contato/invulnerabilidade.
