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
  { id: 'palco', n: 2, boss: 'chupetinha', bossName: 'CHUPETINHA', place: 'BELÉM — FRENTE DO PALCO', ready: false },
  { id: 'banheiros', n: 3, boss: 'pavanassi', bossName: 'PAVANASSI', place: 'BELÉM — BANHEIROS QUÍMICOS', ready: false },
  { id: 'aeroporto', n: 4, boss: 'fujao', bossName: 'FUJÃO', place: 'AEROPORTO', ready: false },
  { id: 'mansao', n: 5, boss: 'pai-fujao', bossName: 'PAI DO FUJÃO', place: 'MANSÃO', ready: false },
  { id: 'washington', n: 6, boss: 'laranjao', bossName: 'LARANJÃO', place: 'WASHINGTON, D.C.', ready: false },
  { id: 'inferno', n: 7, boss: 'djabo', bossName: 'DJABO', place: 'INFERNO', ready: false },
];

/** As duas batalhas de rima de cada herói, na ordem. */
export const RIVALS = {
  franco: ['belga', 'chapuh'],
  belga: ['majis', 'trunks'],
  majis: ['ryuchi', 'belga'],
  trunks: ['dney', 'mdep'],
  ryuchi: ['majis', 'franco'],
  mdep: ['trunks', 'dney'],
  chapuh: ['franco', 'mdep'],
  dney: ['chapuh', 'ryuchi'],
};

/** Abertura da turnê. `hero` é trocado pelo nome do herói escolhido. */
export const OPENING = [
  'Num Brasil de outra realidade, os políticos são vilões com poderes. E usam esses poderes para oprimir o povo.',
  'Os Salvadores Nacionais têm poderes também. E um plano: acabar com a fome com o rap.',
  'Primeira parada da Turnê contra a Fome: Belém do Pará. Palco montado no Ver-o-Peso, comida para quem chegar.',
  'Mas só um sobe primeiro no palco. A batalha de rima decide. {hero} entra na roda.',
];

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
export function rhymeTalk(hero, rival) {
  return [
    { who: null, say: 'BATALHA DE RIMA — quem vencer sobe no palco.' },
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
};

/** Depois de vencer o chefe. `hero` é trocado pelo nome do herói. */
export const CLOSING = {
  zanata: [
    'A Capeta Zanata cai no meio da feira. O chicote se parte em dois.',
    'O primeiro evento da Turnê contra a Fome acontece. O Ver-o-Peso inteiro come e canta junto com {hero}.',
    'Mas, antes de sumir, a Zanata deixa um aviso: "O Chupetinha já está na frente do palco. E ele está AO VIVO."',
    'A turnê continua.',
  ],
};
