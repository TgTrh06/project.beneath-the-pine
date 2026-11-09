import { MeshDepthMaterial, MeshStandardMaterial, RGBADepthPacking } from 'three';

// Deform the existing vertex-coloured needles/grass. Brown bark and the ground stay rooted.
export function livingMaterial(material: MeshStandardMaterial) {
  const uniforms = { forestTime:{value:0}, forestWind:{value:0}, forestStrength:{value:0}, forestTint:{value:material.color.clone()}, forestWater:{value:material.color.getHexString()==='355e5b'?1:0} };
  const declarations = `uniform float forestTime; uniform float forestWind; uniform float forestStrength; uniform vec3 forestTint; uniform float forestWater; varying vec3 forestWorld;`;
  const deformation = `
    vec3 forestColour = forestTint;
    #ifdef USE_COLOR
      forestColour *= color;
    #endif
    float green = step(forestColour.r * 1.12, forestColour.g) * step(forestColour.b * 1.1, forestColour.g);
    float anchor = smoothstep(0.06, 0.8, position.y);
    float gust = sin(forestTime * 0.7 + position.x * 0.5 + position.z * 0.31);
    float flutter = sin(forestTime * 1.7 + position.x * 2.3 + position.z * 1.1) * 0.25;
    float sway = green * anchor * forestStrength * forestWind * (gust + flutter);
    transformed.x += sway * (0.035 + min(max(position.y, 0.0), 15.0) * 0.006);
    transformed.z += sway * 0.04;
    transformed.y += forestWater * forestStrength * sin(position.z * 3.0 + forestTime) * 0.002;
    forestWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
  `;
  const vertex = (source:string) => source.replace('#include <common>',`#include <common>\n${declarations}`).replace('#include <begin_vertex>',`#include <begin_vertex>\n${deformation}`);
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = (shader,renderer) => {
    previous.call(material,shader,renderer);Object.assign(shader.uniforms,uniforms);shader.vertexShader=vertex(shader.vertexShader);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\n${declarations}`).replace('#include <dithering_fragment>',`
      float canopyShade = sin(forestWorld.x * 0.8 + forestTime * 0.045 + sin(forestWorld.z * 0.63)) * sin(forestWorld.z * 0.57 - forestTime * 0.033);
      float lowGround = 1.0 - smoothstep(3.0, 9.0, forestWorld.y);
      float current = sin(forestWorld.z * 18.0 + forestWorld.x * 7.0 + forestTime * 1.4);
      gl_FragColor.rgb *= 1.0 + forestStrength * (canopyShade * 0.045 * lowGround + forestWater * current * 0.035);
      #include <dithering_fragment>
    `);
  };
  material.customProgramCacheKey = () => 'pyneath-session-living-forest-v1';
  material.needsUpdate=true;
  const depth = new MeshDepthMaterial({depthPacking:RGBADepthPacking});
  // GLTFLoader declares vertex colour only on materials that use it.
  if(material.vertexColors)depth.defines={...depth.defines,USE_COLOR:''};
  depth.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader=vertex(shader.vertexShader);};
  depth.customProgramCacheKey=()=>`pyneath-session-depth-${material.vertexColors}`;
  return {uniforms,depth};
}
