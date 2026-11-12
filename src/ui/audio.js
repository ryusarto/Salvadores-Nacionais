/** Sons provisórios gerados por síntese (sem arquivos de áudio). */
let AC = null;
let muted = false;

function ctx() {
  if (muted || typeof window === 'undefined') return null;
  try {
    AC ??= new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    return AC;
  } catch {
    return null;
  }
}

function tone(freq, dur, type = 'square', vol = 0.05, slide = 0.5) {
  const a = ctx();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

function noise(dur, vol = 0.08, hp = 800) {
  const a = ctx();
  if (!a) return;
  const n = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, n, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource();
  s.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = a.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination);
  s.start();
}

export const sfx = {
  menu: () => tone(520, 0.05, 'triangle', 0.03, 0.9),
  ok: () => tone(700, 0.09, 'triangle', 0.04, 1.4),
  toggleMute: () => { muted = !muted; return muted; },
};

/** Toca os sons dos eventos do quadro. */
export function audioEvents(events) {
  for (const e of events) {
    switch (e.t) {
      case 'hit': {
        const p = { L: 0.5, M: 0.75, H: 1, S: 1, X: 1.4 }[e.power] || 1;
        tone(170 / p, 0.1 + 0.05 * p, 'sawtooth', 0.06 * p, 0.4);
        noise(0.07 + 0.05 * p, 0.07 * p, 500);
        break;
      }
      case 'block': noise(0.05, 0.05, 2200); tone(300, 0.04, 'square', 0.02); break;
      case 'parry': tone(900, 0.12, 'triangle', 0.05, 1.5); break;
      case 'perfect': tone(1200, 0.3, 'triangle', 0.07, 1.8); break;
      case 'move': if (e.type !== 'normal') tone(e.type === 'super' ? 180 : 320, 0.12, 'triangle', 0.03, 1.6); else noise(0.04, 0.02, 3000); break;
      case 'super': tone(120, 0.6, 'sawtooth', 0.07, 4); break;
      case 'jump': tone(330, 0.06, 'triangle', 0.02, 1.5); break;
      case 'land': noise(0.05, e.hard ? 0.08 : 0.03, 200); break;
      case 'rush': tone(240, 0.2, 'sawtooth', 0.04, 2.5); break;
      case 'burnout': tone(200, 0.4, 'square', 0.05, 0.3); break;
      case 'ko': tone(90, 0.9, 'sawtooth', 0.09, 0.4); noise(0.4, 0.1, 100); break;
      case 'strike': noise(0.3, 0.12, 80); tone(70, 0.4, 'sawtooth', 0.09, 0.5); break;
      case 'fight': tone(440, 0.25, 'square', 0.05, 2); break;
      default: break;
    }
  }
}
