import{HEROES}from'../data/characters/index.js';import{SYS}from'../data/system.js';
import{COMIC as P,comicBackground,comicLogo,comicPortrait,comicIcon,comicPanel,comicText,comicMenuItem}from'../render/comic-ui.js';
import{drawBelemPresentation}from'../render/belem-stage.js';
const W=1920,H=1080;
export const TITLE_CAST=[['ryuchi',1100,150,330,440],['mdep',1390,165,330,440],['majis',1665,130,330,440],['franco',900,420,360,480],['chapuh',1240,410,360,480],['dney',1580,410,360,480],['belga',1080,660,390,520],['trunks',1500,650,420,560]];
let artFrame=0;
const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const natural={franco:-1,belga:-1,majis:-1,dney:-1,ryuchi:1,trunks:1,mdep:1,chapuh:1,zanata:1};
function portrait(c,ch,x,y,w,h,facing=1){
 const t=reducedMotion()?0:artFrame/60,phase=(HEROES.findIndex(h=>h.id===ch.id)+1)*.7;
 const breath=reducedMotion()?0:Math.sin(t*1.55+phase);
 c.save();c.translate(x+w/2,y+h);c.rotate(breath*.0025);c.scale(1+breath*.0015,1+breath*.003);c.translate(-w/2,-h);
 const result=comicPortrait(c,ch.id,0,0,w,h,(natural[ch.id]??1)!==facing);c.restore();return result;
}
function footer(c,message){c.fillStyle=P.ink;c.fillRect(0,1018,W,62);comicText(c,message,W/2,1049,25,P.paper,'center',1770);}
function heading(c,title,sub){comicPanel(c,55,40,1050,100,P.red,22,5);comicText(c,title,100,92,66,P.paper,'left',960);if(sub)comicText(c,sub,1840,90,28,P.paper,'right',640);}
function lines(c,str,x,y,width,size,color=P.paper){c.font=`${size}px SNComic, sans-serif`;let line='',n=0;for(const word of str.split(' ')){if(c.measureText(line+word).width>width&&line){comicText(c,line.trim(),x,y+n*size*1.25,size,color);n++;line='';}line+=word+' ';}if(line)comicText(c,line.trim(),x,y+n*size*1.25,size,color);}
function card(c,ch,x,y,w,h,selected=false,tag=''){
 comicPanel(c,x+5,y+7,w,h,P.ink,10,0);comicPanel(c,x,y,w,h,selected?P.red:P.paper,10,4);
 c.save();c.beginPath();c.rect(x+6,y+6,w-12,h-46);c.clip();const drift=selected&&!reducedMotion()?Math.sin(artFrame/38)*1.3:0;comicIcon(c,ch.id,x+5,y-2+drift,w-10,h-32);c.restore();
 comicPanel(c,x,y+h-42,w,42,selected?P.red:P.ink,6,0);comicText(c,ch.name.split(',')[0],x+w/2,y+h-20,28,P.paper,'center',w-24);
 if(selected){c.strokeStyle=P.yellow;c.lineWidth=5;c.strokeRect(x-4,y-4,w+8,h+8);}if(tag)comicText(c,tag,x+18,y+24,28,P.yellow);
}
function title(c,a,menu){
 comicBackground(c,a.frame);comicLogo(c,65,44,1040);
 comicText(c,'DA RUA PARA A ARENA.',100,406,30,P.ink);
 c.save();c.beginPath();c.rect(900,160,1020,855);c.clip();
 for(const[id,x,y,w,h]of TITLE_CAST){const ch=HEROES.find(h=>h.id===id);portrait(c,ch,x,y,w,h,id==='majis'?-1:1);}
 c.restore();comicPanel(c,1640,40,240,58,P.paper,10,4);comicText(c,'BELÉM • PARÁ',1760,70,28,P.ink,'center');
 menu.forEach(([id,name],i)=>comicMenuItem(c,id==='diff'?`${name}: ${SYS.DIFFICULTY[a.diff].name}`:name,100,454+i*82,725,a.cur===i,i));
 footer(c,'WASD / SETAS PARA ESCOLHER    •    ENTER CONFIRMA    •    CONTROLE OU TECLADO');
}
function select(c,a,menu){
 comicBackground(c,a.frame);heading(c,'ESCOLHA SEU SALVADOR',menu.find(m=>m[0]===a.mode)?.[1]??'');
 const ch=HEROES[a.hero];portrait(c,ch,30,160,670,894,1);
 comicPanel(c,62,874,685,90,P.red,20,5);comicText(c,ch.name,95,919,62,P.paper,'left',610);
 for(const[h,i]of HEROES.map((h,i)=>[h,i]))card(c,h,880+i%4*240,196+Math.floor(i/4)*264,210,238,i===a.hero);
 comicPanel(c,866,746,980,240,P.ink,20,0);comicText(c,ch.style.toUpperCase(),905,785,42,P.yellow,'left',900);
 comicText(c,ch.mechName,905,836,31,P.cyan);lines(c,ch.mechDesc,905,883,880,27);
 comicText(c,'SUPER: '+ch.moves.SA3.name,905,952,27,P.yellow,'left',880);
 footer(c,'SETAS ESCOLHEM    •    ENTER / LEVE CONFIRMA    •    ESC / MÉDIO VOLTA');
}
function versus(c,a){
 comicBackground(c,a.frame);c.fillStyle=P.red;c.beginPath();c.moveTo(0,0);c.lineTo(1100,0);c.lineTo(800,H);c.lineTo(0,H);c.closePath();c.fill();
 const left=HEROES[a.hero],right=a.foe,t=Math.max(0,1-Math.min(1,a.vsT/18));
 portrait(c,left,-50-t*300,155,825,1100,1);portrait(c,right,1145+t*300,155,825,1100,-1);
 comicPanel(c,60,42,720,94,P.ink,20,4);comicPanel(c,1140,42,720,94,P.ink,20,4);
 comicText(c,left.name,96,92,58,P.paper,'left',640);comicText(c,right.name,1824,92,58,P.paper,'right',640);
 comicText(c,left.style,100,175,30,P.ink,'left',610);comicText(c,right.style,1820,175,30,P.ink,'right',610);
 c.save();c.translate(960,460);c.rotate(-.08);c.font='235px SNComic, sans-serif';c.textAlign='center';c.textBaseline='middle';c.strokeStyle=P.ink;c.lineJoin='miter';c.lineWidth=24;c.strokeText('VS',0,0);c.fillStyle=P.paper;c.fillText('VS',0,0);c.restore();
 comicPanel(c,780,760,360,233,P.ink,14,0);drawBelemPresentation(c,'miniatura',800,775,320,180);comicText(c,'VER-O-PESO / BELÉM',960,975,28,P.paper,'center');
 footer(c,a.mode==='vs2'?'JOGADOR 1    •    FRENTE A FRENTE    •    JOGADOR 2':'ENTER / LEVE PARA COMEÇAR A LUTA');
}
export function drawComicPause(c,a,items){
 artFrame=a.frame;
 c.fillStyle='rgba(23,19,27,.88)';c.fillRect(0,0,W,H);
 const ch=a.st.f[0].ch;portrait(c,ch,65,185,570,760,1);
 comicPanel(c,682,122,800,834,P.yellow,35,7);comicText(c,'PAUSADO',765,238,96,P.ink);
 comicText(c,'RESPIRA. VOLTA PRA LUTA.',765,309,29,P.ink);
 items.forEach((label,i)=>comicMenuItem(c,label,750,363+i*85,650,a.pcur===i,i));
 comicText(c,'ESC / PAUSA PARA CONTINUAR',1080,925,24,P.ink,'center');
}
function join(c,a,srcName){comicBackground(c,a.frame);heading(c,'DOIS SALVADORES. UMA ARENA.');
 for(let i=0;i<2;i++){const x=180+i*840,ready=a.slots[i]!==null;comicPanel(c,x,270,720,550,P.paper,24,6);comicPanel(c,x+18,288,684,100,i?P.ink:P.red,16,0);comicText(c,'JOGADOR '+(i+1),x+360,340,62,P.paper,'center');comicText(c,ready?'NA ÁREA!':'ENTRE NA LUTA',x+360,520,76,ready?P.red:P.ink,'center');comicText(c,ready?srcName(a.slots[i]):'APERTE ENTER / LEVE NO SEU CONTROLE',x+360,655,29,P.ink,'center',630);}
 footer(c,'CADA JOGADOR ENTRA COM SEU CONTROLE    •    ESC VOLTA');}
function select2(c,a,srcName){comicBackground(c,a.frame);heading(c,'ESCOLHAM SEUS SALVADORES');
 for(let side=0;side<2;side++){const ch=HEROES[side?a.hero2:a.hero],x=side?1390:15;portrait(c,ch,x,220,515,687,side?-1:1);comicPanel(c,x+10,874,500,84,side?P.ink:P.red,18,4);comicText(c,ch.name,x+260,917,42,P.paper,'center',450);comicText(c,'J'+(side+1)+' • '+srcName(a.slots[side]),x+260,191,25,side?P.paper:P.ink,'center',475);if(a.ready[side]){comicPanel(c,x+75,665,365,85,P.yellow,10,4);comicText(c,'PRONTO!',x+258,710,66,P.ink,'center');}}
 HEROES.forEach((ch,i)=>{const selected=i===a.hero||i===a.hero2;card(c,ch,555+i%4*198,280+Math.floor(i/4)*248,178,223,selected,[i===a.hero?'J1':'',i===a.hero2?'J2':''].filter(Boolean).join(' / '));});footer(c,'CADA UM MOVE O SEU CURSOR    •    LEVE CONFIRMA    •    MÉDIO DESFAZ');}
function result(c,a){comicBackground(c,a.frame);const winner=a.st.winner,win=winner===0,ch=a.st.f[winner??0].ch;
 portrait(c,ch,40,168,680,907,1);comicText(c,winner===null?'EMPATE':a.mode==='vs2'?`JOGADOR ${winner+1} VENCE`:win?'VITÓRIA!':'DERROTA',825,235,133,win?P.red:P.ink,'left',1010);
 comicPanel(c,820,339,995,286,P.ink,20,0);const s=a.stats;[['TEMPO DE LUTA',`${Math.round(s.frames/60)} s`],['COMBO MÁXIMO',s.maxCombo+' ACERTOS'],['DANO CAUSADO',String(s.dmg)],['ROUNDS',a.st.f[0].rounds+' × '+a.st.f[1].rounds]].forEach(([label,v],i)=>{comicText(c,label,860,386+i*64,30,P.paper);comicText(c,v,1760,386+i*64,36,P.yellow,'right');});
 ['REVANCHE','TROCAR PERSONAGEM','MENU'].forEach((label,i)=>comicMenuItem(c,label,880,681+i*91,850,a.cur===i,i));footer(c,'A TURNÊ CONTINUA    •    ENTER CONFIRMA');}
export function drawComicScreen(c,a,{menu,srcName}){
 artFrame=a.frame;
 switch(a.screen){case'title':title(c,a,menu);break;case'select':select(c,a,menu);break;case'vs':versus(c,a);break;case'join':join(c,a,srcName);break;case'select2':select2(c,a,srcName);break;case'result':result(c,a);break;default:return false;}return true;
}
