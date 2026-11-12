# Salvadores Nacionais — resumo do jogo

**O que é:** jogo de luta 2D um contra um, em estilo HQ, numa turnê pelo Brasil.
Oito heróis enfrentam chefes caricatos, um por cidade. Primeira luta: Capeta
Zanata, em Belém (Ver-o-Peso).

**O que o jogador deve sentir:** controle imediato e golpes com peso. Cada herói
se joga de um jeito diferente.

## Sistema comum

- Simulação fixa a 60 quadros por segundo; cada golpe tem preparação, impacto e recuperação.
- Botões: Leve, Médio, Forte, Especial (direção muda o especial), Ginga, Agarrão, Super.
- **Defesa no botão de Ginga:** em pé, agachado e no ar (no ar gasta 1,5× de Ginga). Golpe baixo pede
  defesa agachada, golpe de cima pede defesa em pé. Defender nos 3 quadros antes do golpe é Defesa
  Perfeita. Segurar para trás também defende. Agarrão vence a defesa.
- **Golpes de sequência:** → ← + Leve e ↓ → + Médio, dois por herói.
- **Dificuldade:** Fácil, Normal e Difícil mudam o nível da CPU e o dano de cada lado.
- Combos: Leve → Médio → Forte → Especial → Super. O dano cai em combos longos
  (100, 100, 80, 70… até 10%) e há limite de golpes no ar.
- **Ginga (6 gomos):** defender gasta Ginga a cada golpe;
  Arrancada (1 gomo com →→ na defesa, 3 cancelando um golpe), Golpe Blindado (1), Especial
  Turbinado (2). Zerou: Sem Fôlego — toma dano na defesa e fica mais tempo travado.
- **Super (3 barras):** o botão de Super solta o mais forte que a barra permite (o grande com 3
  barras, o pequeno com 1 ou 2). ↓ + Super solta sempre o pequeno, para economizar.

## Heróis

| Herói | Como bate | Mecânica | Supers (↓+P, 1 barra · P com 3 barras) |
|---|---|---|---|
| Franco, The Sir! | Leve e Médio com as mãos; **Forte é o flash da câmera** (em pé, agachado e no ar) | **Compasso:** 2 especiais diferentes conectados liberam o FINAL (turbinado grátis, +25% de dano) | Libera Tudo! · **Obra-Prima:** pinta o rival com o pincel e o joga para dentro de uma tela |
| Belga | Soco-inglês | **BPM:** cada acerto sobe o ritmo (até 4): −1 quadro de recuperação e +3% de dano por nível | Disco Duplo (3 discos) · **Vinil Fatal:** pula para trás e arremessa 7 discos serrilhados |
| Majis | Guitarra | **Tremor:** especiais de guitarra acumulam tremor (lentidão); com 3, o rival fica atordoado | Feedback · **Terremoto:** toca a guitarra e o chão treme no cenário inteiro |
| Trunks | Chutes; **Forte é a mordida** com os super dentes | **Chamada:** marca o chão sob o rival; o ataque cai 2,5 s depois | Bombardeio · **Legião de Cães:** 8 cachorros atravessam a tela |
| Ryuchi | Espada samurai; **Leve três vezes = Três Cortes** | **Postura da Lâmina:** carrega o Fio em 3 níveis; corte instantâneo e contra-ataque | Agudo · **Agudo Supremo:** um agudo com a voz que estoura o rival e tudo em volta |
| M'Dep | Botas grandes; **Forte é a Pisada Bottega** | **Rajada:** Embalo emenda um especial em outro; pulo duplo e mergulho | Rajada Curta de AK · **Rajada de AK-47** |
| Chapuh | Lata de spray; **Médio é o jato de spray preto** de média distância; ↓+Especial joga a bola de tinta que deixa poça | **Tinta e Pinscher:** poças fazem escorregar; cachorro ajudante com tempo de volta | Grafite Total · **Ataque do Pinscher:** o cachorro vem correndo e ataca |
| Dney | Glock: atira de longe, coronhada de perto e de média distância | **Munição:** 6 balas que voltam sozinhas (1 a cada 2,5 s), recarga manual, a última é o Tiro Certeiro | Descarrega · **Olhar Laser:** laser que sai dos olhos |

**Chefe — Capeta Zanata:** chicote de longo alcance, Laço que puxa o herói e
**Fúria** abaixo de 40% de vida (chicote 5 quadros mais rápido, CPU mais agressiva).

## Fora desta build

Sprites finais, cenários pintados, música e vozes, os outros 6 chefes, dois
jogadores no mesmo teclado.

## Pendências conhecidas

- O equilíbrio entre personagens só foi medido com CPU contra CPU: Dney vence
  demais nessa medida. Precisa de teste com pessoas.
- A sensação no controle (tempo de resposta, peso dos golpes) ainda não foi
  avaliada por um jogador.
