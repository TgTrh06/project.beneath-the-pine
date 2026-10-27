// Original forest Camp geometry. Run: node apps/web/scripts/build-camp-scene.mjs
// Deterministic, locally authored assets; no downloaded models or textures.
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { mkdir, writeFile } from 'node:fs/promises';
const solo = process.argv.includes('--solo');

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.(); }); }
};
const root = new T.Group();
const batches = new Map();
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
  g.applyMatrix4(transform);
  if (!batches.has(mat)) batches.set(mat, []);
  batches.get(mat).push(g);
  geometry.dispose();
}
const box = (p,s,c,r) => shape(new T.BoxGeometry(1,1,1),c,p,s,r);
const cylinder = (p,rt,rb,h,c,segments=16,r=[0,0,0]) => shape(new T.CylinderGeometry(rt,rb,h,segments),c,p,[1,1,1],r);
const ball = (p,s,c) => shape(new T.SphereGeometry(1,12,8),c,p,s);
const ring = (p,r,t,c,rot=[Math.PI/2,0,0]) => shape(new T.TorusGeometry(r,t,6,32),c,p,[1,1,1],rot);
const wood = ['#865131','#945e39','#a66c42','#9c6039','#b07949'];
const pine = ['#244638','#315540','#41634a'];
let seed=17;
function random() { seed=(seed*16807)%2147483647; return (seed-1)/2147483646; }

// The forest extends past the viewport. No platform or miniature base.
cylinder([0,-.22,0],110,110,.4,'#263e35',96);
if (!solo) {
  ball([0,-.1,0],[5.2,.18,4.6],'#716447');
  ball([.4,-.09,.1],[4.45,.17,3.8],'#807053');
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
ribbon(approach,t=>1.05-.4*t,'#645d44',0,0,0,1,60);
ribbon(departure,t=>.38+.27*Math.exp(-t*9),'#645d44');
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
function branch(a,b,r1,r2,color) {
  const from=new T.Vector3(...a), to=new T.Vector3(...b), direction=to.clone().sub(from);
  const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.clone().normalize());
  const e=new T.Euler().setFromQuaternion(q);
  cylinder(from.add(to).multiplyScalar(.5).toArray(),r2,r1,direction.length(),color,9,[e.x,e.y,e.z]);
}
// Short timber footbridge: arched planks, two beams and low open handrails.
// Dirt stops at each landing, leaving the stream continuous below the deck.
function deckHeight(u) {return .09+.28*Math.sin(Math.PI*(u+bridgeHalf)/(bridgeHalf*2));}
const plankCount=17,plankStep=bridgeHalf*2/plankCount;
for(let i=0;i<plankCount;i++) {
  const u=-bridgeHalf+(i+.5)*plankStep;
  box(bridgePoint(u,0,deckHeight(u)),[plankStep-.012,.09,1.4],wood[i%3],[0,bridgeYaw,0]);
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
function foliage(p,r,h,c) {
  shape(new T.ConeGeometry(r,h,9),c,p,[1,1,.85],[0,random()*6,0]);
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
// Ancient Pine: 29 units tall, 4.8-unit base diameter. People remain 1.7 units tall.
// The low boughs frame the gathering while the crown continues beyond the viewport.
function ancientPine() {
  const x=-3.6,z=-5.2,h=29,r=2.4;
  const bark='#6a4932';
  // One indexed surface: taper, centreline, bark relief and colour are continuous.
  // No stacked cylinders or synchronized horizontal ends to bark strips.
  const positions=[],colors=[],indices=[],sides=104,levels=64;
  const dark=new T.Color('#493b2c'),light=new T.Color('#8a6341');
  for(let j=0;j<=levels;j++) {
    const t=j/levels,y=t*h;
    for(let i=0;i<=sides;i++) {
      const a=(i%sides)*Math.PI*2/sides;
      const ridge=(Math.sin(a*26+.12*Math.sin(y*.33+a*3))+1)/2;
      const rootFlare=.85*Math.pow((1+Math.cos(a*10))/2,5)*Math.exp(-y/1.25);
      const radius=r-1.72*t+.08*Math.sin(a*5+y*.17)+.095*ridge+rootFlare;
      positions.push(x+.4*t*t+Math.sin(a)*radius,y,z-.2*t+Math.cos(a)*radius);
      const c=dark.clone().lerp(light,.32+.53*ridge+.08*Math.sin(a*7+y*.23));colors.push(c.r,c.g,c.b);
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
    const end=[x+Math.sin(a+.18)*5.4,.07,z+Math.cos(a+.18)*4.4];
    if(Math.hypot(end[0],end[2])<3.9) { const k=3.9/Math.hypot(end[0],end[2]);end[0]*=k;end[2]*=k; }
    const curve=new T.CatmullRomCurve3([start,mid,end].map(p=>new T.Vector3(...p)));
    const rootGeometry=new T.TubeGeometry(curve,20,1,9,false),vertices=rootGeometry.getAttribute('position');
    for(let j=0;j<=20;j++){const t=j/20,p=curve.getPointAt(t),radius=.65*Math.pow(1-t,1.15)+.025;for(let k=0;k<=9;k++){const index=j*10+k,v=new T.Vector3().fromBufferAttribute(vertices,index).sub(p).multiplyScalar(radius).add(p);vertices.setXYZ(index,v.x,v.y,v.z);}}
    rootGeometry.computeVertexNormals();shape(rootGeometry,bark,[0,0,0]);
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
for(let i=0;i<27;i++) {
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
for(let layer=0;layer<4;layer++)for(let i=0;i<15;i++) {
  const x=-32+i*4.6+(random()-.5)*3,z=-14-layer*10-random()*4;
  if(nearRoute(x,z,trail,1.9)||nearRoute(x,z,stream,1.7))continue;
  tree(x,z,5+layer*.7+random()*4,.19+random()*.14);
}
// Smaller conifers occupy visible gaps beneath the tall midground canopy.
// Their staggered silhouettes make the orthographic forest read in depth.
for(const [x,z,h] of [[-.5,-10.8,3.8],[-3.3,-16,3.4],[-5,-21,3.8],[2,-15,2.8],[.2,-22,3.5],[6.4,-19,4.2],[-8,-16,4.4]])tree(x,z,h,.13);
// Pebbles, grass and woodland details are deterministic.
for(let i=0;i<145;i++) {
  const a=random()*Math.PI*2,r=4.3+random()*11,x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(nearRoute(x,z,trail,1.1)||nearRoute(x,z,stream,1))continue;
  if(i%3===0)shape(new T.IcosahedronGeometry(1,0),'#657166',[x,.1,z],[.2+random()*.3,.14+random()*.2,.22+random()*.3]);
  for(let k=0;k<3;k++)shape(new T.ConeGeometry(.045,.3+random()*.23,3),['#596c44','#738052','#435d42'][i%3],[x+k*.08,.18,z],[1,1,1],[.15,random()*6,.18]);
}
for(let i=0;i<24;i++) {
  const a=random()*6.28,r=5+random()*10;
  const x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(nearRoute(x,z,trail,1.8)||nearRoute(x,z,stream,1.6))continue;
  ball([x,.35,z],[.8,.5,.65],pine[i%3]);
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
  cylinder([x,.4,z],.13,.13,.42,'#d6a967',8);
  cylinder([x,.65,z],.23,.15,.12,'#50422e');
  ring([x,.82,z],.13,.025,'#50422e',[0,0,0]);
}
// Resting place for Marten among roots.
ball([-2.7,.12,-2],[.63,.15,.43],'#87916b');
for(let i=0;i<6;i++){const x=-4.6+i*.19,z=-1.6+Math.sin(i)*.2;cylinder([x,.16,z],.03,.04,.27,'#b7ac81',6);ball([x,.3,z],[.11,.05,.1],'#b98c52');}

} else {
  // A quiet resting spot between the buttress roots, without furniture.
  ball([-2.1,.015,-1.9],[1.55,.04,1.2],'#435d42');
  const x=-.6,z=-1.45;
  cylinder([x,.15,z],.19,.22,.12,'#50422e');cylinder([x,.4,z],.13,.13,.42,'#d6a967',8);cylinder([x,.65,z],.23,.15,.12,'#50422e');ring([x,.82,z],.13,.025,'#50422e',[0,0,0]);

}

for(const [mat, geometries] of batches) {
  // Reuse identical vertices while retaining distinct normals/colours at hard edges.
  const unindexed = mergeGeometries(geometries);
  const merged = mergeVertices(unindexed, 1e-6);
  unindexed.dispose();
  const mesh = new T.Mesh(merged,mat); mesh.name=`forest-${mat.color.getHexString()}`;
  mesh.castShadow=true; mesh.receiveShadow=true; root.add(mesh);
  geometries.forEach(g=>g.dispose());
}
root.name=solo?'Pyneath — solo resting place':'Pyneath — forest clearing';
const data=await new GLTFExporter().parseAsync(root,{binary:true});
const assetFolder = new URL(solo?'../public/solo/':'../public/camp/',import.meta.url);
await mkdir(assetFolder,{recursive:true});
await writeFile(new URL(solo?'pine-solo.glb':'pine-camp.glb',assetFolder),Buffer.from(data));
console.log(`Pyneath ${solo?'Solo':'Camp'}: ${root.children.length} material batches, ${(data.byteLength/1024).toFixed(0)} KiB`);
