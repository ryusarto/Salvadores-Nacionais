# Chupetinha — arte v3 e integração

Segundo chefe da História, em Belém/frente do palco. O pacote contém **41 animações de corpo × 6 quadros = 246 desenhos**, **11 FX × 6 quadros = 66 desenhos**, modelo e retrato. Cada ação corporal foi gerada em dois grupos de três poses para preservar detalhe e continuidade. Não há aliases, desenhos de estudo de doze quadros ou efeitos incorporados às folhas de corpo.

## Cobertura

| Uso | Tiras |
| --- | --- |
| Locomoção e repouso | parado, andar, andar-tras, correr, agachar, pulo, recuo |
| Recuperações | escape-agarrao, recuperacao-rolamento, caido, levantar |
| Defesa e dano | defesa-em-pe, defesa-agachado, defesa-no-ar, dano-alto, dano-baixo, dano-no-ar, tonto |
| Vitória | vitoria |
| Normais e ações comuns | golpe-5L, 5M, 5H, 2L, 2M, 2H, 3H, 6M, jL, jM, jH, throw, blindado |
| Especiais e supers | golpe-5S, 6S, 2S, 4S, SA1, SA3 |
| Turbo | golpe-5S-turbo, golpe-6S-turbo, golpe-2S-turbo |
| Celular | celular-ativacao, celular-live (3 barras), celular-live-2, celular-live-1, celular-dano, celular-sem-sinal |
| Objetos e efeitos de combate | projetil-chupeta, impacto-chupeta, arco-mangual, sugada, engajamento |

Os projéteis de 5S, 5S turbo e SA1 compartilham o objeto animado, com as trajetórias individuais da simulação. O arco acompanha as janelas reais do mangual, rasteira, Birra e os seis acertos da SA3. Sugada recebe fluxo próprio e o impacto usa o evento de acerto. Os corações acompanham o aviso real de recuperação de vida.

Defesa, defesa perfeita, parry, armor, poeira de salto/pouso, arrancada, agarrão, burnout, aviso de super e K.O. preservam os efeitos comuns do jogo. Os textos e indicadores do HUD continuam dinâmicos. Esses elementos compartilhados não representam assets exclusivos faltantes do chefe.

## Contrato técnico

- Runtime: `production/sprites/final/chupetinha` e `chupetinha-fx`, WebP sem perda e alpha real.
- Células 500×500; corpo em tiras 3000×500, FX em tiras 3000×500.
- Apoio do corpo (250,456), compatível com o pivô 700/768 do renderizador. Escala física e compensação das tiras largas em `src/data/chupetinha-art.js`.
- Direita nativa; esquerda pelo espelhamento previsto neste kit. Projéteis e sucção respeitam a direção do lutador; o telefone mantém a tela legível.
- `chupetinha-timing.js` usa preparação, antecipação, contato, continuação, recuo e guarda. Contato é a terceira pose. O turbo de 5S libera na segunda e quarta poses; a SA1 alterna as duas poses de sopro. Nenhum tempo, dano ou hitbox foi alterado.
- O celular segue `phoneBox` e os recursos live/sinal. Ativação e dano duram 16 quadros de simulação. Três, duas e uma barras têm tiras próprias; o flash também dispara a queda para sem sinal. O estado visual é descartado quando o recurso reinicia entre rounds.

## Fontes e reconstrução

`production/sprites/source/chupetinha-v3` preserva os PNGs finais sem perda, modelo/retrato gerados, prompts, perfil e manifestos. Os 82 grupos corporais nativos, 11 imagens nativas de FX, duas correções pontuais, mestres e quadros individuais permanecem no kit completo de produção do Dropbox. Fotografias de referência e o ZIP completo não são incluídos no Git.

Para recriar os WebP e o manifesto de runtime a partir dos PNGs aprovados:

```sh
node tools/import-chupetinha.mjs
```

No kit completo de produção local, `node producao/reconstruir.mjs <pasta-absoluta-do-kit>` reconstrói PNGs, mestres e quadros a partir dos originais. O arquivo `producao/prompts.json` registra os prompts usados com a ferramenta integrada `image_gen`.

## Evidências e limites

O manifesto `runtime-manifest.json` registra dimensões, bytes, SHA-256 e integridade de cada quadro. `tests/unit/chupetinha-art.test.js` cobre inventário, alpha e cores dos WebP contra os PNGs, timing normal/turbo, seis acertos e cinco disparos dos supers, transições do celular e chamadas reais do renderizador. Os testes de mecânica existentes continuam sendo a referência para cura, perda de sinal, flash e roubo de Ginga.

A galeria de arte está em `production/qa/chupetinha-v3.html`. A inspeção das imagens e as verificações automáticas não substituem playtest humano. Não foi realizada revisão interativa no navegador nesta entrega.
