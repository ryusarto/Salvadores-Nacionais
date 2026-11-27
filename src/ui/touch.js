import { LESSONS } from './lessons.js';
const BUTTONS = [['G','DEF','tb-g'],['S','ESP','tb-s'],['X','SUPER','tb-x'],['L','LEVE','tb-l'],['M','MÉDIO','tb-m'],['H','FORTE','tb-h'],['T','AGARRAR','tb-t']];

export function createTouch(devices, root = document.body) {
  const wrap = document.createElement('div'); wrap.id = 'touch';
  wrap.innerHTML = `<div id="dpad" aria-label="Direcional"><i class="a up">▲</i><i class="a down">▼</i><i class="a left">◀</i><i class="a right">▶</i><b id="knob"></b></div>
    <div id="btns">${BUTTONS.map(([k,label,cls])=>`<button class="tb ${cls}" data-k="${k}">${label}</button>`).join('')}</div>
    <button id="question" class="tb" data-k="question">QUESTIONAR</button><button id="tpause" data-k="start" aria-label="Pausar">II</button>
    <div id="training-tools"><button data-k="boxes">Caixas</button><button data-k="dummy">Boneco</button><button data-k="level">CPU</button><button data-k="reset">Reiniciar</button></div>
    <div id="lesson-panel" role="status"><span></span><button data-k="skip">Pular etapa</button></div>
    <div id="rotate" role="status">Vire o celular de lado para jogar. A luta está pausada.</div>`;
  root.append(wrap); devices.touch = {};
  const active = new Map(); let padPointer = null, app = null;
  const set = (key, value) => { if (value && !devices.touch[key]) devices.pressed[key] = true; devices.touch[key] = value; };
  const keys = key => key === 'question' ? ['G','T'] : [key];
  const reset = () => { active.clear(); devices.touch = {}; padPointer = null; wrap.querySelectorAll('.on').forEach(el=>el.classList.remove('on')); wrap.querySelector('#knob').style.transform=''; };
  const orientation = () => {
    if (!app) return;
    const portrait = document.documentElement.classList.contains('touch') && innerHeight > innerWidth;
    reset();
    if (document.hidden) app.interrupt('hidden');
    else if (portrait && app.screen === 'fight') app.interrupt('portrait');
    else app.releaseInterruption();
  };
  const show = () => { document.documentElement.classList.add('touch'); orientation(); };
  for (const el of wrap.querySelectorAll('button')) {
    const key=el.dataset.k;
    el.addEventListener('pointerdown',e=>{
      e.preventDefault(); el.setPointerCapture(e.pointerId); active.set(e.pointerId,key); el.classList.add('on');
      for (const k of keys(key)) set(k,true);
    });
    const up=e=>{
      e.preventDefault(); active.delete(e.pointerId);
      for (const k of keys(key)) if (![...active.values()].some(other=>keys(other).includes(k))) set(k,false);
      if (![...active.values()].includes(key)) el.classList.remove('on');
    };
    for (const ev of ['pointerup','pointercancel','lostpointercapture']) el.addEventListener(ev,up);
  }
  const pad=wrap.querySelector('#dpad'),knob=wrap.querySelector('#knob');
  const dirs=e=>{
    const r=pad.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2),len=Math.hypot(dx,dy),on=len>.22,nx=on?dx/len:0,ny=on?dy/len:0;
    set('left',nx<-.38);set('right',nx>.38);set('up',ny<-.38);set('down',ny>.38);
    knob.style.transform=`translate(${nx*Math.min(1,len)*32}%, ${ny*Math.min(1,len)*32}%)`;
  };
  pad.addEventListener('pointerdown',e=>{if(padPointer!==null)return;e.preventDefault();padPointer=e.pointerId;pad.setPointerCapture(e.pointerId);dirs(e);});
  pad.addEventListener('pointermove',e=>{if(e.pointerId===padPointer)dirs(e);});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(ev,e=>{if(e.pointerId!==padPointer)return;padPointer=null;for(const k of ['left','right','up','down'])set(k,false);knob.style.transform='';});
  window.addEventListener('touchstart',show,{once:true,passive:true});
  window.addEventListener('resize',orientation);
  document.addEventListener('visibilitychange',orientation);
  window.addEventListener('blur',()=>{reset();app?.interrupt('blur');orientation();});
  if(window.matchMedia?.('(pointer: coarse)').matches)show();
  let wasLive=false, lastScreen='';
  return {show,bind(value){app=value;orientation();},sync(){
    if(!app)return;
    if(lastScreen!==app.screen){lastScreen=app.screen;orientation();}
    const live=app.screen==='fight'&&!app.paused&&!app.systemPaused;
    if(wasLive&&!live)reset();wasLive=live;
    wrap.dataset.live=String(live);
    document.documentElement.classList.toggle('left-handed',app.preferences.leftHanded);
    document.documentElement.classList.toggle('large-buttons',app.preferences.largeButtons);
    wrap.querySelector('#training-tools').hidden=!(live&&app.mode==='training');
    const question=live&&app.st?.ents.some(e=>e.kind==='cabine');wrap.querySelector('#question').hidden=!question;
    const panel=wrap.querySelector('#lesson-panel'),lesson=app.lesson;panel.hidden=!(live&&app.mode==='tutorial');
    panel.querySelector('span').textContent=LESSONS[lesson?.index]?.text||`Prática concluída: ${lesson?.passed.length||0} etapas cumpridas, ${lesson?.skipped.length||0} puladas.`;
    panel.querySelector('button').hidden=!!lesson?.complete;
  },reset};
}
