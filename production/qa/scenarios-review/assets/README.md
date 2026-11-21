# Auditoria dos sete cenários — assets

Resultado estático e visual: aprovado (`passed:true`), sem achados abertos neste escopo. Inventário final: Belém 46, palco 88, banheiros 70, aeroporto 41, mansão 30, Washington 33 e Inferno 22 (version 2). Total: 330 assets, 66 tiras e 396 quadros.

`assets-audit.json` registra integridade, dimensões, reusos, transparência, crops, pivôs e correspondência da UI. `source-inventory.json` contém SHA e dimensões dos 167 mestres PNG preservados, incluindo históricos. `hangings.json` registra 16 âncoras físicas em oito objetos dos cenários 1/2/3. `visual-review.json` separa aceite visual, achados e limites.

ART-BEL-01 foi corrigido: as duas fileiras flutuantes de Belém receberam quatro mastros pintados, suspensão explícita e parallax solidário. Cinco testes passaram; `belem-hangings-fixed.json` comprova geometria e alpha dos quatro nós nas seis poses e câmeras 0/340/680. Root inspecionou e aprovou a composição, que foi congelada antes da build geral. Antes: `belem-right-banner-anchor.png`. Depois: `belem-after.png`. Os 36 grupos e 20 mestres originais foram preservados; o reuso extra eleva apenas arquivos de 45 para 46.

`seven-scenes.png` reúne as miniaturas finais. `npc-dark-1.png` e `npc-dark-2.png` exibem 14 tiras únicas, com 84 quadros de NPCs sobre escuro, sem halo perceptível nas imagens examinadas.

Os scripts desta pasta somente leem produção e escrevem aqui. A correção autorizada de Belém é registrada separadamente nos dados, finalizador, importador, novo gerador e captura da prévia, manifesto, prop, UI, README e testes. Os demais seis packs não foram alterados nesta auditoria.

Notas sem falha de jogo demonstrada: o título SVG do palco referencia Bangers sem embuti-la (portabilidade da tipografia); o parapeito legado foi confirmado byte a byte contra Belém, embora ausente do inventário de origem.

Imagens e testes estáticos não certificam gameplay, desempenho em aparelho físico ou playtest humano. A revisão runtime independente da build geral possui seu próprio relatório.
