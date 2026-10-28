import {BufferGeometry,Float32BufferAttribute} from 'three';
export function createMartenFurTuft(){
 const points:number[]=[],indices:number[]=[],sides=5;
 for(let j=0;j<4;j++){const y=[0,.3,.7,1][j],r=[.16,.36,.25,.012][j],bend=y*y*.35;for(let k=0;k<=sides;k++){const a=k*Math.PI*2/sides;points.push(Math.cos(a)*r+bend,y,Math.sin(a)*r);if(j<3&&k<sides){const i=j*(sides+1)+k;indices.push(i,i+sides+1,i+1,i+1,i+sides+1,i+sides+2);}}}
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
