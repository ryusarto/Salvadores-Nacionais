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
  { id: 'inferno', n: 7, boss: 'djabo', bossName: 'DJABO', place: 'INFERNO', ready: true },
];

/** Páginas de chegada de cada capítulo. {hero} é trocado pelo nome do herói escolhido. */
export const OPENING = {
  'ver-o-peso': [
  'Num Brasil de outra realidade, os políticos são vilões com poderes. E usam esses poderes para oprimir o povo.',
  'Os Salvadores Nacionais têm poderes também. E um plano: acabar com a fome com o rap.',
  'Primeira parada da Turnê contra a Fome: Belém do Pará. Palco montado no Ver-o-Peso, comida para quem chegar.',
  'Os aliados cuidam do palco e das panelas. {hero} protege o primeiro evento quando a Capeta Zanata invade o Ver-o-Peso.',
  ],
  palco: [
  'Belém, segunda noite. A Zanata caiu, e o evento cresceu: agora o palco está montado de frente para o rio.',
  'As panelas não param. A fila da comida dobra a esquina. O som está no talo.',
  'Na frente do palco, um celular num pau de selfie já está filmando tudo. Alguém quer transformar o evento em conteúdo.',
  'Os aliados mantêm a comida e o som funcionando. {hero} segue para enfrentar o Chupetinha na frente do palco.',
  ],
  banheiros: [
  'Belém, terceira noite. O evento virou a festa da cidade: tem gente de todo canto e de todo jeito comendo junto.',
  'Mas, perto dos banheiros químicos, aparecem placas novas, todas carimbadas: "POR DECRETO: CADA UM NO SEU LUGAR".',
  'Uma fila se forma. Um fiscal pede documento para quem quer usar o banheiro. Ninguém entende nada.',
  'Ninguém vai ser barrado no próprio evento. {hero} vai direto até a cabine enquanto os aliados acolhem a população.',
  ],
  aeroporto: [
  'A passagem dizia "FUJÃO — SÓ IDA". Os Salvadores correm para o aeroporto antes que o avião saia.',
  'No saguão, os aliados reúnem passageiros, pilotos e o pessoal da limpeza. O som mobiliza a população para abrir passagem.',
  'Enquanto o grupo mantém o caminho aberto no saguão, {hero} avança para impedir a fuga.',
  'Lá fora, um avião particular já está com a escada encostada. {hero} segue direto para a pista.',
  ],
  mansao: [
  'O endereço dos papéis leva a uma mansão com portão de ouro, câmeras em todo canto e seguranças de terno preto.',
  'Lá dentro mora o Pai do Fujão. Em prisão domiciliar, de tornozeleira, ele nunca sai de casa. Nem precisa: manda em tudo pelo telefone.',
  'Na frente do portão, os Salvadores montam o som. A roda de rima chama a cidade inteira para a calçada.',
  'Os aliados organizam a comunidade diante do portão. {hero} entra na mansão para interromper as ordens do Pai do Fujão.',
  ],
  washington: [
  'Os Salvadores atravessam o continente. A turnê contra a fome chega a Washington, D.C.',
  'Na frente do palácio, as bandeiras estão rasgadas: o Laranjão taxou até o vento.',
  'Mas o rap atravessa fronteira sem passaporte. Gente do mundo inteiro aparece no gramado com panela, tambor e microfone.',
  'Os aliados recebem a população e organizam as mesas no gramado. {hero} avança para enfrentar o Laranjão.',
  ],
  inferno: [
  'O gramado se abre e os Salvadores descem. Lá embaixo, fogo, correntes e um trono vazio.',
  'Todos os chefes vieram daqui: a Zanata, o Chupetinha, o Pavanassi, o Fujão, o pai dele e o Laranjão. Todos obedeciam ao mesmo dono.',
  'No portão do inferno, as almas presas pela fome batem o pé no ritmo. O último refrão da turnê começa.',
  'Todos sustentam o refrão e abrem caminho até o trono. {hero} vai enfrentar o Djabo.',
  ],
};

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
  djabo: [
    { who: null, say: 'No trono, de terno preto e tridente na mão, o Djabo sorri. Ele parece um político como outro qualquer.' },
    { who: 'djabo', say: 'A fome é o meu melhor negócio. Povo com fome não canta, não pensa e não reclama.' },
    { who: '$hero', say: 'Hoje o povo canta. E come. A turnê acaba aqui, com você fora do trono.' },
    { who: 'djabo', say: 'Vocês derrubaram meus funcionários. Eu não sou funcionário. Venham.' },
    { who: null, say: 'DICA: ele usa um golpe de cada chefe. Zerar a vida dele não basta: prepare-se para a segunda forma. No Inferno Nacional, corra para o trecho do chão sem fogo ou pule as chamas.' },
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
    'Os Salvadores entregam o Fujão à segurança do aeroporto. A fuga terminou; agora ele vai responder pelo que fez.',
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
  djabo: [
    'O Djabo cai do trono. O fogo do inferno se apaga, as correntes se partem e as almas presas pela fome sobem para a luz.',
    'Lá em cima, todos os Salvadores Nacionais sobem no mesmo palco para o maior show contra a fome da história.',
    'Em Belém, em Washington, em cada cidade do Brasil e do mundo, as mesas ficam cheias. Ninguém fica de fora.',
    'A FOME ACABOU. Em nenhum canto do mundo alguém vai dormir com fome esta noite. Nem amanhã.',
    '{ending}',
    'SALVADORES NACIONAIS — fim da Turnê contra a Fome. Obrigado por jogar!',
  ],
};

/** Página final de cada herói (página {ending} do fechamento do Djabo). */
export const HERO_ENDINGS = {
  franco: 'Franco fotografa a primeira mesa cheia do mundo inteiro. A foto vira quadro, e o quadro vai para a parede de todas as cozinhas comunitárias.',
  belga: 'Belga solta o último disco da turnê. O BPM nunca mais baixa: em cada esquina tem um som e um prato de comida.',
  majis: 'Majis toca o acorde final. O chão treme, mas desta vez é de festa: a guitarra vira sino de almoço.',
  trunks: 'Trunks e a matilha distribuem marmitas de ambulância em ambulância. Nenhum cachorro, nenhuma pessoa, com fome.',
  ryuchi: 'Ryuchi guarda a espada. O agudo final ecoa do inferno até o céu, e o mundo inteiro responde no refrão.',
  mdep: "M'Dep pendura as botas por um dia. Na passarela, em vez de grife, desfila a fila de quem já comeu.",
  chapuh: 'Chapuh picha o último muro da turnê: "A FOME ACABOU". O Pinscher assina com a pata.',
  dney: 'Dney descarrega a última bala para o alto. Em vez de tiro, sai confete. O olhar laser acende a fogueira do churrasco do povo.',
};
