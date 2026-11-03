import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, Color, ShaderMaterial, Vector3 } from 'three';
import { canopySkyPalette, canopySunDirection } from '../camps/scene/canopySky';
import type { DayPhase, Weather } from '../camps/scene/environment';

const vertexShader = `
  varying vec3 direction;
  void main() {
    direction = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  varying vec3 direction;
  uniform vec3 zenith, horizon, cloud, shade, sun, sunDirection;
  uniform float coverage, sunVisibility, time;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1.)), f.x), f.y);
  }
  float cloudNoise(vec2 p) {
    float value = 0., amplitude = .52;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p); p = p * 2.03 + vec2(7.1, 3.7); amplitude *= .48;
    }
    return value;
  }
  void main() {
    vec3 ray = normalize(direction);
    vec3 sky = mix(horizon, zenith, smoothstep(.05, .98, ray.y));
    // Distant cloud layer: rounded density edges, brighter tops and shaded bellies.
    vec2 p = ray.xz / max(ray.y + .3, .15) * 6. + vec2(2.8 + time * .012, 4.3);
    float density = cloudNoise(p);
    float alpha = smoothstep(coverage - .05, coverage + .13, density) * smoothstep(0., .25, ray.y);
    float light = clamp(.65 + (cloudNoise(p + vec2(.12, -.09)) - density) * 5., 0., 1.);
    // A small cumulus bank beside the sun also remains visible in the portrait crop.
    vec2 c = ray.xz - vec2(sin(time * .018) * .04, 0.);
    float puff = min(length((c - vec2(-.10, .12)) / vec2(.06, .032)), length((c - vec2(-.07, .14)) / vec2(.042, .045)));
    puff = min(puff, length((c - vec2(-.03, .12)) / vec2(.046, .027)));
    float bank = (1. - smoothstep(.7, 1.15, puff)) * smoothstep(.5, .8, ray.y);
    light = mix(light, .9, bank);
    alpha = max(alpha, bank);
    float facing = clamp(dot(ray, sunDirection), -1., 1.);
    float angle = acos(facing);
    float disc = 1. - smoothstep(.018, .024, angle);
    float halo = exp(-angle * angle / .006) * .38;
    sky = mix(sky, sun, clamp((disc + halo) * sunVisibility, 0., 1.));
    gl_FragColor = vec4(mix(sky, mix(shade, cloud, light), alpha), 1.);
    #include <colorspace_fragment>
  }
`;

export function LandingSky({ phase, weather, animate }: { phase: DayPhase; weather: Weather; animate: boolean }) {
  const invalidate = useThree(state => state.invalidate);
  const material = useRef<ShaderMaterial>(null);
  const initialized = useRef(false);
  const target = useMemo(() => {
    const p = canopySkyPalette(phase, weather);
    return { ...p, zenith: new Color(p.zenith), horizon: new Color(p.horizon), cloud: new Color(p.cloud), shade: new Color(p.shade), sun: new Color(p.sun) };
  }, [phase, weather]);
  const uniforms = useMemo(() => ({
    zenith: { value: new Color() }, horizon: { value: new Color() }, cloud: { value: new Color() }, shade: { value: new Color() }, sun: { value: new Color() },
    sunDirection: { value: new Vector3(...canopySunDirection).normalize() }, coverage: { value: .54 }, sunVisibility: { value: 1 }, time: { value: 0 },
  }), []);
  function apply(amount: number) {
    const values = material.current?.uniforms;
    if (!values) return;
    for (const key of ['zenith', 'horizon', 'cloud', 'shade', 'sun'] as const) values[key].value.lerp(target[key], amount);
    values.coverage.value += (target.coverage - values.coverage.value) * amount;
    values.sunVisibility.value += (target.sunVisibility - values.sunVisibility.value) * amount;
  }
  useEffect(() => {
    if (!animate || !initialized.current) apply(1);
    initialized.current = true; invalidate();
  }, [target, animate, invalidate]);
  useFrame((_, delta) => {
    if (!animate || !material.current) return;
    const dt = Math.min(delta, .1);
    material.current.uniforms.time.value += dt; apply(1 - Math.exp(-dt * .65));
  });
  // The dome is behind all tree geometry. Normal depth testing lets leaves occlude it.
  return <mesh renderOrder={-10}>
    <sphereGeometry args={[140, 32, 16]} />
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} side={BackSide} depthWrite={false} toneMapped={false} fog={false} />
  </mesh>;
}
