/**
 * MODO HISTÓRIA — A Turnê contra a Fome.
 * Só dados e texto: a lógica fica em src/ui/story.js e as telas em
 * src/ui/story-screens.js. Desenho completo em docs/MODO-HISTORIA.md.
 *
 * Para revisar o texto, mude só as frases abaixo. Cada fala é
 * { who: id do personagem, say: 'texto' }; who: null é o narrador.
 */

/** Paradas da turnê, na ordem. `ready: false` aparece trancada no mapa. */
export const CHAPTERS = [
  { id: 'ver-o-peso', n: 1, boss: 'zanata', bossName: 'CAPETA ZANATA', place: 'BELÉM — VER-O-PESO', ready: true },
  { id: 'palco', n: 2, boss: 'chupetinha', bossName: 'CHUPETINHA', place: 'BELÉM — FRENTE DO PALCO', ready: true },
  { id: 'banheiros', n: 3, boss: 'pavanassi', bossName: 'PAVANASSI', place: 'BELÉM — BANHEIROS QUÍMICOS', ready: false },
  { id: 'aeroporto', n: 4, boss: 'fujao', bossName: 'FUJÃO', place: 'AEROPORTO', ready: false },
  { id: 'mansao', n: 5, boss: 'pai-fujao', bossName: 'PAI DO FUJÃO', place: 'MANSÃO', ready: false },
  { id: 'washington', n: 6, boss: 'laranjao', bossName: 'LARANJÃO', place: 'WASHINGTON, D.C.', ready: false },
  { id: 'inferno', n: 7, boss: 'djabo', bossName: 'DJABO', place: 'INFERNO', ready: false },
];

/** As duas batalhas de rima de cada herói em cada capítulo, na ordem. */
export const RIVALS = {
  'ver-o-peso': {
  franco: ['belga', 'chapuh'],
  belga: ['majis', 'trunks'],
  majis: ['ryuchi', 'belga'],
  trunks: ['dney', 'mdep'],
  ryuchi: ['majis', 'franco'],
  mdep: ['trunks', 'dney'],
  chapuh: ['franco', 'mdep'],
  dney: ['chapuh', 'ryuchi'],
  },
  palco: {
  franco: ['majis', 'dney'],
  belga: ['ryuchi', 'franco'],
  majis: ['mdep', 'chapuh'],
  trunks: ['franco', 'belga'],
  ryuchi: ['trunks', 'chapuh'],
  mdep: ['majis', 'ryuchi'],
  chapuh: ['dney', 'trunks'],
  dney: ['belga', 'mdep'],
  },
};

/** Páginas de chegada de cada capítulo. {hero} é trocado pelo nome do herói escolhido. */
export const OPENING = {
  'ver-o-peso': [
  'Num Brasil de outra realidade, os políticos são vilões com poderes. E usam esses poderes para oprimir o povo.',
  'Os Salvadores Nacionais têm poderes também. E um plano: acabar com a fome com o rap.',
  'Primeira parada da Turnê contra a Fome: Belém do Pará. Palco montado no Ver-o-Peso, comida para quem chegar.',
  'Mas só um sobe primeiro no palco. A batalha de rima decide. {hero} entra na roda.',
  ],
  palco: [
  'Belém, segunda noite. A Zanata caiu, e o evento cresceu: agora o palco está montado de frente para o rio.',
  'As panelas não param. A fila da comida dobra a esquina. O som está no talo.',
  'Na frente do palco, um celular num pau de selfie já está filmando tudo. Alguém quer transformar o evento em conteúdo.',
  'Antes do show, mais uma roda de rima. {hero} pega o microfone.',
  ],
};

/** Frase do narrador antes de cada batalha de rima, por capítulo. */
export const RHYME_INTRO = {
  'ver-o-peso': 'BATALHA DE RIMA — quem vencer sobe no palco.',
  palco: 'BATALHA DE RIMA — quem vencer abre o show na frente do palco.',
};

/** Frase de cada herói quando entra numa batalha de rima. */
const HERO_LINE = {
  franco: 'Sorri pra foto, que depois dessa rima você vira quadro.',
  belga: 'Sobe o BPM. Quem não acompanha o ritmo, sai da roda.',
  majis: 'Afinei a guitarra pra isso. Vai tremer o Ver-o-Peso.',
  trunks: 'Tô com fome de vitória. E eu mordo.',
  ryuchi: 'Um verso, um corte. Silêncio, por favor.',
  mdep: 'Bota de grife, rima de rua. Pisa no chão comigo.',
  chapuh: 'Já pichei teu nome no muro. Riscado.',
  dney: 'Seis balas de rima no pente. Conta comigo.',
};

/** Resposta de cada um quando é o rival da batalha de rima. */
const RIVAL_LINE = {
  franco: 'Bonita pose. Pena que vai sair tremida.',
  belga: 'Rima boa, mas o disco é meu. Vira o lado.',
  majis: 'Fala alto, que a distorção tá ligada.',
  trunks: 'Late mais alto. Meus cachorros não ouviram.',
  ryuchi: 'Palavras demais. Minha lâmina responde.',
  mdep: 'Essa rima não passa nem no meu Embalo.',
  chapuh: 'Meu Pinscher rima melhor que você.',
  dney: 'Tiro certeiro, rima certeira. Bora.',
};

/** Diálogo antes de cada batalha de rima. */
export function rhymeTalk(hero, rival, chapterId = 'ver-o-peso') {
  return [
    { who: null, say: RHYME_INTRO[chapterId] || RHYME_INTRO['ver-o-peso'] },
    { who: hero, say: HERO_LINE[hero] },
    { who: rival, say: RIVAL_LINE[rival] },
  ];
}

/** A Zanata invade o evento. */
export const BOSS_TALK = {
  zanata: [
    { who: null, say: 'O palco acende. O povo chega. As panelas fumegam. E aí o céu do Ver-o-Peso escurece.' },
    { who: 'zanata', say: 'Evento sem alvará, comida de graça, povo feliz? Isso aqui está INTIMADO.' },
    { who: '$hero', say: 'Aqui ninguém passa fome hoje. Nem que eu tenha que te tirar do palco no braço.' },
    { who: 'zanata', say: 'O Djabo mandou lembrança. Vem.' },
  ],
  chupetinha: [
    { who: null, say: 'O show começa. Aí a música corta. Na frente do palco, o Chupetinha, de chupeta na boca e celular no alto.' },
    { who: 'chupetinha', say: 'Fala, galera da live! Olha só: estão distribuindo comida SEM a minha autorização.' },
    { who: '$hero', say: 'É comida pro povo, rapaz. Desliga isso e sai do palco.' },
    { who: 'chupetinha', say: 'Me bateu? ESTÃO ME CENSURANDO! Isso dá engajamento, sabia?' },
    { who: null, say: 'DICA: acerte o celular sobre a cabeça dele (pulando ou com o Gancho) para derrubar a live e cortar a cura.' },
  ],
};

/** Depois de vencer o chefe. `hero` é trocado pelo nome do herói. */
export const CLOSING = {
  zanata: [
    'A Capeta Zanata cai no meio da feira. O chicote se parte em dois.',
    'O primeiro evento da Turnê contra a Fome acontece. O Ver-o-Peso inteiro come e canta junto com {hero}.',
    'Mas, antes de sumir, a Zanata deixa um aviso: "O Chupetinha já está na frente do palco. E ele está AO VIVO."',
    'A turnê continua.',
  ],
  chupetinha: [
    'O celular estoura no chão. A live cai. Sem plateia virtual, o Chupetinha chora de verdade, agarrado na chupeta.',
    'O show recomeça. O Ver-o-Peso inteiro come, dança e canta o refrão junto com {hero}.',
    'Mas, nos banheiros químicos do evento, aparecem placas novas, carimbadas e assinadas: "POR DECRETO, VEREADOR PAVANASSI".',
    'A turnê continua.',
  ],
};
