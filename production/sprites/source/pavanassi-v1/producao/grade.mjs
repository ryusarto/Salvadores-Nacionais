import crypto from 'node:crypto';
// Source drawings can extend a few pixels beyond a nominal third. Slice in the
// nearest transparent gutter so the whole shoe/hand stays with its own drawing.
export function spriteColumns(data,width,height,channels=4){
 const solid=new Uint8Array(width);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*channels+channels-1]>24)solid[x]=1;
 const cuts=[0];
 for(let i=1;i<3;i++){
  const target=Math.round(width*i/3),radius=Math.round(width/3*.22),candidates=[];
  for(let x=Math.max(cuts.at(-1)+1,target-radius);x<Math.min(width,target+radius);x++)if(!solid[x-1]&&!solid[x]&&!solid[x+1])candidates.push(x);
  const cut=candidates.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target))[0]??target;
  cuts.push(cut);
 }
 cuts.push(width);return cuts;
}
export async function atlasHashes(sharp,strip,meta){
 for(let i=0;i<6;i++){
  const raw=await sharp(strip).extract({left:i*500,top:0,width:500,height:500}).ensureAlpha().raw().toBuffer();
  meta[i].individualSha256??=meta[i].sha256;
  meta[i].sha256=crypto.createHash('sha256').update(raw).digest('hex');
 }
}
