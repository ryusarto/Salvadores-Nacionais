/**
 * Brincadeiras entre personagens. Franco e Chapuh são IRMÃOS, e o pinscher do
 * Chapuh, o ANTÔNIO, é o cachorro dos dois. Quando os irmãos lutam, aparecem
 * falas especiais. Só texto: a lógica fica em src/ui/banter.js.
 */
export const BROTHERS = ['franco', 'chapuh'];

/** Falas no começo de cada round (uma de cada irmão, em ordem). */
export const BROTHER_INTRO = [
  [{ who: 'franco', str: 'BRIGA DE IRMÃO É EM CASA, CHAPUH!' }, { who: 'chapuh', str: 'HOJE O ANTÔNIO TÁ DO MEU LADO!' }],
  [{ who: 'chapuh', str: 'QUEM PERDER LAVA A LOUÇA!' }, { who: 'franco', str: 'E LEVA O ANTÔNIO PRA PASSEAR!' }],
  [{ who: 'franco', str: 'VOU CONTAR PRA MÃE!' }, { who: 'chapuh', str: 'CONTA, DEDO-DURO!' }],
];

/** O Antônio morde o Franco. */
export const DOG_BITES_FRANCO = ['ANTÔNIO?! EU QUE TE DOU RAÇÃO!', 'TRAÍRA, ANTÔNIO!', 'ANTÔNIO, SOU EU, SEU DONO!'];

/** O Franco acerta o Antônio de volta… e se arrepende. */
export const FRANCO_HITS_DOG = 'FOI MAL, ANTÔNIO!';

/** Quem venceu a briga de irmão. */
export const BROTHER_WIN = {
  franco: 'MAIS VELHO É MAIS VELHO!',
  chapuh: 'O ANTÔNIO VEM COMIGO PRA CASA!',
};

/** O Chapuh chama o pinscher pelo nome (em qualquer luta, às vezes). */
export const DOG_CALLS = ['VAI, ANTÔNIO!', 'PEGA, ANTÔNIO!', 'ANTÔNIO, ATAQUE!'];
export const DOG_AWAY = 'CADÊ O ANTÔNIO?';

/** Batalha de rima entre os irmãos no Modo História: substitui as falas de sempre. */
export const BROTHER_RHYME = {
  franco: [
    { who: 'franco', say: 'Meu próprio irmão na roda? A mãe não te deu educação, não?' },
    { who: 'chapuh', say: 'Deu a mesma que a sua. E o Antônio prefere a minha rima.' },
  ],
  chapuh: [
    { who: 'chapuh', say: 'Ô Franco, essa roda é minha. Vai fotografar outra coisa.' },
    { who: 'franco', say: 'Quem te ensinou a rimar fui eu, moleque. E quem alimenta o Antônio também.' },
  ],
};
