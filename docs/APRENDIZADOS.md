# O que aprendemos estudando um jogo de luta clássico

Estudamos a documentação pública do projeto `g-guthrie/mvc2-port-and-decomp`
(a descrição da estrutura do jogador, do formato dos dados de golpe, da
sequência de cálculo do dano e dos temporizadores). **Não copiamos código,
tabelas, números, sprites nem sons.** Trouxemos ideias de regras, que não são
protegidas, e escrevemos tudo do nosso jeito, com nossos próprios valores em
`src/data/system.js`.

## O que entrou no jogo

| Ideia observada | O que fizemos |
|---|---|
| O dano passa por uma tabela de "pouca vida": quem está quase caindo recebe menos dano | **Garra** (`GUTS`): abaixo de 30% de vida, 12% menos dano; abaixo de 15%, 24% menos |
| Existe um medidor de tontura que enche com golpes e zera depois de um tempo | **Tontura** (`DIZZY_METER`): apanhar muito em pouco tempo deixa tonto; depois vem um período de imunidade |
| Um jogador só defende uma vez por pulo; depois a guarda quebra | **Defesa no ar:** segura um golpe por pulo |
| Há um contador que impede agarrões repetidos no mesmo adversário | **Proteção contra agarrões seguidos** (`THROW_PROTECT`) |
| Golpes "de apertar repetido" contam os apertos durante o golpe | **Golpes de apertar repetido** (`flags.mash`): Pressão Nacional do Franco e Spray do Chapuh |
| Depois do lançador, o jogador entra num pulo alto com regras próprias de golpe aéreo | **Combo aéreo** (`SUPER_JUMP`): Gancho + ↑, depois Leve, Médio e Forte no ar |
| Quem defende pode afastar o atacante | **Empurrão na defesa** (`PUSHBLOCK`): Leve + Médio, 1 gomo de Ginga |
| Quem é derrubado pode se recuperar em vez de ficar deitado | **Rolamento** (`TECH_ROLL`): botão de golpe ao cair |

## O que já fazíamos igual (confirmação)

- Os temporizadores do lutador (imunidades, proteções) **não correm durante a
  pausa de impacto**.
- Botões apertados durante a pausa de impacto **ficam guardados** e valem
  quando ela termina.
- Imunidade a agarrão ao levantar.
- O dano de um golpe = base × escala pelo número do golpe no combo × fatores
  do defensor.
- A entrada é lida no mesmo quadro em que acontece, sem atraso extra.
- A CPU decide por tabelas de probabilidade que mudam com a dificuldade.

## Ideias anotadas para depois

- Golpes marcados como "não pode nocautear" e "não conta no combo".
- Tremor de tela ao aterrissar, mais forte para personagens pesados.
- Câmera que acompanha o adversário arremessado no golpe final.
- Reforços temporários de velocidade, dano e defesa.
- Corrida no ar para alguns personagens.

## Sobre o REA

O REA analisa programas sem código-fonte. Aqui a fonte de estudo já era um
repositório de código e documentação, então a leitura direta foi o caminho
certo; o próprio guia do REA diz para não usá-lo nesse caso.
