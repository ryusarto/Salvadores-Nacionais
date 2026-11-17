import {HEROES,BOSSES} from '../src/data/characters/index.js';
import {SYS} from '../src/data/system.js';
import {createMatch,step} from '../src/core/match.js';
import {createBrain,aiInput} from '../src/core/ai.js';
import {createRunAt,currentFight} from '../src/ui/story.js';
let games=0;const results=[];
for(const hero of HEROES)for(let chapter=0;chapter<BOSSES.length;chapter++){
 const run=createRunAt(hero.id,chapter,chapter),boss=BOSSES[chapter];
 if(run.fights.length!==1||currentFight(run).foe!==boss.id)throw Error(`Rota inválida: ${hero.id}/${chapter}`);
 const st=createMatch({chars:[hero,boss],seed:7919+chapter,dmgMul:SYS.DIFFICULTY[1].bossDmg}),brains=[createBrain(1),createBrain(1)];
 for(let i=0;i<30000&&st.phase!=='over';i++){
  step(st,aiInput(st,0,brains[0]),aiInput(st,1,brains[1]));
  if(st.f.some(f=>![f.hp,f.x,f.y].every(Number.isFinite)))throw Error(`Estado inválido: ${hero.id}/${boss.id}`);
 }
 if(st.phase!=='over')throw Error(`Partida não terminou: ${hero.id}/${boss.id}`);
 games++;results.push({hero:hero.id,boss:boss.id,winner:st.winner,frames:st.frame});
}
console.log(JSON.stringify({games,unfinished:0,results},null,2));
