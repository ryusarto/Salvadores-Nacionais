# Fujão — arte cartunesca v1

O chefe do aeroporto usa o perfil six-frame: 42 animações corporais por direção, 15 efeitos e objetos compartilhados, total de 99 atlas e 594 desenhos. O rosto aprovado aparece em traço cartunesco, terno carvão, camisa branca aberta, sapatos marrons e óculos aviador. A mala é a arma e participa das armadilhas, do carrinho, da fuga e dos supers.

- [Galeria de todas as animações e fontes](../production/qa/fujao-v1.html).
- [Contrato e fontes nativas](../production/sprites/source/fujao-v1/README.md).
- [Inventário com hashes de atlas, quadros e originais](../production/sprites/source/fujao-v1/runtime-manifest.json).

Cada animação usa duas pranchas originais de três poses. Esquerda e direita têm desenhos próprios. Os especiais sincronizam soltura de malas, quatro contatos do Pista Livre, cinco quedas do super e ciclos de fuga/carrinho. Embarque e encurralamento sobrepõem apenas a guarda parada. Efeitos seguem os eventos reais da simulação; hitboxes, dano e regras permanecem intactos.

Validação direcionada: mecânicas, timing, transparência, dimensões, hashes e quadros distintos. O workflow `Fujao art validation` executa a suíte completa, 56 confrontos da campanha e build padrão, guardando o HTML gerado como artefato para revisão/publicação. `npm run test:fujao` exercita 48 cenas nos dois sentidos e decodifica todos os 99 atlas, com capturas desktop/mobile e erros HTTP/JavaScript monitorados. A mesma verificação pode rodar no jogo publicado via `FUJAO_BASE_URL`.

A conferência automatizada e a inspeção visual das capturas complementam o playtest humano.
