// Original forest Camp geometry. Run: node apps/web/scripts/build-camp-scene.mjs
// Deterministic, locally authored assets; no downloaded models or textures.
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mkdir, writeFile } from 'node:fs/promises';
const landing = process.argv.includes('--landing');
const solo = process.argv.includes('--solo') || landing;

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }); }
};
const root = new T.Group();
const batches = new Map();
const crownBatches = new Map();
let activeBatches = batches;
const materials = new Map();
function material(color, glow = false, vertexColors = false) {
  const key = `${color}:${glow}:${vertexColors}`;
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, vertexColors, roughness: .86, ...(glow ? { emissive: color, emissiveIntensity: 1.3 } : {}) }));
  return materials.get(key);
}
function shape(geometry, color, position, scale = [1,1,1], rotation = [0,0,0], glow = false) {
  const mat = material(color, glow, !!geometry.getAttribute('color'));
  const transform = new T.Matrix4().compose(new T.Vector3(...position), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(...scale));
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  g.deleteAttribute('uv');
  g.applyMatrix4(transform);
  if (!activeBatches.has(mat)) activeBatches.set(mat, []);
  activeBatches.get(mat).push(g);
  geometry.dispose();
}
const box = (p,s,c,r) => shape(new T.BoxGeometry(1,1,1),c,p,s,r);
const cylinder = (p,rt,rb,h,c,segments=16,r=[0,0,0]) => shape(new T.CylinderGeometry(rt,rb,h,segments),c,p,[1,1,1],r);
const ball = (p,s,c) => {
 const bush=['#244638','#315540','#41634a'].includes(c);
 if(bush){for(let i=0;i<5;i++){const a=i*2.4;shape(tintGeometry(new T.IcosahedronGeometry(1,1),c,.28),'#ffffff',[p[0]+Math.sin(a)*s[0]*.45,p[1]+(i%2)*s[1]*.18,p[2]+Math.cos(a)*s[2]*.45],[s[0]*.64,s[1]*.78,s[2]*.64]);}}
 else shape(tintGeometry(new T.SphereGeometry(1,12,8),c,.13),'#ffffff',p,s);
};
const ring = (p,r,t,c,rot=[Math.PI/2,0,0]) => shape(new T.TorusGeometry(r,t,6,32),c,p,[1,1,1],rot);
const wood = ['#865131','#945e39','#a66c42','#9c6039','#b07949'];
const pine = landing ? ['#31583b','#426d42','#5b8049'] : ['#244638','#315540','#41634a'];
// Detail noise is spatial: adding detail never advances the layout seed.
const noise=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
function tintGeometry(g,base,amount=.12){const c=new T.Color(base),colors=[],v=g.getAttribute('position');for(let i=0;i<v.count;i++){const n=noise(v.getX(i)*3.1,v.getY(i)*2.7+v.getZ(i)*4.3);const t=c.clone().multiplyScalar(1+amount*(n-.5));colors.push(t.r,t.g,t.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));return g;}
let seed=17;
function random() { seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }

// The forest extends past the viewport. No platform or miniature base.
cylinder([0,-.22,0],110,110,.4,'#263e35',96);
if (!solo) {
 const g=new T.BufferGeometry(),v=[],colors=[],indices=[],rings=10,sides=72;
 for(let j=0;j<=rings;j++)for(let i=0;i<=sides;i++){const a=i*Math.PI*2/sides,t=j/rings,r=t*(5.3+.14*Math.sin(a*7));v.push(Math.cos(a)*r,.045-.03*t*t,Math.sin(a)*r*.89);const c=new T.Color('#807053').lerp(new T.Color('#304735'),T.MathUtils.smoothstep(t,.68,1));c.multiplyScalar(.97+.06*noise(i,j));colors.push(c.r,c.g,c.b);if(j<rings&&i<sides){const k=j*(sides+1)+i;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}}
 g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();shape(g,'#ffffff',[0,0,0]);
}
// Continuous ribbons extend beyond the camera and dissolve into distant fog.
const stream = new T.CatmullRomCurve3([[23,.018,4],[12,.018,-1],[5.8,.018,-6],[3.9,.018,-10],[5,.018,-14],[2,.018,-20],[-3,.018,-35],[-8,.018,-60],[-12,.018,-89]].map(p=>new T.Vector3(...p)));
// The footbridge crosses the near bend perpendicular to the water's flow.
const bridgeCenter=stream.getPoint(.31),flow=stream.getTangent(.31);
const bridgeAxis=new T.Vector3(-flow.z,0,flow.x).normalize();
const bridgeSide=new T.Vector3(-bridgeAxis.z,0,bridgeAxis.x);
const bridgeHalf=1.55,bridgeYaw=Math.atan2(-bridgeAxis.z,bridgeAxis.x);
function bridgePoint(u,v,y) { const p=bridgeCenter.clone().addScaledVector(bridgeAxis,u).addScaledVector(bridgeSide,v);return [p.x,y,p.z]; }
const approach=new T.CatmullRomCurve3([[2.3,.075,-2.6],[3.4,.035,-4.7],bridgePoint(-2.1,0,.035),bridgePoint(-bridgeHalf,0,.06)].map(p=>new T.Vector3(...p)));
const departure=new T.CatmullRomCurve3([bridgePoint(bridgeHalf,0,.06),bridgePoint(2.1,0,.035),[6.5,.025,-12],[6.1,.025,-17],[5.4,.025,-23],[1.5,.025,-35],[-3.7,.025,-60],[-7.7,.025,-89]].map(p=>new T.Vector3(...p)));
// The combined centreline is used only to keep vegetation clear of both paths.
const trail=new T.CatmullRomCurve3([...approach.points,...departure.points]);
// Low relief and woodland colour variations, with a level central gathering.
if(!landing){
 const g=new T.PlaneGeometry(90,110,90,110);g.rotateX(-Math.PI/2);g.translate(0,0,-25);
 const v=g.getAttribute('position'),colors=[];
 for(let i=0;i<v.count;i++){const x=v.getX(i),z=v.getZ(i),edge=(nearRoute(x,z,trail,1.6)||nearRoute(x,z,stream,1.4))?0:T.MathUtils.smoothstep(Math.hypot(x,z),5,11);v.setY(i,-.018+edge*(.045*Math.sin(x*.8)*Math.cos(z*.6)+.025*noise(x,z)));const c=new T.Color('#304735').lerp(new T.Color('#596044'),noise(Math.floor(x*.9),Math.floor(z*.9))*.48);colors.push(c.r,c.g,c.b);}
 g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();shape(g,'#ffffff',[0,0,0]);
}
function ribbon(curve, width, color, lift=0, offset=0, start=0, end=1, steps=180) {
  const positions=[],indices=[],length=curve.getLength();
  for(let i=0;i<=steps;i++) {
    const t=start+(end-start)*i/steps,p=curve.getPoint(t),d=curve.getTangent(t);
    const normal=new T.Vector3(-d.z,0,d.x).normalize();
    const half=width(t)*(1+.035*Math.sin(t*length*1.3)+.02*Math.sin(t*length*2.2));
    for(const side of [-1,1]) {const v=p.clone().addScaledVector(normal,offset+side*half);positions.push(v.x,v.y+lift,v.z);}
    if(i<steps){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  shape(geometry,color,[0,0,0]);
}
function grassBlade(x,y,z,height,angle,color){
 const w=.018+noise(x,z)*.022,dx=Math.cos(angle),dz=Math.sin(angle),g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute([x-dx*w,y,z-dz*w,x+dx*w,y,z+dz*w,x+dx*height*.26,y+height,z+dz*height*.26],3));g.setIndex([0,1,2,2,1,0]);g.computeVertexNormals();shape(g,color,[0,0,0]);
}
function detailedTrail(curve,width,steps){
 const positions=[],colors=[],indices=[],cols=12;
 for(let i=0;i<=steps;i++){const t=i/steps,p=curve.getPoint(t),d=curve.getTangent(t),n=new T.Vector3(-d.z,0,d.x).normalize();
  for(let j=0;j<=cols;j++){const u=j/cols*2-1,edge=Math.abs(u),w=width(t)*(1+.1*Math.sin(t*curve.getLength()*2)+.055*Math.sin(i*.7+j*.4));const q=p.clone().addScaledVector(n,u*w*1.22);q.y+=.009+(1-edge)*.006+noise(q.x,q.z)*.007;
   positions.push(q.x,q.y,q.z);const earth=new T.Color('#8b7958').lerp(new T.Color('#536044'),T.MathUtils.smoothstep(edge,.55,1));earth.multiplyScalar(.88+.22*noise(q.x*6,q.z*6));colors.push(earth.r,earth.g,earth.b);
   if(i<steps&&j<cols){const a=i*(cols+1)+j;indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
  }
  if(i%2===0&&t<.85)for(const side of [-1,1]){const q=p.clone().addScaledVector(n,side*width(t)*(1.02+noise(i,side)*.35));for(let k=0;k<3;k++)grassBlade(q.x+k*.055,q.y+.014,q.z,.1+noise(i,k+side)*.2,i+k,['#566d3d','#6a7847','#879060'][k]);}
  if(i%3===0&&t<.65){const q=p.clone().addScaledVector(n,(noise(i,4)-.5)*width(t)*1.6);const r=.018+noise(i,9)*.035;shape(tintGeometry(new T.IcosahedronGeometry(1,0),'#a59a7b',.3),'#ffffff',[q.x,q.y+.02,q.z],[r,r*.4,r*1.3],[0,i,0]);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();shape(g,'#ffffff',[0,0,0]);
}
if (!landing) {
detailedTrail(approach,t=>1.05-.4*t,100);
detailedTrail(departure,t=>.38+.27*Math.exp(-t*9),360);
// Dark banks, cool water and sparse curved streaks suggest a quiet current.
ribbon(stream,t=>.9-.3*t,'#3e5048',-.012);
ribbon(stream,t=>.65-.24*t,'#355e5b');
for(let i=0;i<19;i++) {
  const t=.05+i*.04;
  ribbon(stream,()=>.012,'#64918a',.006,Math.sin(i*2.4)*.35,t,t+.005+(i%3)*.002,9);
  for(const side of [-1,1]) {
    if((i+(side===1?1:0))%3===0)continue;
    const bankT=t+(side===1?.013:0),p=stream.getPoint(bankT),d=stream.getTangent(bankT),normal=new T.Vector3(-d.z,0,d.x).normalize();
    const v=p.clone().addScaledVector(normal,side*(.82-.27*t)),size=.15+(1+Math.sin(i*5+side))*.07;
    if(Math.hypot(v.x-bridgeCenter.x,v.z-bridgeCenter.z)<2.3)continue;
    shape(new T.IcosahedronGeometry(1,0),'#657166',[v.x,.035,v.z],[size,.08,size*1.4],[0,i,0]);
  }
}
}
function branch(a,b,r1,r2,color) {
  const from=new T.Vector3(...a), to=new T.Vector3(...b), direction=to.clone().sub(from);
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.clone().normalize());
  const e=new T.Euler().setFromQuaternion(q);
  cylinder(from.add(to).multiplyScalar(.5).toArray(),r2,r1,direction.length(),color,9,[e.x,e.y,e.z]);
}
// Short timber footbridge: arched planks, two beams and low open handrails.
// Dirt stops at each landing, leaving the stream continuous below the deck.
function deckHeight(u) {return .09+.28*Math.sin(Math.PI*(u+bridgeHalf)/(bridgeHalf*2));}
if (!landing) {
const plankCount=17,plankStep=bridgeHalf*2/plankCount;
for(let i=0;i<plankCount;i++) {
  const u=-bridgeHalf+(i+.5)*plankStep;
  box(bridgePoint(u,0,deckHeight(u)),[plankStep-.012,.09,1.4],wood[i%3],[0,bridgeYaw,0]);
  for(let g=0;g<3;g++){const vv=-.45+g*.4+noise(i,g)*.07;box(bridgePoint(u,vv,deckHeight(u)+.047),[plankStep*.82,.002,.008],g%2?'#b98b56':'#73502f',[0,bridgeYaw,0]);}
  for(const v of [-.48,.48])cylinder(bridgePoint(u,v,deckHeight(u)+.05),.018,.018,.012,'#50422e',6);
}
for(const side of [-1,1]) {
  // Beams follow the same arch as the deck instead of blocking the water.
  for(let i=0;i<12;i++) {
    const a=-bridgeHalf+i*bridgeHalf/6,b=a+bridgeHalf/6;
    branch(bridgePoint(a,side*.49,deckHeight(a)-.085),bridgePoint(b,side*.49,deckHeight(b)-.085),.065,.065,'#61462f');
    branch(bridgePoint(a,side*.72,deckHeight(a)+.55),bridgePoint(b,side*.72,deckHeight(b)+.55),.035,.035,'#865131');
  }
  for(const u of [-1.45,0,1.45]) {
    const y=deckHeight(u),bottom=Math.abs(u)>1?.015:y-.08;
    cylinder(bridgePoint(u,side*.72,(bottom+y+.61)/2),.055,.07,y+.61-bottom,'#61462f',8);
  }
}
}
function foliage(p,r,h,c) {
 const variation=noise(p[0],p[1]+p[2])*6;
 needleMass(p,[r*.65,h*.65,r*.58],[.06,variation,.07],variation,c);
 for(let i=0;i<2;i++){const a=i*Math.PI+variation;needleMass([p[0]+Math.sin(a)*r*.57,p[1]-.12*h,p[2]+Math.cos(a)*r*.57],[r*.48,h*.49,r*.39],[.15,a,.12],variation+i,c);}
}
function tree(x,z,h,r,hero=false) {
  // Keep low boughs out of the far landing, not just the tree trunks.
  if(x>bridgeCenter.x && z<bridgeCenter.z+20 && z>bridgeCenter.z-8 && (nearRoute(x,z,departure,3.6)||x<bridgeCenter.x+20))return;
  const bark=hero?'#6a4932':'#38493c';
  cylinder([x,h*.42,z],r*.48,r,h*.84,bark,12);
  if(hero) {
    // Buttress roots and longitudinal bark ridges.
    for(let i=0;i<8;i++) { const a=i*Math.PI/4; branch([x,.6,z],[x+Math.sin(a)*2.1,.08,z+Math.cos(a)*1.7],.24,.06,bark); }
    for(let i=0;i<11;i++){const a=i*6.28/11;branch([x+Math.sin(a)*r*.9,.3,z+Math.cos(a)*r*.9],[x+Math.sin(a)*r*.5,h*.75,z+Math.cos(a)*r*.5],.035,.025,'#876041');}
  }
  for(let level=0;level<5;level++) {
    const y=h*(.48+level*.115), spread=h*(.29-level*.04);
    foliage([x,y+.35,z],spread,h*.31,hero?pine[level%3]:['#214238','#294c40','#345345'][level%3]);
    if(hero) for(let i=0;i<5;i++) {
      const a=i*1.26+level*.6, bx=x+Math.sin(a)*spread*.7,bz=z+Math.cos(a)*spread*.7;
      branch([x,y-.8,z],[bx,y-.2,bz],.12,.045,bark);
      foliage([bx,y,bz],spread*.55,h*.17,pine[(level+i)%3]);
    }
  }
}
// Closed needle clusters remain solid when viewed from directly underneath.
function needleMass(position, scale, rotation, variation, color) {
  const vertices=[],faces=[],rings=[[-.25,.3],[0,1],[.4,.65],[1.15,.025]],sides=7;
  for(let ring=0;ring<rings.length;ring++)for(let n=0;n<sides;n++) {
    const theta=n*Math.PI*2/sides;
    const radius=rings[ring][1]*(1+.18*Math.sin(n*4+variation));
    vertices.push(Math.cos(theta)*radius,rings[ring][0]+(ring===3?0:.12*Math.sin(n*3+variation)),Math.sin(theta)*radius);
    if(ring<rings.length-1){const k=ring*sides+n,next=ring*sides+(n+1)%sides;faces.push(k,k+sides,next,next,k+sides,next+sides);}
  }
  for(let n=1;n<sides-1;n++){faces.push(0,n,n+1);const top=(rings.length-1)*sides;faces.push(top,top+n+1,top+n);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(faces);g.computeVertexNormals();
  shape(tintGeometry(g,color,.23),'#ffffff',position,scale,rotation);
}
function canopyPine(x,z,h,r,phase) {
  const leanX=(-1-x)*.12,leanZ=(-z)*.12;
  const at=t=>[x+leanX*t*t,h*t,z+leanZ*t*t];
  for(let j=0;j<12;j++)branch(at(j/12),at((j+1)/12),r*(1-j/12)+.045,r*(1-(j+1)/12)+.045,'#435041');
  for(let layer=0;layer<4;layer++) {
    const t=.55+layer*.12,origin=at(t),reach=(5.8-layer*.8)*(h/34);
    for(let arm=0;arm<5;arm++) {
      const a=phase+arm*Math.PI*2/5+layer*.7;
      const end=[origin[0]+Math.sin(a)*reach,origin[1]+1.7,origin[2]+Math.cos(a)*reach];
      branch(origin,end,.18,.025,'#435041');
      for(let k=0;k<4;k++) {
        const u=.4+k*.19;
        const p=[origin[0]+(end[0]-origin[0])*u,origin[1]+1+k*.4,origin[2]+(end[2]-origin[2])*u];
        needleMass(p,[1.7-k*.12,1.2,1.4-k*.1],[.12,a,.1],arm+k+phase,['#31583b','#426d42','#5b8049'][(arm+layer+k)%3]);
      }
    }
  }
}

// Ancient Pine: 29 units in Camp/Solo; 42 for the upward landing composition. Base diameter 4.8.
// The low boughs frame the gathering while the crown continues beyond the viewport.
function ancientPine() {
  const x=-3.6,z=-5.2,h=landing?42:29,r=2.4;
  const bark='#6a4932';
  // One indexed surface: taper, centreline, bark relief and colour are continuous.
  // No stacked cylinders or synchronized horizontal ends to bark strips.
  const positions=[],colors=[],indices=[],sides=128,levels=112;
  const dark=new T.Color('#493b2c'),light=new T.Color('#8a6341');
  for(let j=0;j<=levels;j++) {
    const t=j/levels,y=t*h;
    for(let i=0;i<=sides;i++) {
      const a=(i%sides)*Math.PI*2/sides;
      const ridge=(Math.sin(a*26+.12*Math.sin(y*.33+a*3))+1)/2;
      const rootFlare=.85*Math.pow((1+Math.cos(a*10))/2,5)*Math.exp(-y/1.25);
      const radius=r-(landing?2.25:1.72)*t+.08*Math.sin(a*5+y*.17)+.095*ridge+.022*Math.sin(a*73+y*3.1)+rootFlare;
      positions.push(x+.4*t*t+Math.sin(a)*radius,y,z-.2*t+Math.cos(a)*radius);
      const c=dark.clone().lerp(light,.32+.53*ridge+.08*Math.sin(a*7+y*.23)+.055*Math.sin(y*4+a*39));colors.push(c.r,c.g,c.b);
      if(j<levels && i<sides){const k=j*(sides+1)+i;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
    }
  }
  const trunk=new T.BufferGeometry();trunk.setAttribute('position',new T.Float32BufferAttribute(positions,3));trunk.setAttribute('color',new T.Float32BufferAttribute(colors,3));trunk.setIndex(indices);trunk.computeVertexNormals();
  // Weld the lighting seam of the duplicated circumference vertices as well.
  const normals=trunk.getAttribute('normal');
  for(let j=0;j<=levels;j++){const a=j*(sides+1),b=a+sides,n=new T.Vector3().fromBufferAttribute(normals,a).add(new T.Vector3().fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,n.x,n.y,n.z);normals.setXYZ(b,n.x,n.y,n.z);}
  shape(trunk,'#ffffff',[0,0,0]);
  // Curved, tapered buttress roots flow into the base and leave all seats open.
  for(let i=0;i<10;i++) {
    const a=i*Math.PI/5;
    const start=[x+Math.sin(a)*1.3,2,z+Math.cos(a)*1.3];
    const mid=[x+Math.sin(a+.1)*3.2,.4,z+Math.cos(a+.1)*3];
    const reach=landing && i!==1 && i!==3 ? .7 : 1;
    const end=[x+Math.sin(a+.18)*5.4*reach,.07,z+Math.cos(a+.18)*4.4*reach];
    if(Math.hypot(end[0],end[2])<3.9) { const k=3.9/Math.hypot(end[0],end[2]);end[0]*=k;end[2]*=k; }
    const curve=new T.CatmullRomCurve3([start,mid,end].map(p=>new T.Vector3(...p)));
    const rootGeometry=new T.TubeGeometry(curve,20,1,9,false),vertices=rootGeometry.getAttribute('position');
    for(let j=0;j<=20;j++){const t=j/20,p=curve.getPointAt(t),radius=.65*Math.pow(1-t,1.15)+.025;for(let k=0;k<=9;k++){const index=j*10+k,v=new T.Vector3().fromBufferAttribute(vertices,index).sub(p).multiplyScalar(radius).add(p);vertices.setXYZ(index,v.x,v.y,v.z);}}
    rootGeometry.computeVertexNormals();shape(rootGeometry,bark,[0,0,0]);
  }
  for(let i=0;i<22;i++) {const a=i*2.399,y=1.3+(i%9)*1.3,rr=r-(landing?2.25:1.72)*y/h+.12;const px=x+Math.sin(a)*rr,pz=z+Math.cos(a)*rr;shape(new T.TorusGeometry(.08+(i%3)*.025,.018,5,12),'#493b2c',[px,y,pz],[1,1.7,1],[0,a,0]);}
  for(let i=0;i<18;i++){const a=i*2.399;branch([x+Math.sin(a)*3,.12,z+Math.cos(a)*2.8],[x+Math.sin(a+.13)*4.5,-.005,z+Math.cos(a+.13)*4.1],.055,.009,bark);}
  if (landing) {
    // Separated boughs in depth, with irregular needle masses and open sky gaps.
    // Crown-local coordinates keep the subtle wind pivot attached to the trunk.
    for(let level=0;level<6;level++) {
      const y=18+level*3.7, reach=8.4-level*.8;
      for(let arm=0;arm<5;arm++) {
        const a=arm*Math.PI*2/5+level*.71+.8;
        const length=reach*(.82+.16*Math.sin(arm*3+level));
        const dx=Math.sin(a)*length,dz=Math.cos(a)*length;
        const base=y+.55*Math.sin(arm*2.7);
        const joint=[x+dx*.48,base+.15,z+dz*.48];
        const limbCurve=new T.CatmullRomCurve3([[x,base-.65,z],joint,[x+dx,base+1.15,z+dz]].map(p=>new T.Vector3(...p)));
        const limb=new T.TubeGeometry(limbCurve,10,1,6,false),points=limb.getAttribute('position');
        for(let j=0;j<=10;j++) {const t=j/10,p=limbCurve.getPointAt(t),radius=(.42-level*.035)*(1-t)+.025;
          for(let k=0;k<=6;k++){const n=j*7+k,v=new T.Vector3().fromBufferAttribute(points,n).sub(p).multiplyScalar(radius).add(p);points.setXYZ(n,v.x,v.y,v.z);}}
        limb.computeVertexNormals();shape(limb,bark,[0,0,0]);
        for(let cluster=0;cluster<4;cluster++) {
          const t=.43+cluster*.18;
          const center=[x+dx*t,base+.8+cluster*.23,z+dz*t];
          for(const side of [-1,1]) {
            const spread=(1-t)*1.7+.28;
            const px=center[0]+Math.cos(a)*side*spread,pz=center[2]-Math.sin(a)*side*spread;
            branch(center,[px,center[1]+.3,pz],.065,.018,bark);
            activeBatches=crownBatches;
            needleMass([px,center[1]+.2,pz],[1.7-cluster*.13,1.1,1.3-cluster*.1],[.2*side,a,.15*side],arm+cluster+level,pine[(arm+cluster+level)%3]);
            activeBatches=batches;
          }
        }
      }
    }
    return;
  }
  // A few broad, upward-curving limbs make the trunk feel old and load bearing.
  for(const [dx,dz,base] of [[7.8,1.9,7.3],[-6.4,2.8,8.2],[3,-5,10],[-4,-4,12]]) {
    const joint=[x+dx*.43,base+.4,z+dz*.35];
    branch([x,base-.8,z],joint,.65,.4,bark);
    branch(joint,[x+dx,base+1.5,z+dz],.4,.12,bark);
    for(let j=0;j<5;j++) {
      const t=.38+j*.15;
      foliage([x+dx*t,base+2.4+j*.12,z+dz*t],2.2-j*.12,2.6,pine[j%3]);
    }
  }
  // Huge overlapping tiers form one crown, much larger than the distant forest.
  for(let level=0;level<6;level++) {
    const y=12+level*3.2,spread=8.2-level*1.05;
    foliage([x+.3,y,z],spread,6.5,pine[level%3]);
    for(let i=0;i<6;i++) { const a=i*Math.PI/3+level*.4;foliage([x+Math.sin(a)*spread*.65,y-.5,z+Math.cos(a)*spread*.55],spread*.5,3.8,pine[(i+level)%3]); }
  }
}
ancientPine();
if(landing) {
  // Irregular ring: trunks enter from the borders and converge toward a sky opening.
  for(let i=0;i<11;i++) {
    const a=i*Math.PI*2/11+.2,d=11+(i%3)*3.1;
    canopyPine(-1+Math.sin(a)*d,Math.cos(a)*d,29+(i%4)*3.5,.55+(i%3)*.12,a);
  }
}
if (!landing) for(let i=0;i<27;i++) {
  const a=(i/27)*Math.PI*2;
  const distance=11+(i%4)*2.2;
  const x=Math.sin(a)*distance,z=Math.cos(a)*distance;
  // Open foreground corridor for the camera.
  if(z>4 && x>-7 && x<12)continue;
  if(nearRoute(x,z,trail,1.7)||nearRoute(x,z,stream,1.6))continue;
  tree(x,z,6+random()*4,.24+random()*.14);
}
// Staggered layers continue well past the visible trail; avoid planting in water.
function nearRoute(x,z,curve,margin) {
  for(let i=0;i<=150;i++){const p=curve.getPoint(i/150);if(Math.hypot(x-p.x,z-p.z)<margin)return true;}
  return false;
}
if (!landing) for(let layer=0;layer<4;layer++)for(let i=0;i<15;i++) {
  const x=-32+i*4.6+(random()-.5)*3,z=(landing?-23:-14)-layer*(landing?13:10)-random()*4;
  if(nearRoute(x,z,trail,1.9)||nearRoute(x,z,stream,1.7))continue;
  if(landing && layer===0 && i%3===0)continue;
  tree(x,z,(landing?8:5)+layer*.7+random()*4,.19+random()*.14);
}
// Smaller conifers occupy visible gaps beneath the tall midground canopy.
// Their staggered silhouettes make the orthographic forest read in depth.
if (!landing) for(const [x,z,h] of [[-.5,-10.8,3.8],[-3.3,-16,3.4],[-5,-21,3.8],[2,-15,2.8],[.2,-22,3.5],[6.4,-19,4.2],[-8,-16,4.4]])tree(x,z,h,.13);
// Pebbles, grass and woodland details are deterministic.
if (!landing) for(let i=0;i<145;i++) {
  const a=random()*Math.PI*2,r=4.3+random()*11,x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(nearRoute(x,z,trail,1.1)||nearRoute(x,z,stream,1))continue;
  if(i%3===0)shape(new T.IcosahedronGeometry(1,0),'#657166',[x,.1,z],[.2+random()*.3,.14+random()*.2,.22+random()*.3]);
  for(let k=0;k<7;k++)grassBlade(x+(noise(i,k)-.5)*.3,.025,z+(noise(k,i)-.5)*.3,.12+noise(i,k+9)*.32,k*2.4,['#596c44','#738052','#435d42'][i%3]);
}
if (!landing) for(let i=0;i<24;i++) {
  const a=random()*6.28,r=5+random()*10;
  const x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(nearRoute(x,z,trail,1.8)||nearRoute(x,z,stream,1.6))continue;
  ball([x,.35,z],[.8,.5,.65],pine[i%3]);
}
if(!landing)for(let i=0;i<900;i++){
 const a=i*2.399,r=3.7+noise(i,31)*13,x=Math.sin(a)*r,z=Math.cos(a)*r;
 if(nearRoute(x,z,stream,1.1)||nearRoute(x,z,trail,.7))continue;
 const y=.045+Math.max(0,.045*Math.sin(x*.8)*Math.cos(z*.6));
 if(i%3===0)for(let k=0;k<4;k++)grassBlade(x+k*.02,y,z,.08+noise(i,k)*.1,a+k,['#647846','#7d854a','#516c3e'][i%3]);
 else {const g=new T.PlaneGeometry(.03,.15);g.rotateX(-Math.PI/2);shape(g,i%2?'#9a8353':'#6e6941',[x,y,z],[1,1,1],[0,a,0]);}
}
if(!landing)for(let i=0;i<650;i++){
 const a=i*2.399,r=4+noise(i,17)*21,x=Math.sin(a)*r,z=Math.cos(a)*r;
 if(nearRoute(x,z,stream,1)||Math.hypot(x+3.6,z+5.2)<2.6)continue;
 if(i%5===0){branch([x,.025,z],[x+.16,.03,z+.12],.012,.007,'#706044');}
 else {const g=new T.IcosahedronGeometry(1,0);shape(tintGeometry(g,i%3?'#74775a':'#9b8460',.35),'#ffffff',[x,.025,z],[.025+noise(i,2)*.05,.012,.015],[0,a,0]);}
}
if (!solo) {
// Stone-ringed fire on earth, with split logs and ember bed.
cylinder([0,.08,0],.76,.8,.12,'#332c26',24);
for(let i=0;i<13;i++){const a=i*6.28/13;shape(new T.IcosahedronGeometry(1,1),['#7a796a','#96917a','#666d60'][i%3],[Math.sin(a)*.9,.19,Math.cos(a)*.9],[.27,.22,.22],[0,a,0]);}
for(let i=0;i<5;i++){const a=i*1.26;branch([Math.sin(a)*.55,.22,Math.cos(a)*.55],[-Math.sin(a)*.3,.52,-Math.cos(a)*.3],.12,.09,'#5a3825');}
for(let i=0;i<12;i++)ball([(random()-.5)*.95,.16,(random()-.5)*.95],[.09,.035,.08],'#b96530');
// Eight seats around the fire. Round log ends, bark, small blankets.
for(let i=0;i<8;i++) {
  const a=i*Math.PI/4,x=Math.sin(a)*2.8,z=Math.cos(a)*2.8;
  cylinder([x,.3,z],.4,.46,.6,'#61462f',14);
  cylinder([x,.61,z],.38,.38,.035,'#b28d59',20);
  ring([x,.632,z],.26,.012,'#8f6b44');ring([x,.633,z],.14,.01,'#8f6b44');
  if(i%3===0)box([x,.65,z],[.6,.025,.49],['#69795c','#a87b51','#617e78'][i%3],[0,a,0]);
}
// Personal objects and lanterns kept low to leave the gathering unobstructed.
for(const [x,z] of [[-2.1,1.6],[2.25,-1.4],[-3.3,-1]]) {
  cylinder([x,.15,z],.11,.09,.22,'#b4b49b');ring([x+.11,.16,z],.07,.02,'#b4b49b',[0,0,0]);
}
box([-3.5,.32,.6],[.48,.6,.34],'#8c7952',[0,.3,0]);
box([-3.4,.3,.8],[.28,.3,.08],'#ba9a66',[0,.3,0]);
ring([-3.5,.67,.6],.12,.028,'#513f2c',[0,0,0]);
box([2.8,.09,1.5],[.55,.08,.4],'#899776',[0,.3,0]);
for(const [x,z] of [[-4.8,-1],[4.3,2.2]]) {
  cylinder([x,.15,z],.19,.22,.12,'#50422e');
  cylinder([x,.4,z],.13,.13,.42,'#d6a967',12);
  for(let k=0;k<4;k++){const a=k*Math.PI/2;cylinder([x+Math.sin(a)*.13,.4,z+Math.cos(a)*.13],.012,.012,.43,'#50422e',5);}cylinder([x,.67,z],.12,.19,.09,'#715535',12);
  cylinder([x,.65,z],.23,.15,.12,'#50422e');
  ring([x,.82,z],.13,.025,'#50422e',[0,0,0]);
}
// Resting place for Marten among roots.
ball([-2.7,.12,-2],[.63,.15,.43],'#87916b');
for(let i=0;i<6;i++){const x=-4.6+i*.19,z=-1.6+Math.sin(i)*.2;cylinder([x,.16,z],.03,.04,.27,'#b7ac81',6);ball([x,.3,z],[.11,.05,.1],'#b98c52');}

} else if (!landing) {
  // A quiet resting spot between the buttress roots, without furniture.
  ball([-2.1,.015,-1.9],[1.55,.04,1.2],'#435d42');
  const x=-.6,z=-1.45;
  cylinder([x,.15,z],.19,.22,.12,'#50422e');cylinder([x,.4,z],.13,.13,.42,'#d6a967',12);
  for(let k=0;k<4;k++){const a=k*Math.PI/2;cylinder([x+Math.sin(a)*.13,.4,z+Math.cos(a)*.13],.012,.012,.43,'#50422e',5);}cylinder([x,.67,z],.12,.19,.09,'#715535',12);cylinder([x,.65,z],.23,.15,.12,'#50422e');ring([x,.82,z],.13,.025,'#50422e',[0,0,0]);

}

const crown = new T.Group(); crown.name="pine-crown"; crown.position.set(-3.6,18,-5.2);
if(landing)root.add(crown);
for(const [mat, geometries] of [...batches,...crownBatches]) {
  // Reuse identical vertices while retaining distinct normals/colours at hard edges.
  const unindexed = mergeGeometries(geometries);
  const merged = mergeVertices(unindexed, 1e-6);
  unindexed.dispose();
  const isCrown = crownBatches.get(mat)===geometries;
  if(isCrown)merged.translate(3.6,-18,5.2);
  const mesh = new T.Mesh(merged,mat); mesh.name=`forest-${mat.color.getHexString()}`;
  mesh.castShadow=true; mesh.receiveShadow=true; (isCrown ? crown : root).add(mesh);
  geometries.forEach(g=>g.dispose());
}
root.name=landing?'Pyneath — ancient Pine':solo?'Pyneath — solo resting place':'Pyneath — forest clearing';
const data=await new GLTFExporter().parseAsync(root,{binary:true});
const assetFolder = new URL(landing?'../public/landing/':solo?'../public/solo/':'../public/camp/',import.meta.url);
await mkdir(assetFolder,{recursive:true});
await writeFile(new URL(landing?'pine-landing.glb':solo?'pine-solo.glb':'pine-camp.glb',assetFolder),Buffer.from(data));
console.log(`Pyneath ${landing?'Landing':solo?'Solo':'Camp'}: ${root.children.length} material batches, ${(data.byteLength/1024).toFixed(0)} KiB`);
