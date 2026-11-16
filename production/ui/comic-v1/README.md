# Direção de arte, retratos e interface

Interface inspirada no cartaz e na marca fornecidos pelo usuário: papel
amarelo, vermelho, creme e tinta preta, faixas inclinadas, retícula e
tipografia de quadrinhos. O HUD adota leitura de vida e super inspirada em
jogos de luta como Marvel vs. Capcom 3, sem reutilizar suas imagens ou marca.

## Entregas

- Nove retratos exclusivos de **768×1024**, com alpha real: oito heróis
  e Capeta Zanata. Os ícones correspondentes têm **256×256**.
- Logo com fundo transparente e textura de papel. Os originais gerados
  ficam em `source/`; os arquivos do jogo são WebP com recorte preservado.
- Fonte Bangers, distribuída sob SIL OFL; licença em `fonts/OFL.txt`.
- Tela inicial com **os oito heróis**, seleção individual e versus local,
  apresentação da luta, pausa e resultado na mesma linguagem gráfica.
- Retratos da seleção com respiração e balanço leves, sem mudar a navegação;
  a preferência do sistema por movimento reduzido desativa esse movimento.
- HUD com retrato, nome, vida e dano recente separados, seis segmentos de
  Ginga, rounds, tontura, mecânica própria, combo e super com três níveis.

As fotos enviadas orientaram rosto e figurino dos retratos: M'Dep com lenço
e moletom vermelho, Dney com camiseta de estampa roxa, Franco com cachos,
Majis com cabelo punk e argolas, Trunks com dreads e moletom roxo, Belga com
boné e colete, Ryuchi com touca justa e sukajan. O retrato de Zanata usa
coroa de flores e blazer rosa conforme sua referência. As fotografias
originais fornecidas pelo usuário **não são incluídas no repositório**.

O retrato de Ryuchi foi refeito em vista frontal usando exclusivamente as
três referências fotográficas mais recentes, sem aproveitar a fisionomia das
versões ilustradas rejeitadas. Conforme o ajuste seguinte do usuário, a pele
foi levemente escurecida em direção ao tom de Franco, as bochechas ficaram
levemente mais finas e o lábio inferior foi discretamente reduzido. A revisão
mantém sobrancelhas sem corte, olhos naturais, bigode fino e touca justa com
estampa branca. O mesmo retrato gera o ícone e aparece nas telas do jogo.

O retrato de Chapuh foi refeito com as duas fotos de frente e de lado enviadas
depois: cachos pretos soltos e volumosos, olhos, formato do nariz, bigode fino,
pequeno tufo no queixo e brinco de cruz dourado. O cabelo fica visível, sem boné
no retrato; a jaqueta marrom com detalhes creme e amarelo mantém o figurino do
jogo. O mesmo desenho é usado nos menus e no ícone do HUD.

## Escala e finalização dos lutadores

A escala foi medida no corpo em pé, não no tamanho do arquivo. A referência
é aproximadamente **470 px da cabeça aos pés**, com os pés em Y=930.

| Personagem | Altura anterior aproximada | Altura ajustada | Escala de sprite |
|---|---:|---:|---:|
| Trunks | 571 px | 470 px | 0,7574 |
| Ryuchi | 567 px | 470 px | 0,7631 |
| Belga | 567 px | 470 px | 0,7631 |
| Demais heróis | 467–477 px | 467–477 px | preservada |

Uma única escala por personagem vale para todas as poses e direções; os
frames mantêm a proporção e o ponto dos pés. A vista esquerda própria de
Ryuchi permanece independente, com suas regras de espada e bainha.
Os tamanhos de hitboxes, dano, alcance, física e tempos não foram alterados.

O material comum de renderização aproxima curvas de contraste, planos de
sombra violeta, luz creme e contorno de tinta. Franco, Dney e M'Dep recebem
um ajuste mais presente; Chapuh e os kits já aprovados recebem um ajuste
leve. Esse tratamento é feito uma vez por tira carregada, fica no cache do
leitor e acompanha sua expulsão da memória. Os sprites originais não são
repintados ou substituídos por esse material. Não é uma regeneração de todas
as animações. FX independentes não recebem esse tratamento de pele/roupa.

O material usa WebGL quando disponível; em caso de ausência, tamanho de
textura incompatível ou falha, o jogo mantém a imagem original. Para comparar,
abra o jogo com `?material=off`. `window.__fighterMaterialStatus()` informa o
estado para QA. As coordenadas e os frames permanecem iguais nos dois modos.

## Conferência e reprodução

[Comparação do elenco e galeria](../../qa/elenco-hud.html) mostra todos os
lutadores na mesma linha do chão, nas duas orientações, e os nove retratos.
O HTML deve ser servido por HTTP a partir da raiz do projeto.

`node tools/import-comic-ui.mjs` reexporta os originais e atualiza dimensões,
hashes e manifesto. `npm run build` inclui os arquivos e a fonte, com hashes
nos URLs externos. O empacotador também conserva o modo de HTML embutido.

Testes de escala, apoio no chão, cobertura do elenco, recursos e relógio do
HUD estão em `tests/unit/comic-ui.test.js`. O dano recente fica retido durante
o combo e decai após ele; a animação do HUD avança por quadro de jogo, evitando
que telas de maior frequência acelerem esse comportamento.
Relatórios e capturas estão em `production/qa/comic-ui-*` e
`production/qa/evidence/comic-*.png`.
