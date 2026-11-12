/**
 * Combos de cada personagem (lista de combos da pausa e desafios do Treino).
 * Etapas: teclas da ficha do personagem; 'sj' = pulo alto depois do Gancho.
 * `tests/unit/combos.test.js` executa todos: cada combo daqui funciona no jogo.
 */
export const COMBOS = {
  franco: [
    { name: 'Básico do Sir', steps: ['2L', '5M', '5H', '6S'], tip: 'Leve agachado, Médio, Flash e Giro do Guetto.' },
    { name: 'Pressão Nacional', steps: ['2L', '5M', '2S'], tip: 'Na Pressão Nacional, aperte Especial várias vezes para mais acertos.' },
    { name: 'Exposição Aérea', steps: ['2H', 'sj', 'jL', 'jM', 'jH'], tip: 'O Gancho lança; segure ↑ para o pulo alto.' },
    { name: 'Obra-Prima', steps: ['5M', '5H', 'SA3'], tip: 'Com 3 barras, o Flash cancela no super.' },
  ],
  belga: [
    { name: 'Um-Dois-Três', steps: ['5L', '5L', '5M', '6S'], tip: 'Dois jabs, Médio e Direto de Esquerda.' },
    { name: 'Ritmo de Baile', steps: ['2M', '5H', 'c1'], tip: 'O Um-Dois sai com → ← + Leve.' },
    { name: 'Disco no Ar', steps: ['2H', 'sj', 'jL', 'jM', 'jH'], tip: 'Combo aéreo depois do Gancho.' },
    { name: 'Lado B', steps: ['5M', '5H', 'SA1'], tip: '↓ + Super solta o Disco Duplo.' },
  ],
  majis: [
    { name: 'Riff Pesado', steps: ['5L', '5M', '5H', '6S'], tip: 'Termina no Power Chord.' },
    { name: 'Tremor', steps: ['2M', '5H', '6S'], tip: 'Cada especial de guitarra acumula tremor.' },
    { name: 'Solo Aéreo', steps: ['2H', 'sj', 'jL', 'jM', 'jH'], tip: 'Combo aéreo depois do Gancho.' },
    { name: 'Terremoto', steps: ['5M', '5H', 'SA3'], tip: 'Com 3 barras, o chão treme no cenário inteiro.' },
  ],
  trunks: [
    { name: 'Chute e Mordida', steps: ['5L', '5M', '5H', '6S'], tip: 'A Mordida emenda na Ombrada.' },
    { name: 'Dentada', steps: ['2L', '5M', 'c2'], tip: 'A Dentada sai com ↓ → + Médio.' },
    { name: 'Mordida Aérea', steps: ['2H', 'sj', 'jL', 'jM', 'jH'], tip: 'Combo aéreo depois do Gancho.' },
    { name: 'Legião', steps: ['5M', '5H', 'SA3'], tip: 'Com 3 barras, chame a Legião de Cães.' },
  ],
  ryuchi: [
    { name: 'Três Cortes', steps: ['5L', '5LL', '5LLL'], tip: 'Aperte Leve três vezes.' },
    { name: 'Estocada', steps: ['2M', '5H', 'c2'], tip: 'A Estocada sai com ↓ → + Médio.' },
    { name: 'Lâmina no Ar', steps: ['2H', 'sj', 'jL', 'jM', 'jH'], tip: 'Combo aéreo depois do Gancho.' },
    { name: 'Agudo Supremo', steps: ['5M', '5H', 'SA3'], tip: 'Com 3 barras, o agudo estoura tudo em volta.' },
  ],
  mdep: [
    { name: 'Bota na Cara', steps: ['5L', '5M', '5H', '6S'], tip: 'Chute, Pisada Bottega e Rajada.' },
    { name: 'Embalo', steps: ['5L', '5M', '5S', '6S'], tip: 'Golpes que acertam dão Embalo: um especial emenda em outro.' },
    { name: 'Pisão Aéreo', steps: ['2H', 'sj', 'jL', 'jM', 'jH'], tip: 'Combo aéreo depois do Gancho.' },
    { name: 'Rajada de AK-47', steps: ['5M', '5H', 'SA3'], tip: 'Com 3 barras, puxa a AK.' },
  ],
  chapuh: [
    { name: 'Pixo Completo', steps: ['5L', '5M', '5S'], tip: 'O Jato de Spray emenda no Spray; aperte Especial várias vezes.' },
    { name: 'Pinscher', steps: ['2M', '5H', '6S'], tip: 'O cachorro termina o combo.' },
    { name: 'Grafite no Ar', steps: ['2H', 'sj', 'jL', 'jM', 'jH'], tip: 'Combo aéreo depois do Gancho.' },
    { name: 'Ataque do Pinscher', steps: ['5M', '5H', 'SA3'], tip: 'Com 3 barras, o pinscher vem correndo.' },
  ],
  dney: [
    { name: 'Coronhadas', steps: ['5L', '5M', '5H', '5S'], tip: 'Coronhada, Coronhada Forte e Tiro.' },
    { name: 'Coronhada Giratória', steps: ['2L', '2L', 'c1'], tip: '→ ← + Leve; se acertar, recarrega uma bala.' },
    { name: 'Tiro no Ar', steps: ['2H', 'sj', 'jL', 'jM', 'jH'], tip: 'Combo aéreo depois do Gancho.' },
    { name: 'Olhar Laser', steps: ['5M', '5H', 'SA3'], tip: 'Com 3 barras, o laser sai dos olhos.' },
  ],
  zanata: [],
};
