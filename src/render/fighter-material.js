// A shared render material; approved source pixels and animation poses stay intact.
// Cached once per decoded atlas, then evicted with the sprite reader's LRU.
const strengths={franco:.65,dney:.65,mdep:.55,chapuh:.25,majis:.25,ryuchi:.25,'ryuchi-esquerda':.25,trunks:.25,belga:.25};
let enabled=true,renderer=null,failed=false,processed=0;
export function configureFighterMaterial(value){enabled=value;}
export function fighterMaterialStatus(){return{enabled,available:!!renderer,failed,processed};}
function createRenderer(){
 const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(1,1):document.createElement('canvas');
 const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});if(!gl)return null;
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Fighter material shader');return s;};
 const vs=shader(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=(position+1.0)*.5;gl_Position=vec4(position.x,-position.y,0.,1.);}');
 const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;uniform sampler2D atlas;uniform vec2 pixel;uniform float strength;varying vec2 uv;
 void main(){vec4 p=texture2D(atlas,uv);float edge=max(max(texture2D(atlas,uv+vec2(pixel.x,0.)).a,texture2D(atlas,uv-vec2(pixel.x,0.)).a),max(texture2D(atlas,uv+vec2(0.,pixel.y)).a,texture2D(atlas,uv-vec2(0.,pixel.y)).a));
 float l=dot(p.rgb,vec3(.2126,.7152,.0722));vec3 col=mix(vec3(l),p.rgb,1.035);float tonal=floor(l*9.+.5)/9.;col+=vec3((tonal-l)*strength*.20);
 col*=mix(vec3(.985,.98,1.025),vec3(1.02,1.,.975),smoothstep(.18,.80,l));
 col=(col-.5)*(1.+strength*.035)+.5;
 float ink=edge*(1.-p.a)*.32*strength;float a=max(p.a,ink);col=mix(vec3(.055,.035,.065),clamp(col,0.,1.),p.a/max(a,.001));gl_FragColor=vec4(col,a);}`);
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
 return{canvas,gl,program};
}
export function applyFighterMaterial(image,id){
 if(!enabled||!Object.hasOwn(strengths,id)||typeof document==='undefined')return image;
 try{
  if(failed)return image;renderer??=createRenderer();if(!renderer){failed=true;return image;}
  const{canvas,gl,program}=renderer,w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
  if(w>gl.getParameter(gl.MAX_TEXTURE_SIZE)||h>gl.getParameter(gl.MAX_TEXTURE_SIZE))return image;
  canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);gl.useProgram(program);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform2f(gl.getUniformLocation(program,'pixel'),1/w,1/h);gl.uniform1f(gl.getUniformLocation(program,'strength'),strengths[id]);gl.drawArrays(gl.TRIANGLES,0,6);
  const output=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h});output.getContext('2d').drawImage(canvas,0,0);gl.deleteTexture(texture);processed++;
  return output;
 }catch{failed=true;return image;}
}
