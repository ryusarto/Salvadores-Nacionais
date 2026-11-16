# Ryuchi v3

114 animações próprias nos dois sentidos: por vista, 19 estados, 30 golpes
e oito efeitos. A pasta raiz corresponde à direita; `esquerda/` à esquerda. Cada PNG em
`pranchas/` contém uma única animação com seis frames de 500×500px em grade3×2,
lida da esquerda para direita, linha superior e depois inferior. `tiras/`
conserva os mestres de 3000×500 usados para os WebP do jogo.

`originais/` preserva as fontes geradas em1536×1024, com células nativas512px.
A exportação usa apenas redução, uma escala uniforme por sequência calibrada
pela área facial da referência parada; não estica poses agachadas. O importador
separa os seis componentes da prancha e recupera pontas que passam pelos
espaços entre células sem trazer pixels do desenho vizinho. Rejeita cortes
na borda externa da fonte e do resultado. Ruído de exportação abaixo de5%
de alpha (até12/255) é normalizado para RGBA zero; as fontes são preservadas.
Os efeitos usam origem central estável, sem alinhamento artificial pelos pés.

O visual segue o Ryuchi existente, com jaqueta preta/creme de dragões dourados,
cargo escura, tênis e katana, mais o gorro justo solicitado. A referência de
arma corrigida usa a bainha no quadril direito (lado próximo da câmera na
vista canônica voltada à direita), saque canhoto e cortes com ambas as mãos
no cabo, sempre com os dois polegares na orientação superior da pegada.
A esquerda mostra o flanco oposto, mantendo a bainha no quadril direito, mais
oculta pelo corpo. Não deriva de um espelhamento horizontal. Após o saque a bainha permanece vazia. Durante rolamentos ela gira
com a pelve, presa ao cinto e mantida fora do contato com o chão.

`PLANO.json` registra prompts e calibração; instruções finais de continuidade
prevalecem sobre descrições antigas de geração dos estados reaproveitados.
`manifest.json` registra hashes SHA-256, dimensões, escala, bordas e limites
por frame. `node tools/import-ryuchi.mjs` reproduz a exportação e os recortes
em `src/data/ryuchi-art.js` após `npm ci` na raiz do projeto.

`node tools/import-ryuchi-left.mjs` exporta a vista esquerda.
`--effects-only` atualiza apenas FX preservando o manifesto das poses.
