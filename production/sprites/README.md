# Produção de sprites

Os sprites finais são desenhados por cima dos **guias de pose** que o jogo gera
do manequim. Cada guia é uma tira de quadros em células de 768×768 px, com o pé
sempre no mesmo ponto (a cruz na linha do chão).

## Gerar os guias

```bash
node tools/pose-guides.mjs franco            # todas as tiras
node tools/pose-guides.mjs franco parado golpe-5M   # só algumas
```

Saída: `production/sprites/guides/<personagem>/<tira>.png`.

## Teste de consistência (fazer antes de produzir tudo)

Gere só duas tiras do Franco: `parado.png` (4 quadros) e `golpe-5M.png` (6 quadros).
Se o rosto, o cabelo e a roupa ficarem iguais entre os quadros, o método serve.

## Pedido para o gerador de imagem

Envie junto: (1) a tira-guia e (2) a imagem de referência do personagem.

> Redesenhe esta tira de quadros de animação para um jogo de luta 2D.
> Mantenha exatamente o mesmo número de quadros, o mesmo tamanho de cada célula
> (768×768), a mesma pose do boneco em cada quadro e os pés no mesmo ponto.
> Substitua o boneco pelo personagem da imagem de referência: FRANCO, THE SIR! —
> cabelo cacheado volumoso, cavanhaque, brinco de argola, regata verde com
> faixas amarela e azul, colar de pérolas, tatuagens no braço, bermuda jeans
> escura larga, meias brancas e tênis preto e branco.
> Estilo: HQ com contorno preto de nanquim, três tons por cor (base, sombra,
> luz) e retícula de pontos nas sombras. Vista lateral, olhando para a direita.
> Fundo liso cinza, sem chão, sem sombra no chão, sem texto, sem efeitos de
> golpe (o jogo desenha os efeitos). O personagem deve ser idêntico em todos os
> quadros: mesmo rosto, mesmas cores, mesmas proporções.

## Entrega

Salve cada tira redesenhada com o mesmo nome em
`production/sprites/final/<personagem>/<tira>.png`, com o mesmo tamanho da guia.
O recorte do fundo e o alinhamento são feitos depois, por script.

## Situação

- Guias do Franco: gerados (35 tiras).
- Leitor de sprites no jogo: **ainda não existe**. Será escrito quando o teste
  de consistência passar; até lá o jogo usa o manequim.
