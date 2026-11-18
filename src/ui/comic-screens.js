import{HEROES,BOSSES}from'../data/characters/index.js';
import{RETRO as R,ptext,ptextWidth,pwrap,pixelPortrait,pixelBox,playerTag,navyBackground}from'../render/retro-ui.js';
import{drawBelemPresentation}from'../render/belem-stage.js';
import{drawStoryScreen,drawStoryVsTag,storyPlace,drawStageThumb,BOSS_STAGES}from'./story-screens.js';
import {encounterStage} from '../data/stages.js';
import {HERO_ENDINGS,CHAPTERS} from '../data/story.js';
import {loadProgress} from './story.js';
import {drawRetroScreen,FOE_GRID,controlsHint,faceFlip} from './retro-screens.js';
const W=1920,H=1080;
export const TITLE_CAST=[['ryuchi',1100,150,330,440],['mdep',1390,165,330,440],['majis',1665,130,330,440],['franco',900,420,360,480],['chapuh',1240,410,360,480],['dney',1580,410,360,480],['belga',1080,660,390,520],['trunks',1500,650,420,560]];
/** Rivais do Versus CPU: os heróis, os chefes e, por último, a opção aleatória (null). */
export const FOES=[...HEROES,...BOSSES,null];
export const FOE_COLS=FOE_GRID;
/** Fundo dividido na diagonal: vermelho do 1P à esquerda, azul do rival à direita. */
function splitBackground(c){
 c.fillStyle='#000';c.fillRect(0,0,W,H);
 c.fillStyle='#3a0610';c.beginPath();c.moveTo(0,0);c.lineTo(1100,0);c.lineTo(820,H);c.lineTo(0,H);c.closePath();c.fill();
 c.fillStyle='#06104a';c.beginPath();c.moveTo(1100,0);c.lineTo(W,0);c.lineTo(W,H);c.lineTo(820,H);c.closePath();c.fill();
 c.fillStyle=R.yellow;c.beginPath();c.moveTo(1094,0);c.lineTo(1106,0);c.lineTo(826,H);c.lineTo(814,H);c.closePath();c.fill();
}
/** Apresentação da luta: os dois lutadores entram pelos lados e o VS fica no meio. */
function versus(c,a){
 splitBackground(c);
 const left=HEROES[a.hero],right=a.foe,t=Math.max(0,1-Math.min(1,a.vsT/18));
 c.save();c.beginPath();c.rect(0,130,W,950);c.clip();
 pixelPortrait(c,left.id,-30-t*300,215,645,860,faceFlip(left.id,1));pixelPortrait(c,right.id,1305+t*300,215,645,860,faceFlip(right.id,-1));
 c.restore();
 const rightTag=a.mode==='vs2'?'2P':a.mode==='story'?'CHEFE':'CPU';
 playerTag(c,'1P',40,40,R.red,6);ptext(c,left.name,170,72,7,'gold','left',700);ptext(c,left.style.toUpperCase(),48,140,4,'creamOut','left',640);
 const tw=ptextWidth(rightTag,6)+40;playerTag(c,rightTag,1880-tw,40,R.blue,6);ptext(c,right.name,1840-tw-30,72,7,'gold','right',700);ptext(c,right.style.toUpperCase(),1872,140,4,'creamOut','right',640);
 const pop=1+Math.max(0,1-Math.min(1,(a.vsT-10)/12))*.6;
 c.save();c.translate(960,470);c.scale(pop,pop);ptext(c,'VS',0,0,30,'gold');c.restore();
 pixelBox(c,770,750,380,240,'#000',R.cream,6);
 (drawStageThumb(c,{stage:encounterStage(a)},786,766,348,196)||drawBelemPresentation(c,'miniatura',786,766,348,196));
 ptext(c,a.mode==='story'&&a.story?storyPlace(a):BOSS_STAGES[encounterStage(a)]?.[0]||'VER-O-PESO / BELÉM',960,972,3,'creamOut','center',360);
 if(a.mode==='story'&&a.story)drawStoryVsTag(c,a);
 const msg=a.vsReady===false?'CARREGANDO OS LUTADORES…':a.mode==='vs2'?'1P  •  FRENTE A FRENTE  •  2P':touchScreen()?'TOQUE PARA COMEÇAR A LUTA':'APERTE START PARA LUTAR';
 if(a.vsReady===false||a.frame%60<42)ptext(c,msg,960,1045,5,a.vsReady===false?'silver':'blue');
}
const touchScreen=()=>typeof document!=='undefined'&&document.documentElement.classList.contains('touch');
/** Menu de pausa por cima da luta. */
export function drawComicPause(c,a,items){
 c.fillStyle='rgba(0,0,0,.82)';c.fillRect(0,0,W,H);
 const ch=a.st.f[0].ch;
 c.save();c.beginPath();c.rect(0,0,680,H);c.clip();pixelPortrait(c,ch.id,40,185,600,800,faceFlip(ch.id,1));c.restore();
 pixelBox(c,682,122,800,834,'#000428',R.yellow,8);
 ptext(c,'PAUSADO',1082,215,12,'gold');
 ptext(c,'RESPIRA. VOLTA PRA LUTA.',1082,295,4,'cream');
 items.forEach((label,i)=>{const sel=a.pcur===i,y=387+i*76;const w=ptext(c,label,1082,y,sel?6:5,sel?'gold':'silver','center',600);if(sel&&a.frame%30<20)ptext(c,'▶',1082-w/2-44,y,6,'gold');});
 ptext(c,touchScreen()?'TOQUE EM CONTINUAR':'START / ESC PARA CONTINUAR',1082,920,3,'blue');
}
/** Fim da luta: vencedor, números da luta e o que fazer agora. */
function result(c,a,keys){
 c.fillStyle='#000';c.fillRect(0,0,W,H);
 const winner=a.st.winner,win=winner===0,ch=a.st.f[winner??0].ch;
 c.save();c.beginPath();c.rect(0,0,780,H);c.clip();pixelPortrait(c,ch.id,40,168,680,907,faceFlip(ch.id,1));c.restore();
 const head=winner===null?'EMPATE':a.mode==='vs2'?`${winner+1}P VENCE!`:win?'VITÓRIA!':'DERROTA';
 ptext(c,head,1317,225,15,winner===null?'silver':a.mode==='vs2'||win?'gold':'red','center',990);
 pixelBox(c,820,339,995,286,'#000',R.yellow,6);
 const s=a.stats;
 [['TEMPO DE LUTA',`${Math.round(s.frames/60)} S`],['COMBO MÁXIMO',s.maxCombo+' ACERTOS'],['DANO CAUSADO',String(s.dmg)],['ROUNDS',a.st.f[0].rounds+' × '+a.st.f[1].rounds]].forEach(([label,v],i)=>{ptext(c,label,860,386+i*64,4,'cream','left');ptext(c,v,1775,386+i*64,5,'gold','right');});
 ['REVANCHE','TROCAR PERSONAGEM','MENU'].forEach((label,i)=>{const sel=a.cur===i,y=713+i*91;const w=ptext(c,label,1305,y,sel?8:7,sel?'gold':'silver');if(sel&&a.frame%30<20)ptext(c,'▶',1305-w/2-50,y,7,'gold');});
 controlsHint(c,1045,keys,'CONFIRMAR',null);
}
/** Finais dos Salvadores (dentro de OPÇÕES). */
function gallery(c,a,keys){
 navyBackground(c);
 ptext(c,'FINAIS DOS SALVADORES',60,72,7,'gold','left');c.fillStyle=R.yellow;c.fillRect(40,118,1840,4);c.fillStyle='#d84010';c.fillRect(40,122,1840,4);
 const ch=HEROES[a.hero],open=(loadProgress()[ch.id]||0)>=CHAPTERS.length;
 c.save();c.beginPath();c.rect(0,140,700,940);c.clip();pixelPortrait(c,ch.id,50,180,600,800,faceFlip(ch.id,1));c.restore();
 pixelBox(c,730,260,1110,470,'#000428',open?R.yellow:'#5878ff',6);
 ptext(c,ch.name,775,315,7,'gold','left',1010);
 pwrap(open?HERO_ENDINGS[ch.id]:'COMPLETE A HISTÓRIA COM ESTE SALVADOR PARA LIBERAR SEU FINAL.',1010,4).slice(0,8).forEach((l,i)=>ptext(c,l,775,395+i*46,4,open?'cream':'dim','left'));
 ptext(c,'◀ ANTERIOR',730,800,6,'silver','left');ptext(c,'PRÓXIMO ▶',1840,800,6,'silver','right');
 ptext(c,`${a.hero+1} / ${HEROES.length}`,1285,800,4,'gold');
 controlsHint(c,1045,keys,'VOLTAR',null);
}
export function drawComicScreen(c,a,{menu,options,srcName,keys}){
 if(drawRetroScreen(c,a,{menu,options,srcName,keys,foes:FOES}))return true;
 switch(a.screen){case'gallery':gallery(c,a,keys);break;case'vs':versus(c,a);break;case'result':result(c,a,keys);break;default:if(!drawStoryScreen(c,a,keys))return false;}return true;
}
