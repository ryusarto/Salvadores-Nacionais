import{HEROES,BOSSES}from'../data/characters/index.js';
import{COMIC as P,comicBackground,comicPortrait,comicPanel,comicText,comicMenuItem}from'../render/comic-ui.js';
import{drawBelemPresentation}from'../render/belem-stage.js';
import{drawStoryScreen,drawStoryVsTag,storyPlace,drawStageThumb,BOSS_STAGES}from'./story-screens.js';
import {encounterStage} from '../data/stages.js';
import {HERO_ENDINGS,CHAPTERS} from '../data/story.js';
import {loadProgress} from './story.js';
import {drawRetroScreen,FOE_GRID} from './retro-screens.js';
const W=1920,H=1080;
export const TITLE_CAST=[['ryuchi',1100,150,330,440],['mdep',1390,165,330,440],['majis',1665,130,330,440],['franco',900,420,360,480],['chapuh',1240,410,360,480],['dney',1580,410,360,480],['belga',1080,660,390,520],['trunks',1500,650,420,560]];
let artFrame=0;
const reducedMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const natural={franco:-1,belga:1,majis:-1,dney:-1,ryuchi:1,trunks:1,mdep:-1,chapuh:-1,zanata:1,chupetinha:1,pavanassi:1,fujao:1,'pai-fujao':1,laranjao:1,djabo:1};
export function portrait(c,ch,x,y,w,h,facing=1){
 const t=reducedMotion()?0:artFrame/60,phase=(HEROES.findIndex(h=>h.id===ch.id)+1)*.7;
 const breath=reducedMotion()?0:Math.sin(t*1.55+phase);
 c.save();c.translate(x+w/2,y+h);c.rotate(breath*.0025);c.scale(1+breath*.0015,1+breath*.003);c.translate(-w/2,-h);
 const result=comicPortrait(c,ch.id,0,0,w,h,(natural[ch.id]??1)!==facing);c.restore();return result;
}
export function footer(c,message){if(typeof document!=='undefined'&&document.documentElement.classList.contains('touch'))message='TOQUE NAS OPÇÕES PARA ESCOLHER · USE VOLTAR PARA RETORNAR';c.fillStyle=P.ink;c.fillRect(0,1018,W,62);comicText(c,message,W/2,1049,25,P.paper,'center',1770);}
function heading(c,title,sub){comicPanel(c,55,40,1050,100,P.red,22,5);comicText(c,title,100,92,66,P.paper,'left',960);if(sub)comicText(c,sub,1840,90,28,P.paper,'right',640);}
function lines(c,str,x,y,width,size,color=P.paper){c.font=`${size}px SNComic, sans-serif`;let line='',n=0;for(const word of str.split(' ')){if(c.measureText(line+word).width>width&&line){comicText(c,line.trim(),x,y+n*size*1.25,size,color);n++;line='';}line+=word+' ';}if(line)comicText(c,line.trim(),x,y+n*size*1.25,size,color);}
/** Rivais do Versus CPU: os heróis, os chefes e, por último, a opção aleatória (null). */
export const FOES=[...HEROES,...BOSSES,null];
export const FOE_COLS=FOE_GRID;
function versus(c,a){
 comicBackground(c,a.frame);c.fillStyle=P.red;c.beginPath();c.moveTo(0,0);c.lineTo(1100,0);c.lineTo(800,H);c.lineTo(0,H);c.closePath();c.fill();
 const left=HEROES[a.hero],right=a.foe,t=Math.max(0,1-Math.min(1,a.vsT/18));
 portrait(c,left,-50-t*300,155,825,1100,1);portrait(c,right,1145+t*300,155,825,1100,-1);
 comicPanel(c,60,42,720,94,P.ink,20,4);comicPanel(c,1140,42,720,94,P.ink,20,4);
 comicText(c,left.name,96,92,58,P.paper,'left',640);comicText(c,right.name,1824,92,58,P.paper,'right',640);
 comicText(c,left.style,100,175,30,P.ink,'left',610);comicText(c,right.style,1820,175,30,P.ink,'right',610);
 c.save();c.translate(960,460);c.rotate(-.08);c.font='235px SNComic, sans-serif';c.textAlign='center';c.textBaseline='middle';c.strokeStyle=P.ink;c.lineJoin='miter';c.lineWidth=24;c.strokeText('VS',0,0);c.fillStyle=P.paper;c.fillText('VS',0,0);c.restore();
 comicPanel(c,780,760,360,233,P.ink,14,0);(drawStageThumb(c,{stage:encounterStage(a)},800,775,320,180)||drawBelemPresentation(c,'miniatura',800,775,320,180));comicText(c,a.mode==='story'&&a.story?storyPlace(a):BOSS_STAGES[encounterStage(a)]?.[0]||'VER-O-PESO / BELÉM',960,975,28,P.paper,'center',330);
 if(a.mode==='story'&&a.story)drawStoryVsTag(c,a);
 footer(c,a.vsReady===false?'CARREGANDO OS LUTADORES…':a.mode==='vs2'?'JOGADOR 1    •    FRENTE A FRENTE    •    JOGADOR 2':'ENTER / LEVE PARA COMEÇAR A LUTA');
}
export function drawComicPause(c,a,items){
 artFrame=a.frame;
 c.fillStyle='rgba(23,19,27,.88)';c.fillRect(0,0,W,H);
 const ch=a.st.f[0].ch;portrait(c,ch,65,185,570,760,1);
 comicPanel(c,682,122,800,834,P.yellow,35,7);comicText(c,'PAUSADO',765,238,96,P.ink);
 comicText(c,'RESPIRA. VOLTA PRA LUTA.',765,309,29,P.ink);
 items.forEach((label,i)=>comicMenuItem(c,label,750,355+i*76,650,a.pcur===i,i));
 comicText(c,'ESC / PAUSA PARA CONTINUAR',1080,925,24,P.ink,'center');
}
function result(c,a){comicBackground(c,a.frame);const winner=a.st.winner,win=winner===0,ch=a.st.f[winner??0].ch;
 portrait(c,ch,40,168,680,907,1);comicText(c,winner===null?'EMPATE':a.mode==='vs2'?`JOGADOR ${winner+1} VENCE`:win?'VITÓRIA!':'DERROTA',825,235,133,win?P.red:P.ink,'left',1010);
 comicPanel(c,820,339,995,286,P.ink,20,0);const s=a.stats;[['TEMPO DE LUTA',`${Math.round(s.frames/60)} s`],['COMBO MÁXIMO',s.maxCombo+' ACERTOS'],['DANO CAUSADO',String(s.dmg)],['ROUNDS',a.st.f[0].rounds+' × '+a.st.f[1].rounds]].forEach(([label,v],i)=>{comicText(c,label,860,386+i*64,30,P.paper);comicText(c,v,1760,386+i*64,36,P.yellow,'right');});
 ['REVANCHE','TROCAR PERSONAGEM','MENU'].forEach((label,i)=>comicMenuItem(c,label,880,681+i*91,850,a.cur===i,i));footer(c,'A TURNÊ CONTINUA    •    ENTER CONFIRMA');}
function gallery(c,a){
 comicBackground(c,a.frame);heading(c,'FINAIS DOS SALVADORES');const ch=HEROES[a.hero];portrait(c,ch,50,180,600,800,1);
 comicPanel(c,730,300,1100,410,P.paper,20,5);comicText(c,ch.name,780,360,60,P.red,'left',950);
 lines(c,(loadProgress()[ch.id]||0)>=CHAPTERS.length?HERO_ENDINGS[ch.id]:'COMPLETE A HISTÓRIA COM ESTE SALVADOR PARA LIBERAR SEU FINAL.',780,465,950,40,P.ink);
 comicMenuItem(c,'ANTERIOR',80,800,700,false,0);comicMenuItem(c,'PRÓXIMO',1100,800,700,false,1);
 footer(c,'← → ESCOLHEM · ESC VOLTA');
}
export function drawComicScreen(c,a,{menu,options,srcName,keys}){
 artFrame=a.frame;
 if(drawRetroScreen(c,a,{menu,options,srcName,keys,foes:FOES}))return true;
 switch(a.screen){case'gallery':gallery(c,a);break;case'vs':versus(c,a);break;case'result':result(c,a);break;default:if(!drawStoryScreen(c,a))return false;}return true;
}
