# Integração dos cenários 04 e 05

Aeroporto/Fujão e mansão/Pai do Fujão são entregues juntos sobre a main `a5ba2613d2bcf66ebed5cdc40ac22e701d973c55`, que já incorpora o PR #25. O merge preserva o carregamento sob demanda, worker de sprites, recuperação de falhas, paletas e a preparação das camadas do cenário.

Os pisos pintados de asfalto e mármore usam `ground.projection: "flat"`. O helper de desenho é compartilhado pela prévia editável e pela luta preparada; o piso é uma imagem única registrada no mundo. Cenários anteriores conservam projeção e cache. A sombra é aplicada uma única vez e o primeiro plano continua acima do piso. Nenhuma regra de combate foi alterada.

A build conserva integralmente o índice oficial de 26 pacotes e 722 strips da main; não publica o índice parcial do checkout esparso. Os 41 assets do aeroporto e 30 da mansão tiveram tamanho e SHA256 verificados. A arte corporal dos dois chefes continua sendo a representação já existente na main; o incremento entrega seus cenários.

## Verificação desta integração

- 154 testes locais de regras/renderers/carregamento aprovados, incluindo a regressão do renderer preparado para os dois pisos; 32 combos aprovados e 56 partidas de campanha concluídas.
- Chrome percorreu título → Versus → Belga → Fujão e Pai do Fujão. Ambas as arenas chegaram a `prepared: true`, com 32 e 21 imagens carregadas, respectivamente, e seis buffers de áudio cada.
- Pausa congelou o core. Câmeras 0/340/680 e viewport emulado de 844×390 foram exercitados sem erros de JavaScript ou HTTP.
- A revisão artística e de mecânicas anterior de cada entrega continua registrada em `production/qa/aeroporto-review/` e `production/qa/mansao-review/`, com suas bases e limites históricos.

Build/índice e hashes: `production/qa/cenarios-04-05-integration.json`. Smoke e capturas atuais: `production/qa/cenarios-04-05-integration/`. Os sprites oficiais ausentes no checkout esparso foram servidos do commit imutável da main e validados pelo prefixo SHA da URL; os cenários e código integrados foram locais. Não houve medição em aparelho físico nem playtest humano. CI do PR executa a suíte completa e a build em checkout completo.
