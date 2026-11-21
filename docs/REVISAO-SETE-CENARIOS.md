# Revisão dos sete cenários

Revisão local aprovada para o escopo documentado em [summary.json](../production/qa/scenarios-review/summary.json). A integração incorpora a main `ce1ae12`, preservando menus e os kits atuais do Fujão, Pai do Fujão e Laranjão. Washington e Inferno incluem suas entregas modulares completas; o coro do Inferno usa esqueletos e o fogo ambiental ampliado.

| Cenário | Assets | Resultado local |
| --- | ---: | --- |
| Belém — Ver-o-Peso | 46 | Aprovado após corrigir os apoios das bandeirolas |
| Belém — Palco | 88 | Aprovado |
| Banheiros químicos | 70 | Aprovado |
| Aeroporto | 41 | Aprovado |
| Mansão | 30 | Aprovado |
| Washington | 33 | Aprovado com os novos sprites/FX do Laranjão |
| Inferno | 22 | Aprovado com esqueletos e fogo ampliado |

Foram conferidos 330 assets e 396 quadros ambientais. Os primeiros três mapas têm 16 pontos de fixação verificados; os quatro apoios de Belém foram acrescentados nesta revisão. NPCs foram inspecionados sobre fundo escuro, sem halo perceptível nas poses avaliadas.

A campanha simulada completou as 56 combinações de herói/capítulo. A revisão de navegador cobriu os sete mapas, câmeras, pausa/reinício/continue, progressão, finais e salvamento, com os resultados de luta explicitamente injetados para testar navegação. Depois da atualização do Laranjão, foram repetidas sete visitas e uma revisão focada de cópias/sombra, armadura, muralha 6/3/1 e banimento/retorno. A muralha nativa atual tem precedência; o bitmap do cenário permanece como fallback.

O gate de release confere o índice completo nos dois sentidos contra a árvore Git: 33 pacotes e 945 tiras, sem omissões ou referências extras. A correção de índice do PR #35 foi preservada; o gate adicional rejeita também uma release histórica incompleta. A build integrada conferida tem SHA256 `77a601215ea8b150f20f51155726658bcef8c2a009c2d7c42009ae3201a59420`.

A [revisão original da integração](../production/qa/scenarios-review/runtime/final-review.json) e a [revisão após a arte nova do Laranjão](../production/qa/scenarios-review/current/final-review.json) distinguem testes novos e evidência reaproveitada por hash. As fontes/atlases de personagens ausentes no checkout parcial não foram tratados como aprovação da suíte completa: os workflows de checkout completo do GitHub devem passar antes do merge. Consulte os checks do PR para o resultado final do CI.

Este aceite cobre automação e inspeção visual das capturas. Não é playtest humano, teste em telefone físico ou certificação de desempenho. O PR #37 de desempenho permanece separado.
