import { inflateSync } from 'node:zlib';

/** Decode the actual 8-bit RGBA pixels of non-interlaced exported PNGs. */
export function readRgbaPng(bytes) {
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(bytes[24]!==8||bytes[25]!==6||bytes[28]!==0)throw Error('Expected non-interlaced RGBA8 PNG');
  const chunks=[];
  for(let p=8;p<bytes.length;){const size=bytes.readUInt32BE(p),type=bytes.toString('ascii',p+4,p+8);if(type==='IDAT')chunks.push(bytes.subarray(p+8,p+8+size));p+=size+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(width*height*4);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){
    const start=y*(stride+1),filter=raw[start];
    if(filter>4)throw Error('Invalid PNG filter');
    for(let x=0;x<stride;x++){
      const pos=y*stride+x,left=x>=4?pixels[pos-4]:0,up=y?pixels[pos-stride]:0,corner=y&&x>=4?pixels[pos-stride-4]:0;
      const prediction=[0,left,up,Math.floor((left+up)/2),paeth(left,up,corner)][filter];
      pixels[pos]=(raw[start+1+x]+prediction)&255;
    }
  }
  return {width,height,pixels};
}

export function alphaBounds(image,threshold=127) {
  const {width,height,pixels}=image;let left=width,top=height,right=-1,bottom=-1,count=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>threshold){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
  return {x:left,y:top,w:right-left+1,h:bottom-top+1,bottom,pixels:count};
}

/** Stable color landmark for these fixed Majis illustrations, not face detection. */
export function upperSkinLandmark(image) {
  const {width:w,height:h,pixels}=image,mask=new Uint8Array(w*h),queue=new Uint32Array(w*h),regions=[];
  for(let i=0;i<w*h;i++){const p=i*4,r=pixels[p],g=pixels[p+1],b=pixels[p+2];mask[i]=pixels[p+3]>180&&r>95&&g>60&&b>40&&r-g>12&&g-b>4&&r-b>28?1:0;}
  for(let i=0;i<mask.length;i++){
    if(!mask[i])continue;let head=0,tail=1,left=w,top=h,right=-1,bottom=-1;queue[0]=i;mask[i]=0;
    while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){const n=yy*w+xx;if(mask[n]){mask[n]=0;queue[tail++]=n;}}
    }
    if(tail>250&&right-left+1>=30&&bottom-top+1>=40)regions.push({x:left,y:top,w:right-left+1,h:bottom-top+1,pixels:tail});
  }
  return regions.sort((a,b)=>a.y-b.y)[0];
}
