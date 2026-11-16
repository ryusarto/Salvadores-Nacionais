import{SYS}from'../data/system.js';
import{COMIC as P,comicIcon,comicPanel,comicText}from'./comic-ui.js';
const W=SYS.VIEW_W,clamp=v=>Math.max(0,Math.min(1,v));
export function createHud(){return{lag:[1,1],lastFrame:null,combo:[{n:0,t:0,dmg:0},{n:0,t:0,dmg:0}]};}
export function hudValues(f){const meter=Math.max(0,Math.min(SYS.SUPER.max,f.super));return{hp:clamp(f.hp/f.maxHp),super:meter/SYS.SUPER.max,stocks:Math.floor(meter/SYS.SUPER.stock),ginga:Array.from({length:6},(_,k)=>clamp((f.ginga-k*SYS.GINGA.pip)/SYS.GINGA.pip))};}
export function updateHud(st,hud){
 if(hud.lastFrame===st.frame)return;hud.lastFrame=st.frame;
 for(let i=0;i<2;i++){const f=st.f[i],hp=hudValues(f).hp,combo=hud.combo[i],opponent=st.f[1-i];
  if(hp>=hud.lag[i])hud.lag[i]=hp;else if(f.comboHits<=0)hud.lag[i]+=(hp-hud.lag[i])*.055;
  if(opponent.comboHits>=2){combo.n=opponent.comboHits;combo.dmg=opponent.comboDmg;combo.t=65;}else if(combo.t>0)combo.t--;
 }
}
function star(c,x,y,r,fill){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;i?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=P.ink;c.lineWidth=2;c.stroke();}
function clippedBar(c,x,y,w,h,value,fill){c.save();c.beginPath();c.moveTo(x+8,y);c.lineTo(x+w,y);c.lineTo(x+w-8,y+h);c.lineTo(x,y+h);c.closePath();c.clip();c.fillStyle=fill;c.fillRect(x,y,w*clamp(value),h);c.restore();}
function portrait(c,id){
 comicPanel(c,30,27,122,122,P.paper,14,3);c.save();c.beginPath();c.moveTo(46,32);c.lineTo(147,32);c.lineTo(134,144);c.lineTo(34,144);c.closePath();c.clip();
 if(!comicIcon(c,id,30,27,122,122))comicText(c,id.slice(0,2).toUpperCase(),91,87,44,P.ink,'center');c.restore();
}
function geometry(c,st,hud,i,v){
 const f=st.f[i];c.save();if(i){c.translate(W,0);c.scale(-1,1);}
 comicPanel(c,22,23,848,126,P.ink,22,0);comicPanel(c,151,60,711,43,P.cyan,12,0);comicPanel(c,160,66,690,31,'#302b32',9,0);
 clippedBar(c,163,69,681,25,hud.lag[i],P.red);
 const gradient=c.createLinearGradient(163,0,844,0);gradient.addColorStop(0,v.hp<.25?'#ff944b':'#b6e446');gradient.addColorStop(1,v.hp<.25?P.red:'#f6e74d');
 clippedBar(c,163,69,681,25,v.hp,gradient);c.fillStyle='#fff8';c.fillRect(174,71,Math.max(0,663*v.hp-8),3);
 c.fillStyle=P.red;c.fillRect(162,105,78,3);
 for(let k=0;k<6;k++){comicPanel(c,260+k*66,112,58,12,'#39343b',3,0);clippedBar(c,260+k*66,112,58,12,v.ginga[k],f.burnout?'#8e8b91':P.cyan);}
 if(f.dizzyM>0||f.state==='dizzy')clippedBar(c,260,130,390,4,f.state==='dizzy'?1:f.dizzyM/SYS.DIZZY_METER.max,P.yellow);
 for(let k=0;k<SYS.ROUNDS_TO_WIN;k++)star(c,800-k*34,123,12,k<f.rounds?P.yellow:'#534953');
 comicPanel(c,24,981,735,66,P.ink,22,0);comicPanel(c,118,1000,601,29,'#39343b',10,0);
 const superGradient=c.createLinearGradient(118,0,719,0);superGradient.addColorStop(0,'#d7ee51');superGradient.addColorStop(1,v.stocks===3?P.yellow:'#7bd46b');
 clippedBar(c,118,1000,601,29,v.super,superGradient);
 for(let k=1;k<3;k++){c.fillStyle=P.ink;c.fillRect(118+k*601/3-2,1000,4,29);}
 c.fillStyle=P.red;c.fillRect(128,1034,575,4);
 if(v.stocks===3){c.globalAlpha=.55+.2*Math.sin((st.frame??0)*.12);c.strokeStyle=P.yellow;c.lineWidth=2;c.strokeRect(123,996,587,36);c.globalAlpha=1;}
 c.restore();
}
function side(c,st,hud,i){
 const f=st.f[i],v=hudValues(f),right=i===1,x=right?W-171:171,align=right?'right':'left';geometry(c,st,hud,i,v);
 c.save();if(right){c.translate(W,0);c.scale(-1,1);}portrait(c,f.ch.id);c.restore();
 comicText(c,f.ch.name,x,42,36,P.paper,align,652);
 comicText(c,f.burnout?'SEM FÔLEGO':'GINGA',x,120,18,f.burnout?P.muted:P.paper,align,84);
 const levelX=right?W-67:67;comicText(c,String(v.stocks),levelX,1008,78,v.stocks===3?P.yellow:P.paper,'center');comicText(c,'LEVEL',levelX,1052,17,P.paper,'center');
 if(v.stocks===3)comicText(c,'MAX!',right?W-745:745,1017,44,P.yellow,right?'left':'right');
 const m=f.ch.mech?.hud?.(f,st.f[1-i],st);if(m){const mx=right?W-150:150;
  comicPanel(c,right?W-710:118,943,592,38,P.ink,8,0);
  const label=m.ready&&m.readyText?`${m.label}: ${m.readyText}`:m.label;comicText(c,label,mx,962,23,m.ready?P.yellow:P.paper,align,330);
  for(let k=0;k<(m.pips||0);k++){const px=right?W-500-k*31:500+k*31;comicPanel(c,px,953,23,15,k<m.value?m.color||P.yellow:'#49404a',4,0);}
  if(m.text)comicText(c,m.text,right?W-480:480,962,22,P.paper,align,185);
 }
 const cb=hud.combo[i];if(cb.t>0&&cb.n>=2){c.save();c.globalAlpha=Math.min(1,cb.t/12);const cx=right?W-160:160;
  comicText(c,String(cb.n),cx,260,112,P.yellow,align);comicText(c,'ACERTOS!',right?cx-125:cx+125,273,40,P.paper,align);comicText(c,cb.dmg+' DE DANO',cx,332,28,P.paper,align);c.restore();}
}
export function drawHud(c,st,hud){
 updateHud(st,hud);side(c,st,hud,0);side(c,st,hud,1);
 c.beginPath();c.moveTo(915,22);c.lineTo(1006,22);c.lineTo(1033,73);c.lineTo(1007,136);c.lineTo(913,136);c.lineTo(887,73);c.closePath();c.fillStyle=P.red;c.fill();c.strokeStyle=P.ink;c.lineWidth=7;c.stroke();
 comicText(c,st.training?'∞':String(Math.max(0,Math.ceil(st.timer/SYS.FPS))),960,77,76,P.paper,'center');comicText(c,st.training?'TREINO':'ROUND '+st.round,960,153,23,P.paper,'center');
 if(st.phase==='intro'&&st.pf<SYS.INTRO_FRAMES-10){comicPanel(c,620,360,680,150,P.red,35,7);comicText(c,st.training?'TREINO':'ROUND '+st.round,960,440,113,P.paper,'center');}
}
