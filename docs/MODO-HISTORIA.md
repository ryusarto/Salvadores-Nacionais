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

### O arco da turnê

1. **Belém.** O evento é atacado três vezes: a Zanata no Ver-o-Peso, o
   Chupetinha na frente do palco e o Pavanassi nos banheiros químicos.
2. **Aeroporto.** O Fujão tenta escapar do país; os Salvadores o alcançam
   na pista, antes de o avião decolar, e acabam com ele.
3. **Mansão.** Descobrem que o Pai do Fujão, em prisão domiciliar, comandava
   tudo de dentro de casa. Derrotado, ele entrega o nome de quem está acima:
   para salvar o mundo, é preciso ir aos Estados Unidos.
4. **Washington, D.C.** O Laranjão, em frente ao palácio, entre bandeiras
   americanas rasgadas.
5. **Inferno.** O Djabo, a origem de tudo.

No final, a fome acaba no mundo inteiro.

## Estrutura de um capítulo

Cada capítulo é uma parada da turnê, com um chefe.

1. **Chegada.** Página de HQ: o evento sendo montado e o político local
   ameaçando parar tudo.
2. **Batalhas de rima.** Duas lutas contra outros Salvadores. É a batalha
   que decide quem sobe no palco: duelo amistoso, cheio de provocação, sem
   inimizade. Antes de cada uma, dois quadros de diálogo com os retratos HQ.
3. **Chefe.** O político invade o evento. Tela de apresentação própria
   ("CHEFE — NOME, CIDADE") e a luta.
4. **Fechamento.** Página de HQ: o evento acontece, ou a história avança
   para o próximo lugar.

Entre capítulos, o **mapa da turnê** mostra os lugares vencidos, o atual e
os trancados: Belém, o aeroporto, a mansão, Washington e, por último, o
inferno.

### Regras

- A vida não passa de uma luta para a outra.
- A dificuldade sobe a cada luta, a partir da escolhida no menu.
- Ao perder: "Continuar?" recomeça a luta, sem limite. O número de continues
  aparece no fechamento.
- Progresso salvo por herói. Terminar a turnê com um herói libera o final
  dele numa galeria.

### Abertura e final

- **Abertura:** página de HQ que apresenta a turnê e o herói escolhido.
- **Final:** o Djabo cai e todos os Salvadores sobem no palco para o grande
  show contra a fome. A sequência final mostra que **acabamos com a fome no
  mundo**: mesas cheias e gente comendo no Brasil e em outros países, até a
  manchete "A FOME ACABOU". Depois, uma página curta própria de cada herói.

## Os chefes

Ordem da turnê, do mais simples ao chefe final. Cada luta ensina uma coisa.

| # | Chefe | Cenário | O que a luta ensina |
|---|---|---|---|
| 1 | Capeta Zanata | Belém — Ver-o-Peso (pronto) | Chegar perto de quem luta de longe |
| 2 | Chupetinha | Belém — na frente do palco do evento | Cuidar da Ginga e cortar a cura dele |
| 3 | Pavanassi | Belém — área de banheiros químicos | Jogar com golpes proibidos e o caminho bloqueado |
| 4 | Fujão | Aeroporto — pista, com um avião atrás | Encurralar |
| 5 | Pai do Fujão | Mansão — sala de estar | Tirar o rival da zona de conforto |
| 6 | Laranjão | Washington, D.C. — em frente ao palácio | Ler o que é verdadeiro e gastar recursos com cuidado |
| 7 | Djabo | Inferno | Tudo junto |

### Cenários

- **Ver-o-Peso:** o cenário que já está no jogo.
- **Frente do palco:** o palco do evento montado no fundo, caixas de som,
  luzes e a plateia. Pode reaproveitar parte do Ver-o-Peso (céu, horizonte).
- **Banheiros químicos:** fila de cabines com as placas de proibição dos
  decretos do Pavanassi, incluindo a placa contra pessoas trans. As placas
  são do vilão: quando ele cai, elas são arrancadas e rasgadas no fechamento.
- **Aeroporto:** pista com o avião do Fujão atrás, escada encostada e
  motores ligados. Pode decolar no fundo se o jogador demorar.
- **Mansão:** a luta é **na sala**, e não na fachada. Combina com a prisão
  domiciliar (ele não pode sair de casa), muda o clima depois de quatro
  cenários abertos e dá objetos para quebrar: lustre, sofá, quadros. Uma
  janela grande no fundo mostra a fachada e o jardim.
- **Washington, D.C.:** o palácio branco ao fundo, gramado e bandeiras
  americanas rasgadas balançando.
- **Inferno:** chão de pedra rachada com lava, colunas de fogo, correntes,
  caveiras e um trono ao fundo.

### 1. Capeta Zanata

Já está no jogo (`src/data/characters/zanata.js`), ainda com o boneco
provisório no lugar dos sprites.

- Chicote de longo alcance, Laço que puxa o herói, Salto Agulha contra pulos.
- **Fúria:** abaixo de 40% de vida, o chicote recupera mais rápido e a CPU
  fica mais agressiva.
- Supers: Tempestade de Chicote · Intimação.

### 2. Chupetinha

No jogo desde o Capítulo 2 (`src/data/characters/chupetinha.js`), com
retrato provisório e boneco no lugar dos sprites.

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
  live por 6 segundos e corta a cura. O celular aguenta 3 golpes (barras de
  sinal); cada golpe e cada projétil conta uma vez. A luta é uma corrida para desligar
  a câmera antes de bater de verdade.
- **Detalhe:** o flash do Franco derruba a live com um golpe só.

### 3. Pavanassi

No jogo desde o Capítulo 3 (`src/data/characters/pavanassi.js`), com
retrato provisório e boneco no lugar dos sprites. Cercas e cabine são
barreiras genéricas do motor (`behavior: 'barrier'` em `src/core/entities.js`),
prontas para a muralha do Laranjão.

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

### 4. Fujão

No jogo desde o Capítulo 4 (`src/data/characters/fujao.js`), com retrato
provisório, boneco no lugar dos sprites e um cenário de aeroporto desenhado
em código (`src/render/airport-stage.js`) até o pintado ficar pronto. A fuga
usa o gancho `mech.escape` do motor.

- **Fuga (mecânica):** atravessa a tela correndo e deixa armadilhas pelo
  caminho.
- **Encurralado:** só luta de verdade quando fica preso no canto. A luta é
  sobre fechar o espaço dele.
- **Embarque:** na pista, ele corre para a escada do avião. Se chegar lá,
  recupera um pouco de vida e volta; encurralá-lo longe da escada é o jeito
  de vencer.
- **Derrota:** os Salvadores acabam com o Fujão antes de o avião decolar.


### 5. Pai do Fujão

Depois do Fujão, os Salvadores descobrem que o pai dele, em prisão
domiciliar, comandava tudo de dentro de casa. A luta é na sala da mansão.

- **Tornozeleira (mecânica):** a tornozeleira eletrônica marca no chão a
  área onde ele pode ficar. Empurrar o Pai para fora dessa área faz a
  tornozeleira apitar e dar choque: dano e tontura. A luta é sobre tirá-lo
  da zona de conforto.
- **Foro Privilegiado:** os 3 primeiros golpes de cada combo não fazem dano.
  Pede combos longos ou agarrão, que fura a imunidade.
- **Comando à Distância:** sem poder sair de casa, ele resolve tudo pelo
  telefone. Faz uma ligação e capangas entram pela porta, dão um golpe e
  saem (como o Pinscher do Chapuh).
- **Vingança Paterna:** abaixo de metade da vida, ele vê o retrato do filho
  na parede e fica furioso, mais rápido e mais forte.
- **Super "Rachadinha":** arremessa maços de dinheiro que prendem o herói;
  parte do dano que causa volta para ele como vida.
- **Derrota:** ele entrega quem está acima de tudo e manda os Salvadores
  para os Estados Unidos.

### 6. Laranjão

Os Salvadores descobrem que, para salvar o mundo, precisam ir aos Estados
Unidos.

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

### 7. Djabo — chefe final

Luta em duas fases.

- **Fase 1, o Político:** de terno, usa o tridente como bengala e cetro (bom
  alcance). Usa um golpe roubado de cada chefe anterior: o Laço, a Sugada, o
  Carimbo, a Fuga, a ligação dos capangas e a Muralha.
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
| Cenário | Ver-o-Peso pronto | a fazer (os dois de Belém podem reaproveitar partes do Ver-o-Peso) |
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

1. ✓ **Capítulo 1 (Belém, Ver-o-Peso):** abertura, mapa, duas batalhas de
   rima, Zanata, fechamento e "Continuar?".
2. ✓ **Capítulo 2 (Belém, frente do palco):** ficha e mecânica do
   Chupetinha, diálogos e fechamento. Vencer um capítulo abre o seguinte.
   Ainda usa o cenário do Ver-o-Peso, retrato provisório e boneco.
3. ✓ **Capítulo 3 (Belém, banheiros químicos):** Pavanassi com Carimbo de
   Decreto, Cerca de Separação, Fiscalização de Mijo Suprema e A PERGUNTA;
   fechamento com as cores da bandeira trans no palco.
4. ✓ **Capítulo 4 (aeroporto):** Fujão com Fuga, malas, embarque e o
   avião com a escada; o fechamento leva à mansão.
5. Retrato e sprites de Zanata, Chupetinha, Pavanassi e Fujão; cenários da
   frente do palco, dos banheiros químicos e do aeroporto pintado.
   Para chefes sem arte, `node tools/retrato-provisorio.mjs <id> <cor> <cor>`
   gera um retrato e um ícone provisórios.
6. Um capítulo por vez, na ordem da turnê: ficha e mecânica do chefe,
   retrato, sprites, cenário e textos.

## Em aberto

- Texto dos diálogos, da abertura e dos finais.
