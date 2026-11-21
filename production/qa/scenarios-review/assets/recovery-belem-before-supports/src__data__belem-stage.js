// World positions are independent from fighter collision and combat timing.
export const BELEM_LAYERS=[
 {id:'ceu',factor:0},{id:'nuvens',factor:.08},{id:'horizonte',factor:.18},
 {id:'agua',factor:.18},{id:'arquitetura',factor:.42},{id:'feira',factor:.78},
 {id:'primeiro-plano',factor:1.05},
];
export const BELEM_OBJECTS=[
 {id:'barco-cabine',asset:'barco-balanco',x:1890,y:768,w:330,factor:.30,fps:4,phase:0,band:'boats'},
 {id:'barco-vela',asset:'barco-2',x:300,y:766,w:270,factor:.30,band:'boats'},
 {id:'agua-esquerda',asset:'agua-ondulacao',x:120,y:720,w:330,h:72,factor:.18,fps:6,phase:1,opacity:.30,band:'water'},
 {id:'agua-direita',asset:'agua-ondulacao',x:1900,y:747,w:450,h:72,factor:.18,fps:6,phase:4,opacity:.26,band:'water'},
 {id:'reflexo-1',asset:'reflexos-agua',x:1680,y:782,w:160,h:100,factor:.18,fps:5,opacity:.25,band:'water'},
 {id:'tenda-1',asset:'toldo-vento',x:250,y:819,w:310,factor:.78,fps:5,band:'canopies'},
 {id:'tenda-2',asset:'barraca-2',x:720,y:819,w:310,factor:.78,band:'canopies'},
 {id:'tenda-3',asset:'barraca-3',x:1410,y:819,w:310,factor:.78,band:'canopies'},
 {id:'tenda-4',asset:'barraca-1',x:2210,y:819,w:310,factor:.78,band:'canopies'},
 {id:'feirante-1',asset:'npc-feirante',x:235,y:819,h:210,factor:.78,fps:4,band:'people'},
 {id:'cliente-1',asset:'npc-cliente',x:880,y:821,h:215,factor:.78,fps:4,phase:3,band:'people'},
 {id:'torcedor-1',asset:'npc-torcedor',x:1160,y:821,h:210,factor:.78,fps:5,phase:1,band:'people'},
 {id:'feirante-2',asset:'npc-feirante',x:2185,y:819,h:210,factor:.78,fps:4,phase:3,band:'people'},
 {id:'banca-1',asset:'banca-frutas-1',x:250,y:824,w:230,factor:.78,band:'tables'},
 {id:'banca-2',asset:'banca-frutas-2',x:720,y:824,w:230,factor:.78,band:'tables'},
 {id:'banca-3',asset:'banca-frutas-1',x:1410,y:824,w:230,factor:.78,band:'tables'},
 {id:'banca-4',asset:'banca-frutas-2',x:2210,y:824,w:230,factor:.78,band:'tables'},
 {id:'caixas-baixas',asset:'caixas-1',x:500,y:825,w:90,factor:.78,band:'details'},
 {id:'caixas-saco',asset:'caixas-2',x:1640,y:825,w:115,factor:.78,band:'details'},
 {id:'caixas-mangas',asset:'caixas-3',x:2370,y:825,w:110,factor:.78,band:'details'},
 {id:'paneiro-mangas',asset:'cestos-1',x:580,y:825,w:95,factor:.78,band:'details'},
 {id:'paneiro-acai',asset:'cestos-2',x:1780,y:825,w:95,factor:.78,band:'details'},
 {id:'mangueira',asset:'folhagem-vento',x:55,y:823,h:310,factor:.78,fps:5,band:'details'},
 {id:'palmeira',asset:'folhagem-2',x:2440,y:823,h:350,factor:.78,band:'details'},
 {id:'bandeiras-vivas',asset:'bandeirolas-vento',x:670,y:456,w:500,h:125,factor:.78,fps:6,band:'flags'},
 {id:'bandeiras-2',asset:'bandeirolas-2',x:2100,y:456,w:500,h:125,factor:.78,band:'flags'},
 {id:'poste-1',asset:'poste-1',x:1010,y:824,h:340,factor:.78,band:'details'},
 {id:'poste-2',asset:'poste-1',x:1910,y:824,h:340,factor:.78,band:'details'},
 {id:'halo-1',asset:'luz-poste',x:1010,y:562,w:115,h:115,factor:.78,fps:4,opacity:.35,band:'lights'},
 {id:'halo-2',asset:'luz-poste',x:1910,y:562,w:115,h:115,factor:.78,fps:4,phase:3,opacity:.35,band:'lights'},
 {id:'poeira-cais',asset:'poeira-ambiente',x:480,y:825,w:230,h:60,factor:.78,fps:5,opacity:.16,band:'dust'},
];
export const BELEM_BANDS=['water','boats','canopies','people','tables','details','flags','lights','dust'];
export function stageFrame(frame,fps=4,phase=0){return((Math.floor(Math.max(0,frame)*fps/60)+phase)%6+6)%6;}
export function stageLayerWidth(factor){return Math.ceil(1920+680*factor);}
