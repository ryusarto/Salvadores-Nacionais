# MDEP — integração em rascunho

Design aprovado: rosto da referência incluída, sem óculos; moletom vermelho;
lenço branco com estampa vermelha; correntes prateadas; cargo preta larga;
botas pretas grandes com solado tratorado.

## O que está nesta alteração

- Referências ilustradas aprovadas, sem publicar as fotografias pessoais de origem.
- Tiras candidatas com dez células de 768×768, alpha e pés em (384,700).
- Manifesto de todas as 49 animações/efeitos necessários e suas pendências.
- Adaptador visual para preparação, contato e recuperação em dez quadros.
- Leitura de efeitos separados para pisada, chutes, impacto, defesa, poeira,
  Embalo, clarão e traço luminoso.

As tiras desta pasta passaram pelas verificações técnicas de exportação; isso
não significa aprovação final de anatomia, semelhança, escala corporal e fluidez.
Não há redimensionamento independente de cada pose. A exportação usa fator
comum de 0,86 e não amplia fontes pequenas para simular definição.

## Ainda não ativado no jogo

Esta pasta está fora de `production/sprites/final`, portanto não substitui a arte
atual no build. O perfil `ten-frame` também não foi ativado no personagem.
Isso evita misturar roupa antiga e nova em um conjunto incompleto.

O gerador recusou uma parte do SA1 com o código `moderation_blocked`, categoria
`violence`. A parte restante do SA1 e o SA3 novo continuam pendentes. Outros
quadros/efeitos tiveram contato com bordas ou falhas de separação; consulte
`manifest.json`. Esses recortes não foram incluídos como tiras aprovadas.

## Para concluir

1. Resolver a arte dos supers e os demais itens pendentes do manifesto.
2. Revisar visualmente as dez poses de cada movimento e as transições dos ciclos.
3. Conferir dimensões anatômicas e referência de escala nas poses dobradas/aéreas.
4. Copiar somente os arquivos aprovados para a pasta final, retirar os aliases
   incompatíveis do MDEP e ativar o perfil visual.
5. Testar contato, recuperação, supers, efeitos e memória no navegador; refazer o
   build e executar a suíte de testes antes de publicar.

Nenhuma regra de dano, colisão, munição, Embalo, movimento ou cancelamento foi alterada.
