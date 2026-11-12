/**
 * Controles de toque para celular deitado: direcional à esquerda e seis botões
 * flutuantes à direita. Escreve no mesmo objeto de dispositivos do teclado.
 */
const BUTTONS = [
  ['G', 'DEF', 'tb-g'], ['S', 'ESP', 'tb-s'], ['X', 'SUPER', 'tb-x'],
  ['L', 'LEVE', 'tb-l'], ['M', 'MÉDIO', 'tb-m'], ['H', 'FORTE', 'tb-h'],
];

export function createTouch(devices, root = document.body) {
  const wrap = document.createElement('div');
  wrap.id = 'touch';
  wrap.innerHTML = `
    <div id="dpad"><i class="a up">▲</i><i class="a down">▼</i><i class="a left">◀</i><i class="a right">▶</i><b id="knob"></b></div>
    <div id="btns">${BUTTONS.map(([k, label, cls]) => `<button class="tb ${cls}" data-k="${k}">${label}</button>`).join('')}</div>
    <button id="tpause" data-k="start">II</button>
    <div id="rotate">Vire o celular de lado para jogar</div>`;
  root.appendChild(wrap);
  devices.touch = {};
  const set = (k, v) => {
    if (v && !devices.touch[k]) devices.pressed[k] = true;
    devices.touch[k] = v;
  };
  const show = () => document.documentElement.classList.add('touch');

  for (const el of wrap.querySelectorAll('button')) {
    const k = el.dataset.k;
    const down = (e) => {
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch { /* ponteiro já solto */ }
      el.classList.add('on');
      set(k, true);
    };
    const up = (e) => {
      e.preventDefault();
      el.classList.remove('on');
      set(k, false);
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  const pad = wrap.querySelector('#dpad');
  const knob = wrap.querySelector('#knob');
  const dirs = (e) => {
    const r = pad.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const dead = 0.22;
    const len = Math.hypot(dx, dy);
    const on = len > dead;
    // 8 direções: cada eixo liga quando passa de ~38% da direção apontada
    const nx = on ? dx / len : 0;
    const ny = on ? dy / len : 0;
    set('left', nx < -0.38);
    set('right', nx > 0.38);
    set('up', ny < -0.38);
    set('down', ny > 0.38);
    const k = Math.min(1, len);
    knob.style.transform = `translate(${(on ? nx : dx) * k * 32}%, ${(on ? ny : dy) * k * 32}%)`;
  };
  const release = () => {
    for (const k of ['left', 'right', 'up', 'down']) set(k, false);
    knob.style.transform = '';
  };
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { pad.setPointerCapture(e.pointerId); } catch { /* ponteiro já solto */ }
    dirs(e);
  });
  pad.addEventListener('pointermove', (e) => {
    if (e.buttons || e.pointerType === 'touch') dirs(e);
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) pad.addEventListener(ev, release);

  window.addEventListener('touchstart', show, { once: true, passive: true });
  if (window.matchMedia?.('(pointer: coarse)').matches) show();
  return { show };
}
