/** Build-time placement of painted bunting, with explicit physical suspension points. */
export const MAST_TIES={left:[53/507,148/1491],right:[457/507,148/1491]};
const spriteTies={
 'bandeirolas-1':[[29,198],[482,198]],
 'bandeirolas-2':[[26,204],[486,204]],
 'bandeirolas-vento':[[42,343],[458,343]],
 'bandeira-trans-vento':[[45,120],[448,120]],
};
function box(assets,o){const a=assets[o.asset];const [, ,sw,sh]=a.crop||[0,0,a.cellWidth||a.width/(a.frames||1),a.height];const h=o.h??o.w*sh/sw,w=o.w??h*sw/sh;return{x:o.x-w/2,y:o.y-h,w,h};}
export function makeMast(assets,objects,{id,x,y=826,h,factor}){if(!assets['mastro-bandeirolas'])return;const o={id,asset:'mastro-bandeirolas',x,y,h,factor};objects.push(o);return o;}
export function tie(object,uv){if(!object)throw Error('Suspension support missing');return{objectId:object.id,uv};}
function point(assets,objects,ref){const o=objects.find(o=>o.id===ref.objectId);if(!o)throw Error('Missing support '+ref.objectId);const b=box(assets,o);return{x:b.x+ref.uv[0]*b.w,y:b.y+ref.uv[1]*b.h,factor:o.factor};}
export function hang(assets,objects,asset,from,to,opts={}){
 if(!assets[asset])return;
 const a=assets[asset],p0=point(assets,objects,from),p1=point(assets,objects,to),knots=spriteTies[asset];
 if(p0.factor!==p1.factor)throw Error('Suspension must share its supports parallax');
 const [sx,sy,sw,sh]=a.crop||[0,0,a.cellWidth||a.width/(a.frames||1),a.height];
 const u0=(knots[0][0]-sx)/sw,v0=(knots[0][1]-sy)/sh,u1=(knots[1][0]-sx)/sw;
 const w=(p1.x-p0.x)/(u1-u0),h=w*sh/sw;
 const o={id:asset+'-suspended-'+objects.length,asset,x:p0.x-u0*w+w/2,y:p0.y-v0*h+h,w,h,factor:p0.factor,...opts,suspension:{anchors:[{...from,sprite:knots[0]},{...to,sprite:knots[1]}],tolerance:8}};
 if(Math.abs(p1.y-p0.y)>8)throw Error('Painted bunting expects level anchor points');objects.push(o);return o;
}
