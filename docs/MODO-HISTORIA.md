# Modo História — A Turnê contra a Fome

Este documento é o desenho do Modo História. Hoje o modo é uma luta só
contra a Capeta Zanata. Aqui está o que ele vai ser, chefe por chefe, e a
ordem em que vamos construir.

## Premissa

Num Brasil de outra realidade, os políticos são vilões com poderes, assim
como os Salvadores Nacionais têm os seus. Os Salvadores querem acabar com a
fome com o rap: cada cidade da turnê recebe um evento que junta música e
comida para o povo.

Os políticos não aceitam. Um povo alimentado e unido pelo rap ameaça o poder
deles, que vive de oprimir. Em cada cidade, um deles aparece para impedir o
evento, e os Salvadores precisam derrubá-lo para o show acontecer.

O chefe por trás de todos é o **Djabo**. A Capeta Zanata, primeira chefe,
trabalha para ele.

## Estrutura de um capítulo

Cada capítulo é um evento numa cidade.

1. **Chegada.** Página de HQ: o evento sendo montado e o político local
   ameaçando parar tudo.
2. **Batalhas de rima.** Duas lutas contra outros Salvadores. É a batalha
   que decide quem sobe no palco: duelo amistoso, cheio de provocação, sem
   inimizade. Antes de cada uma, dois quadros de diálogo com os retratos HQ.
3. **Chefe.** O político invade o evento. Tela de apresentação própria
   ("CHEFE — NOME, CIDADE") e a luta.
4. **Fechamento.** O evento acontece. Um contador de **pratos servidos** sobe
   com o desempenho do jogador (vida restante, maior combo, Defesas Perfeitas).
   É a pontuação da campanha.

Entre capítulos, o **mapa do Brasil** mostra as cidades vencidas, a atual e
as trancadas.

### Regras

- A vida não passa de uma luta para a outra, com uma exceção: o Pai do Fujão
  (ver abaixo).
- A dificuldade sobe a cada luta, a partir da escolhida no menu.
- Ao perder: "Continuar?" recomeça a luta, sem limite. O número de continues
  aparece no fechamento.
- Progresso salvo por herói. Terminar a turnê com um herói libera o final
  dele numa galeria.

### Abertura e final

- **Abertura:** página de HQ que apresenta a turnê e o herói escolhido.
- **Final:** o Djabo cai e todos os Salvadores sobem no palco para o grande
  show nacional contra a fome. Depois, uma página curta própria de cada herói.

## Os chefes

Ordem da turnê, do mais simples ao chefe final. Cada luta ensina uma coisa.

| # | Chefe | Cidade | O que a luta ensina |
|---|---|---|---|
| 1 | Capeta Zanata | Belém — PA | Chegar perto de quem luta de longe |
| 2 | Chupetinha | a definir | Cuidar da Ginga e cortar a cura dele |
| 3 | Pavanassi | a definir | Jogar com golpes proibidos e o caminho bloqueado |
| 4 | Laranjão | a definir | Ler o que é verdadeiro e gastar recursos com cuidado |
| 5 | Fujão | a definir | Encurralar |
| 6 | Pai do Fujão | mesma cidade do Fujão | Lidar com dois alvos |
| 7 | Djabo | a definir | Tudo junto |

### 1. Capeta Zanata

Já está no jogo (`src/data/characters/zanata.js`), ainda com o boneco
provisório no lugar dos sprites.

- Chicote de longo alcance, Laço que puxa o herói, Salto Agulha contra pulos.
- **Fúria:** abaixo de 40% de vida, o chicote recupera mais rápido e a CPU
  fica mais agressiva.
- Supers: Tempestade de Chicote · Intimação.

### 2. Chupetinha

Tudo nele gira em torno da chupeta.

- **Arma:** chupeta gigante presa numa corrente, usada como mangual. Cospe
  chupetas como projétil.
- **Sugada:** a mordida da chupeta rouba 1 gomo de Ginga do herói e passa
  para ele.
- **ESTÃO ME CENSURANDO! (mecânica):** ao receber dano, ele entra no modo
  perseguição. Um celular num pau de selfie flutua ao lado dele com o aviso
  **AO VIVO**. Enquanto a live está ligada, todo ataque contra ele vira
  engajamento: 25% do dano recebido volta como vida.
- **Ninguém filmando:** o celular é um alvo separado. Acertá-lo derruba a
  live por alguns segundos e corta a cura. A luta é uma corrida para desligar
  a câmera antes de bater de verdade.
- **Detalhe:** o flash do Franco derruba a live com um golpe só.

### 3. Pavanassi

Vereador com jeito de ditador, que quer separar héteros e trans. Governa por
decreto e carimbo. O poder dele é **classificar e separar**, e é isso que os
Salvadores derrubam.

- **Carimbo de Decreto:** carimba o herói com uma "categoria". Por alguns
  segundos, um tipo de golpe fica **PROIBIDO** (especiais, pulo ou um botão).
- **Cerca de Separação:** grades que dividem o chão em faixas e limitam onde
  o herói pode pisar.
- **FISCALIZAÇÃO DE MIJO SUPREMA (especial):** invoca uma cabine de banheiro
  gigante no meio da arena e exige documentação de quem quiser passar. A
  cabine bloqueia o caminho. Encostar nela prende o herói na "fila da
  documentação" (fica parado até apertar botões para se soltar).
- **A pergunta (ponto fraco):** perto da cabine, o herói pode **questionar**
  (Ginga + Agarrão): "por que um vereador está gastando poderes fiscalizando
  privada?". O Pavanassi sofre **dano emocional**: perde vida, fica tonto e a
  cabine desaba.
- **Super "Lei Seca de Gente":** prende o herói numa cela-carimbo.
- **Derrota:** os decretos pegam fogo. No fechamento do evento, as cores da
  bandeira trans aparecem no palco e na plateia.

**Cuidado de roteiro:** o alvo da piada é sempre ele, o vereador ditador, e o
ridículo das obsessões dele. Pessoas trans aparecem como parte do povo que os
Salvadores defendem, nunca como piada.

### 4. Laranjão

- **Fake News — Escudo de Desinformação (especial):** cria várias versões
  contraditórias de si mesmo, cada uma com uma manchete diferente. Golpe que
  acerta uma cópia é gasto à toa. A verdadeira é a única com **sombra no
  chão**, a pista para quem presta atenção.
- **Tarifa Suprema — Roubo de Atributos (mecânica):** tarifa de 50% sobre as
  habilidades do herói. Cada gomo de Ginga e cada barra de Super que o herói
  gasta paga metade em tarifa, que vira **armadura dourada** para ele (aguenta
  golpes sem parar o próprio ataque).
- **THE WALL — Fortaleza Absoluta (super de 1 barra):** uma muralha dourada
  cai no meio do cenário e divide a tela. O herói fica preso do outro lado
  enquanto ele ataca por cima. Quebra depois de alguns golpes.
- **You're Fired! — Banimento Existencial (super de 3 barras):** aponta e
  diz a frase. Se acertar, o herói é **expulso da realidade**: some da tela
  com o carimbo **DEMITIDO** e, cerca de 2 segundos depois, cai de volta do
  céu tomando dano. Dá para escapar pulando ou com Defesa Perfeita.

### 5. Fujão

- **Fuga (mecânica):** atravessa a tela correndo e deixa armadilhas pelo
  caminho.
- **Encurralado:** só luta de verdade quando fica preso no canto. A luta é
  sobre fechar o espaço dele.

### 6. Pai do Fujão

Surge para vingar o filho, logo depois da vitória sobre o Fujão.

- **Entrada:** o Fujão cai, a tela treme e o Pai invade. Sem tela de vitória
  e sem vida cheia: o herói continua com a vida que sobrou, mais um pequeno
  bônus.
- **Foro Privilegiado (mecânica):** os 3 primeiros golpes de cada combo não
  fazem dano. Pede combos longos ou agarrão, que fura a imunidade.
- **Chama o Filho:** o Fujão entra como ajudante, dá uma rasteira e foge
  (como o Pinscher do Chapuh).
- **Vingança Paterna:** bater no Fujão durante a luta deixa o Pai furioso,
  mais rápido e mais forte por alguns segundos.
- **Super "Rachadinha":** divide a vida com o filho; por um tempo, metade do
  dano que ele recebe vai para o Fujão.

### 7. Djabo — chefe final

Luta em duas fases.

- **Fase 1, o Político:** de terno, usa o tridente como bengala e cetro (bom
  alcance). Usa um golpe roubado de cada chefe anterior: o Laço, a Sugada, o
  Carimbo, a Muralha e a Fuga.
- **Fase 2, o Demônio:** com a vida zerada, o terno queima e ele se
  transforma (chifres, asas) com a vida cheia de novo.
  - **Tridente de Fogo:** estocada longa e arremesso do tridente, que volta
    para a mão dele.
  - **Bola de Fogo** e **Coluna do Inferno:** fogo sobe do chão onde o herói
    está, com aviso antes.
  - **Voo curto:** mergulha de cima.
- **Super "Inferno Nacional":** o cenário inteiro pega fogo; só um trecho do
  chão fica seguro.

### Sátira

Os chefes são paródias: nomes, visuais e poderes exagerados. Não usar fotos,
falas reais nem símbolos oficiais de pessoas reais. O exagero é o que faz a
sátira funcionar.

## O que cada chefe precisa

| Item | Zanata | Demais |
|---|---|---|
| Ficha de golpes (`src/data/characters/`) | pronta | a fazer |
| Retrato HQ e ícone | a fazer | a fazer |
| Sprites (padrão de 6 quadros, células de 500 px) | a fazer | a fazer |
| Cenário da cidade | Belém pronto | a fazer |
| Diálogos e páginas de HQ | a fazer | a fazer |

## Implementação

- **`src/data/story.js`:** capítulos (cidade, cenário, rivais de rima,
  chefe), textos de diálogo, abertura e finais. O texto fica separado da
  lógica para ser revisado sem mexer no código.
- **Telas em `src/ui/app.js`:** `storyIntro → storyMap → storyTalk → vs →
  fight → storyNext / continuar → storyEnd`, reaproveitando os painéis de
  `src/ui/comic-screens.js`.
- **Mecânicas novas no combate** (ajudantes, alvos separados, golpes
  proibidos, muralha, clones, duas fases) entram em `src/core/` e são usadas
  pelas fichas dos chefes, como as mecânicas dos heróis.
- **Testes:** a CPU joga a escada inteira de ponta a ponta.

## Ordem de construção

1. **Capítulo 1 completo (Belém):** abertura, mapa, duas batalhas de rima,
   Zanata, fechamento com pratos servidos e "Continuar?". As outras seis
   cidades aparecem trancadas.
2. Retrato e sprites da Zanata (sem isso o capítulo não está pronto para
   mostrar).
3. Um capítulo por vez, na ordem da turnê: ficha e mecânica do chefe,
   retrato, sprites, cenário e textos.

## Em aberto

- Cidade de cada chefe, do 2 ao 7.
- Texto dos diálogos, da abertura e dos finais.
