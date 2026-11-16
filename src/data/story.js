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
  { id: 'banheiros', n: 3, boss: 'pavanassi', bossName: 'PAVANASSI', place: 'BELÉM — BANHEIROS QUÍMICOS', ready: true },
  { id: 'aeroporto', n: 4, boss: 'fujao', bossName: 'FUJÃO', place: 'AEROPORTO', ready: true },
  { id: 'mansao', n: 5, boss: 'pai-fujao', bossName: 'PAI DO FUJÃO', place: 'MANSÃO', ready: true },
  { id: 'washington', n: 6, boss: 'laranjao', bossName: 'LARANJÃO', place: 'WASHINGTON, D.C.', ready: true },
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
  banheiros: {
  franco: ['trunks', 'mdep'],
  belga: ['chapuh', 'dney'],
  majis: ['franco', 'dney'],
  trunks: ['ryuchi', 'chapuh'],
  ryuchi: ['mdep', 'belga'],
  mdep: ['belga', 'franco'],
  chapuh: ['majis', 'belga'],
  dney: ['trunks', 'majis'],
  },
  aeroporto: {
  franco: ['ryuchi', 'belga'],
  belga: ['mdep', 'majis'],
  majis: ['trunks', 'ryuchi'],
  trunks: ['majis', 'dney'],
  ryuchi: ['dney', 'majis'],
  mdep: ['chapuh', 'trunks'],
  chapuh: ['ryuchi', 'franco'],
  dney: ['franco', 'chapuh'],
  },
  mansao: {
  franco: ['majis', 'trunks'],
  belga: ['dney', 'ryuchi'],
  majis: ['chapuh', 'mdep'],
  trunks: ['belga', 'chapuh'],
  ryuchi: ['franco', 'trunks'],
  mdep: ['dney', 'majis'],
  chapuh: ['belga', 'dney'],
  dney: ['mdep', 'franco'],
  },
  washington: {
  franco: ['dney', 'mdep'],
  belga: ['trunks', 'chapuh'],
  majis: ['belga', 'franco'],
  trunks: ['ryuchi', 'majis'],
  ryuchi: ['chapuh', 'dney'],
  mdep: ['franco', 'belga'],
  chapuh: ['mdep', 'majis'],
  dney: ['ryuchi', 'trunks'],
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
  banheiros: [
  'Belém, terceira noite. O evento virou a festa da cidade: tem gente de todo canto e de todo jeito comendo junto.',
  'Mas, perto dos banheiros químicos, aparecem placas novas, todas carimbadas: "POR DECRETO: CADA UM NO SEU LUGAR".',
  'Uma fila se forma. Um fiscal pede documento para quem quer usar o banheiro. Ninguém entende nada.',
  'Ninguém vai ser barrado no próprio evento. Mas antes, a roda de rima. {hero} chega no microfone.',
  ],
  aeroporto: [
  'A passagem dizia "FUJÃO — SÓ IDA". Os Salvadores correm para o aeroporto antes que o avião saia.',
  'No saguão, a segurança barra todo mundo. Sem cartão de embarque, ninguém passa para a pista.',
  'Então o rap abre caminho: uma roda de rima no meio do saguão junta passageiro, piloto e até o pessoal da limpeza.',
  'Lá fora, um avião particular já está com a escada encostada. {hero} entra na roda para chegar à pista.',
  ],
  mansao: [
  'O endereço dos papéis leva a uma mansão com portão de ouro, câmeras em todo canto e seguranças de terno preto.',
  'Lá dentro mora o Pai do Fujão. Em prisão domiciliar, de tornozeleira, ele nunca sai de casa. Nem precisa: manda em tudo pelo telefone.',
  'Na frente do portão, os Salvadores montam o som. A roda de rima chama a cidade inteira para a calçada.',
  'Quem vencer a roda entra primeiro. {hero} pega o microfone.',
  ],
  washington: [
  'Os Salvadores atravessam o continente. A turnê contra a fome chega a Washington, D.C.',
  'Na frente do palácio, as bandeiras estão rasgadas: o Laranjão taxou até o vento.',
  'Mas o rap atravessa fronteira sem passaporte. Gente do mundo inteiro aparece no gramado com panela, tambor e microfone.',
  'A roda de rima começa em três línguas. {hero} pega o microfone.',
  ],
};

/** Frase do narrador antes de cada batalha de rima, por capítulo. */
export const RHYME_INTRO = {
  'ver-o-peso': 'BATALHA DE RIMA — quem vencer sobe no palco.',
  palco: 'BATALHA DE RIMA — quem vencer abre o show na frente do palco.',
  banheiros: 'BATALHA DE RIMA — quem vencer arranca a primeira placa.',
  aeroporto: 'BATALHA DE RIMA — no saguão do aeroporto, quem vencer abre caminho até a pista.',
  mansao: 'BATALHA DE RIMA — na frente da mansão, quem vencer entra primeiro.',
  washington: 'BATALHA DE RIMA — no gramado do palácio, quem vencer encara o Laranjão.',
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
  pavanassi: [
    { who: null, say: 'Uma cabine gigante despenca no meio da feira. Na frente dela, de terno e carimbo na mão, o vereador Pavanassi.' },
    { who: 'pavanassi', say: 'Por decreto meu, cada um no banheiro que EU mandar. Aqui quem decide quem é quem sou eu.' },
    { who: '$hero', say: 'Aqui todo mundo come, todo mundo canta e todo mundo usa o banheiro. Ninguém fica de fora.' },
    { who: 'pavanassi', say: 'Desacato! Carimbem esse aí! Documento, por favor!' },
    { who: null, say: 'DICA: o carimbo proíbe golpes por alguns segundos. Cercas e cabine caem na porrada ou no pulo. Perto da cabine, GINGA + AGARRÃO faz A PERGUNTA.' },
  ],
  fujao: [
    { who: null, say: 'Na pista, de óculos escuros e mala na mão, o Fujão corre para a escada do avião.' },
    { who: 'fujao', say: 'Vocês de novo? Eu só tô indo passar uns tempos fora. Uns anos. Pra sempre, talvez.' },
    { who: '$hero', say: 'Você vai é ficar e explicar quem manda em tudo isso.' },
    { who: 'fujao', say: 'Explicar? Eu não explico nada. Eu FUJO.' },
    { who: null, say: 'DICA: longe do canto, ele foge no meio do combo. Encurrale perto da parede e não deixe ele sozinho perto da escada, ou ele embarca e recupera vida.' },
  ],
  'pai-fujao': [
    { who: null, say: 'Na sala, debaixo do lustre, o Pai do Fujão desliga o telefone. Na parede, o retrato do filho.' },
    { who: 'pai-fujao', say: 'Vocês invadiram a minha casa. Aqui eu tenho foro, tenho advogado e tenho capanga.' },
    { who: '$hero', say: 'E a gente tem o povo do lado de fora. Acabou o mando por telefone.' },
    { who: 'pai-fujao', say: 'Ninguém encosta em mim. Segurança! ALÔ? Manda todo mundo!' },
    { who: null, say: 'DICA: os 3 primeiros golpes de cada combo não fazem dano (Foro Privilegiado). Faça combos longos, agarre ou use o super. Empurre-o para fora da área da tornozeleira: ela dá choque.' },
  ],
  laranjao: [
    { who: null, say: 'As portas do palácio se abrem. De terno azul, gravata vermelha e topete dourado, sai o Laranjão.' },
    { who: 'laranjao', say: 'Comida de graça para o mundo inteiro? Isso é a pior ideia da história. Talvez a pior de todas.' },
    { who: '$hero', say: 'Acabou, Laranjão. A fome não paga tarifa.' },
    { who: 'laranjao', say: 'Tudo paga tarifa. Até você. E se reclamar: YOU’RE FIRED!' },
    { who: null, say: 'DICA: gastar Ginga e Super dá armadura para ele (Tarifa Suprema): use com cuidado. Nas Fake News, só o verdadeiro tem sombra. No You’re Fired!, pule ou defenda.' },
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
  pavanassi: [
    'A cabine desaba. Os decretos do Pavanassi pegam fogo e viram cinza no meio da feira.',
    'As placas são arrancadas uma por uma. No palco, as cores da bandeira trans sobem junto com o som, e a plateia inteira canta com {hero}.',
    'No chão, entre os papéis queimados, uma passagem de avião carimbada: "FUJÃO — SÓ IDA". Alguém quer fugir do país.',
    'A turnê continua. Próxima parada: o aeroporto.',
  ],
  fujao: [
    'O Fujão cai na pista, a mala abre e voam papéis por todo lado. O avião vai embora vazio.',
    'Os Salvadores acabam com ele ali mesmo. Fugir, ele não foge mais.',
    'Entre os papéis, ordens assinadas, carimbos e fotos do Chupetinha, da Zanata e do Pavanassi. Todas vindas do mesmo endereço: uma mansão.',
    'O dono da mansão está em prisão domiciliar. E continua mandando em tudo de dentro de casa. Próxima parada: a mansão do pai do Fujão.',
  ],
  'pai-fujao': [
    'A tornozeleira apita uma última vez. O Pai do Fujão desaba no sofá, sem foro, sem capanga e sem sinal no telefone.',
    'A cidade entra pelo portão aberto. A mansão vira cozinha comunitária, e o lustre ilumina o maior sarau que aquela sala já viu, com {hero} no centro.',
    'Encurralado, o velho entrega quem está acima de todos: "Eu só obedeço. As ordens vêm dos Estados Unidos. Do Laranjão."',
    'Para salvar o mundo, os Salvadores precisam atravessar o continente. Próxima parada: Washington, D.C.',
  ],
  laranjao: [
    'A muralha dourada cai tijolo por tijolo. As manchetes falsas se apagam uma por uma. O Laranjão fica sem armadura e sem plateia.',
    'No gramado, o povo do mundo inteiro come junto. {hero} rima em português, e todo mundo canta o refrão.',
    'Derrotado, o Laranjão aponta para o chão e ri: "Vocês acham que mandam aqui? Quem manda está lá embaixo."',
    'O chão do gramado racha. Sobe um cheiro de enxofre. Última parada da turnê: o inferno do Djabo.',
  ],
};
