// Recover whole poses that extend across nominal grid gutters, without taking
// pixels from a neighbouring pose. Atlas outer-edge contact is real clipping.
export function splitPoses(rgba,width,height){
 const labels=new Int32Array(width*height),queue=new Int32Array(width*height),regions=[];
 for(let seed=0;seed<labels.length;seed++){
  if(labels[seed]||rgba[seed*4+3]<=127)continue;
  const id=regions.length+1;let head=0,tail=1,l=width,t=height,r=-1,b=-1,sx=0,sy=0;queue[0]=seed;labels[seed]=id;
  while(head<tail){const p=queue[head++],x=p%width,y=Math.floor(p/width);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);sx+=x;sy+=y;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;const q=yy*width+xx;if(!labels[q]&&rgba[q*4+3]>127){labels[q]=id;queue[tail++]=q;}}
  }
  regions.push({id,area:tail,l,t,r,b,cx:sx/tail,cy:sy/tail});
 }
 const major=[...regions].sort((a,b)=>b.area-a.area).slice(0,6);
 if(major.length!==6||major.some(r=>r.area<3000))throw Error('Expected six isolated full-body poses');
 const cells=new Array(6);for(const r of major){const k=Math.floor(r.cx/512)+3*Math.floor(r.cy/512);if(k<0||k>5||cells[k])throw Error('Poses overlap nominal grid; review source');cells[k]={...r,componentIds:[r.id]};}
 const distance=(a,b)=>Math.hypot(Math.max(b.l-a.r,a.l-b.r,0),Math.max(b.t-a.b,a.t-b.b,0));
 for(const r of regions){if(r.area<3||major.some(m=>m.id===r.id))continue;const nearest=major.reduce((a,b)=>distance(r,a)<=distance(r,b)?a:b);const owner=cells.find(c=>c.id===nearest.id);owner.l=Math.min(owner.l,r.l);owner.t=Math.min(owner.t,r.t);owner.r=Math.max(owner.r,r.r);owner.b=Math.max(owner.b,r.b);owner.componentIds.push(r.id);}
 const owners=new Int8Array(regions.length+1);owners.fill(-1);cells.forEach((r,i)=>r.componentIds.forEach(id=>owners[id]=i));
 const boxes=cells.map((r,k)=>{const clipped=r.l===0||r.t===0||r.r===width-1||r.b===height-1;
  const left=Math.max(0,r.l-4),top=Math.max(0,r.t-4),right=Math.min(width,r.r+5),bottom=Math.min(height,r.b+5);
  let foreignPixels=0;const own=new Set(r.componentIds);for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const id=labels[y*width+x];if(id&&!own.has(id)&&regions[id-1].area>=3)foreignPixels++;}

  return{left,top,width:right-left,height:bottom-top,clipped,area:r.area,foreignPixels,nominal:[k%3*512,Math.floor(k/3)*512,512,512]};
 });
 return{boxes,labels,owners};
}

export function poseBoxes(rgba,width,height){return splitPoses(rgba,width,height).boxes;}
export function extractPose(rgba,width,height,split,index){
 const box=split.boxes[index],out=Buffer.alloc(box.width*box.height*4);
 for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
  const ax=box.left+x,ay=box.top+y,pos=ay*width+ax,id=split.labels[pos],owner=id?split.owners[id]:-1;
  if(owner>=0&&owner!==index)continue;
  if(!id&&rgba[pos*4+3]>3){
   let ownDistance=Infinity,foreignDistance=Infinity;
   for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
    const xx=ax+dx,yy=ay+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;const q=split.labels[yy*width+xx];if(!q)continue;const o=split.owners[q];if(o<0)continue;const d=dx*dx+dy*dy;
    if(o===index)ownDistance=Math.min(ownDistance,d);else foreignDistance=Math.min(foreignDistance,d);
   }
   if(foreignDistance<ownDistance)continue;
  }
  const dest=(y*box.width+x)*4;out[dest]=rgba[pos*4];out[dest+1]=rgba[pos*4+1];out[dest+2]=rgba[pos*4+2];out[dest+3]=rgba[pos*4+3];
 }
 return out;
}
