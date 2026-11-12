/**
 * Regras globais do combate. Todos os tempos em QUADROS (60 por segundo) e
 * distâncias em pixels de um mundo 1920x1080. Ajuste aqui, nunca no código.
 */
export const SYS = {
  FPS: 60,
  VIEW_W: 1920,
  VIEW_H: 1080,
  STAGE_W: 2600,
  GROUND_Y: 930, // y de tela onde ficam os pés
  WALL_PAD: 110, // distância mínima do centro do lutador até a parede
  MAX_DIST: 1500, // separação máxima entre lutadores (câmera)
  START_GAP: 520,

  HP: 10000,
  ROUNDS_TO_WIN: 2,
  ROUND_SECONDS: 99,
  INTRO_FRAMES: 110,
  KO_FRAMES: 150,

  GRAVITY: 1.9,
  JUMP: { pre: 4, vy: 36, vxF: 9.5, vxB: -8.5, land: 3, landAttack: 5 },
  DASH: { frames: 17, speed: 17, runSpeed: 12.5, runStop: 7, tapWindow: 12 },
  BACKDASH: { frames: 21, speed: 13, throwInv: 9 },

  BODY: {
    stand: { x: -70, y: 0, w: 140, h: 480 },
    crouch: { x: -75, y: 0, w: 150, h: 300 },
    air: { x: -70, y: 70, w: 140, h: 380 },
    down: { x: -160, y: 0, w: 320, h: 90 },
    push: 150, // largura da caixa de empurrão
  },

  MOTION: { first: 30, last: 12 }, // janelas (quadros) das sequências → ← e ↓ →
  CMD_BTN: { c1: 'L', c2: 'M' }, // botão que fecha cada sequência
  BUFFER: 7, // quadros que um botão apertado cedo continua valendo
  SIMUL: 3, // janela para dois botões contarem como "juntos"

  HITSTOP: { L: 8, M: 10, H: 13, S: 12, X: 18, block: -2, proj: 7 },
  PUSH_DECAY: 0.8,

  // Escala de dano por número do golpe no combo (1º, 2º, 3º...)
  SCALING: [1, 1, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1],
  SUPER_MIN_SCALE: 0.5,
  COUNTER: { dmg: 1.2, stun: 2, punishStun: 4 },
  JUGGLE_MAX: 6,
  CHIP: 0.25,

  KNOCKDOWN: { soft: 28, hard: 52, wakeup: 14, wakeThrowInv: 7 },
  CRUMPLE: 62,
  DIZZY: 110,

  THROW: { tech: 9, hold: 14, dmg: 1200, range: 150 },

  GINGA: {
    max: 6000,
    pip: 1000,
    regen: 10, // por quadro
    regenPause: 50, // quadros sem recarga depois de gastar
    blockPause: 30,
    airGuard: 1.5, // defender no ar gasta mais Ginga
    perfectWindow: 3,
    perfectFreeze: 16,
    rushRaw: 1000,
    rushCancel: 3000,
    blindado: 1000,
    turbo: 2000,
    onHitGain: 120,
    burnoutRegen: 8.5, // recarga quando Sem Fôlego (~12s)
    burnoutBlockstun: 4,
  },
  RUSH: { frames: 22, speed: 21, bonusStun: 4, bonusFrames: 30 },

  // Dificuldade: nível da CPU e multiplicador de dano [jogador, CPU]
  DIFFICULTY: [
    { name: 'FÁCIL', level: 0, dmg: [1, 1] },
    { name: 'NORMAL', level: 1, dmg: [1.15, 0.6] },
    { name: 'DIFÍCIL', level: 2, dmg: [1.3, 0.38] },
  ],

  SUPER: { max: 3000, stock: 1000, perDmgDealt: 0.07, perDmgTaken: 0.04, whiffSpecial: 20 },
};
