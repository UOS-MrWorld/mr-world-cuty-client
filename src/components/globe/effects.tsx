import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GlobeMood } from '../../types/landing'

interface Props {
  mood: GlobeMood
  paused: boolean
  reducedMotion: boolean
  visible: boolean
}

interface EffectPreset {
  particleColor: string
  sparkleColor: string
  lightColor: string
  rimColor: string
  haloColor: string
  particleScaleY: number
  drift: number
}

/** One art-directed atmosphere system for all theme-specific R3F effects. */
export const globeEffectPresets: Record<GlobeMood, EffectPreset> = {
  honeymoon: {
    particleColor: '#f3b9ad', sparkleColor: '#fff0df', lightColor: '#ffd3c2',
    rimColor: '#ffd8e6', haloColor: '#f4c8b9', particleScaleY: .38, drift: .044,
  },
  family: {
    particleColor: '#f6e6bf', sparkleColor: '#fff8df', lightColor: '#f4d9a3',
    rimColor: '#dcefcf', haloColor: '#d8e9c8', particleScaleY: .82, drift: .032,
  },
  golf: {
    particleColor: '#f0e5c4', sparkleColor: '#f8f1d5', lightColor: '#d7e6a8',
    rimColor: '#cde6d5', haloColor: '#d9e8b8', particleScaleY: .68, drift: .027,
  },
  trekking: {
    particleColor: '#e6f1ed', sparkleColor: '#f5fbff', lightColor: '#cfe6ed',
    rimColor: '#c7e6f3', haloColor: '#c8e1e4', particleScaleY: 1, drift: .024,
  },
}

const particleCount = 68
const sparkleCount = 16
const particleSeeds = Array.from({ length: particleCount }, (_, i) => ({
  angle: i * 2.39996,
  radius: .34 + ((i * 31) % 83) / 83 * 1.76,
  y: .22 + ((i * 17) % particleCount) / particleCount * 3.47,
  speed: .029 + i % 6 * .007,
  scale: .68 + (i % 5) * .12,
}))
const sparkleSeeds = Array.from({ length: sparkleCount }, (_, i) => ({
  angle: i * 2.39996 + .4,
  y: .62 + ((i * 37) % sparkleCount) / sparkleCount * 2.72,
  phase: i * .83,
  radius: 1.45 + (i % 4) * .17,
}))

const rimVertexShader = /* glsl */`
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const rimFragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = abs(dot(normalize(vWorldNormal), viewDirection));
    float fresnel = pow(1.0 - facing, 2.35);
    float ribbon = sin(vUv.y * 17.0 + vUv.x * 4.0 - uTime * .32) * .5 + .5;
    ribbon = pow(ribbon, 18.0) * smoothstep(.12, .48, vUv.y) * smoothstep(.96, .58, vUv.y);
    float crown = pow(smoothstep(.62, .98, vUv.y), 4.0) * .08;
    float alpha = (fresnel * .24 + ribbon * .055 + crown) * uIntensity;
    vec3 color = uColor * (1.05 + fresnel * .55) + vec3(.20, .32, .38) * ribbon;
    gl_FragColor = vec4(color, alpha);
  }
`

const causticVertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const causticFragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - .5;
    float radius = length(center) * 2.0;
    float ringA = pow(.5 + .5 * sin(radius * 34.0 - uTime * .55), 8.0);
    float ringB = pow(.5 + .5 * sin(radius * 21.0 + uTime * .32), 12.0);
    float mask = smoothstep(1.0, .18, radius) * smoothstep(.08, .34, radius);
    float alpha = (ringA * .038 + ringB * .026) * mask * uIntensity;
    gl_FragColor = vec4(uColor, alpha);
  }
`

/**
 * R3F owns every declarative geometry and material here, including disposal.
 * Future globe effects should join this single demand-rendered scene instead of
 * creating another Canvas or animation loop.
 */
export function GlobeEffects({ mood, paused, reducedMotion, visible }: Props) {
  const particles = useRef<THREE.InstancedMesh>(null)
  const sparkles = useRef<THREE.InstancedMesh>(null)
  const particleMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const sparkleMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const moodLight = useRef<THREE.PointLight>(null)
  const halo = useRef<THREE.Mesh>(null)
  const haloMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const rimMaterial = useRef<THREE.ShaderMaterial>(null)
  const causticMaterial = useRef<THREE.ShaderMaterial>(null)
  const clock = useRef({ time: 0, transition: 1, mood })
  const pivot = useMemo(() => new THREE.Object3D(), [])
  const targetParticleColor = useMemo(() => new THREE.Color(), [])
  const targetSparkleColor = useMemo(() => new THREE.Color(), [])
  const targetLightColor = useMemo(() => new THREE.Color(), [])
  const targetRimColor = useMemo(() => new THREE.Color(), [])
  const targetHaloColor = useMemo(() => new THREE.Color(), [])
  const preset = globeEffectPresets[mood]

  useEffect(() => {
    if (clock.current.mood === mood) return
    clock.current.mood = mood
    clock.current.transition = reducedMotion ? 0 : 1
  }, [mood, reducedMotion])

  useFrame((_, delta) => {
    const particleMesh = particles.current
    const sparkleMesh = sparkles.current
    const particlesMat = particleMaterial.current
    const sparklesMat = sparkleMaterial.current
    const light = moodLight.current
    const haloMesh = halo.current
    const haloMat = haloMaterial.current
    const rim = rimMaterial.current
    const caustic = causticMaterial.current
    if (!particleMesh || !sparkleMesh || !particlesMat || !sparklesMat || !light || !haloMesh || !haloMat || !rim || !caustic || !visible || document.hidden) return

    const state = clock.current
    const dt = Math.min(delta, 1 / 20)
    if (!paused && !reducedMotion) {
      state.time += dt
      state.transition = Math.max(0, state.transition - dt * .72)
    }

    particleSeeds.forEach((seed, i) => {
      const angle = seed.angle + state.time * preset.drift
      const falling = ((seed.y - .22 - state.time * seed.speed) % 3.47 + 3.47) % 3.47
      const y = Math.min(3.92, .22 + falling)
      const radius = Math.min(seed.radius, Math.sqrt(Math.max(.05, 2.35 ** 2 - (y - 1.6) ** 2)))
      pivot.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
      const pulse = seed.scale * (1 + Math.sin(state.time * 1.2 + i) * .08)
      pivot.scale.set(pulse, pulse * preset.particleScaleY, pulse)
      pivot.rotation.set(0, angle, 0)
      pivot.updateMatrix()
      particleMesh.setMatrixAt(i, pivot.matrix)
    })
    particleMesh.instanceMatrix.needsUpdate = true

    sparkleSeeds.forEach((seed, i) => {
      const angle = seed.angle + state.time * .018
      const radius = Math.min(seed.radius, Math.sqrt(Math.max(.08, 2.34 ** 2 - (seed.y - 1.6) ** 2)))
      pivot.position.set(Math.cos(angle) * radius, seed.y, Math.sin(angle) * radius)
      const pulse = .46 + Math.max(0, Math.sin(state.time * .95 + seed.phase)) * .72 + state.transition * .38
      pivot.scale.setScalar(pulse)
      pivot.rotation.set(state.time * .2 + seed.phase, angle, -state.time * .17)
      pivot.updateMatrix()
      sparkleMesh.setMatrixAt(i, pivot.matrix)
    })
    sparkleMesh.instanceMatrix.needsUpdate = true

    targetParticleColor.set(preset.particleColor)
    targetSparkleColor.set(preset.sparkleColor)
    targetLightColor.set(preset.lightColor)
    targetRimColor.set(preset.rimColor)
    targetHaloColor.set(preset.haloColor)
    const colorMix = reducedMotion ? 1 : .055
    particlesMat.color.lerp(targetParticleColor, colorMix)
    sparklesMat.color.lerp(targetSparkleColor, colorMix)
    light.color.lerp(targetLightColor, colorMix)
    haloMat.color.lerp(targetHaloColor, colorMix)
    ;(rim.uniforms.uColor.value as THREE.Color).lerp(targetRimColor, colorMix)
    ;(caustic.uniforms.uColor.value as THREE.Color).lerp(targetRimColor, colorMix)

    const motionIntensity = reducedMotion || paused ? .72 : 1
    rim.uniforms.uTime.value = state.time
    rim.uniforms.uIntensity.value = motionIntensity * .82 + state.transition * .24
    caustic.uniforms.uTime.value = state.time
    caustic.uniforms.uIntensity.value = motionIntensity
    light.intensity = reducedMotion || paused
      ? .22
      : .25 + Math.sin(state.time * .72) * .035 + state.transition * .12
    haloMat.opacity = .055 + Math.sin(state.time * .42) * .009 + state.transition * .018
    haloMesh.scale.setScalar(1 + Math.sin(state.time * .31) * .012 + state.transition * .025)
  })

  return <group name="CUTY cinematic atmosphere">
    <mesh ref={halo} position={[0, 1.48, -1.72]} renderOrder={-2}>
      <circleGeometry args={[2.92, 64]} />
      <meshBasicMaterial ref={haloMaterial} color={preset.haloColor} transparent opacity={.06} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>

    <instancedMesh ref={particles} args={[undefined, undefined, particleCount]} frustumCulled={false}>
      <sphereGeometry args={[.014, 7, 5]} />
      <meshStandardMaterial ref={particleMaterial} color={preset.particleColor} roughness={.64} emissive={preset.particleColor} emissiveIntensity={.08} transparent opacity={.82} depthWrite={false} />
    </instancedMesh>

    <instancedMesh ref={sparkles} args={[undefined, undefined, sparkleCount]} frustumCulled={false} renderOrder={8}>
      <octahedronGeometry args={[.026, 0]} />
      <meshBasicMaterial ref={sparkleMaterial} color={preset.sparkleColor} transparent opacity={.72} depthWrite={false} blending={THREE.AdditiveBlending} />
    </instancedMesh>

    <mesh position={[0, 1.6, 0]} renderOrder={12}>
      <sphereGeometry args={[2.625, 72, 48, 0, Math.PI * 2, 0, 2.57]} />
      <shaderMaterial
        ref={rimMaterial}
        uniforms={{ uTime: { value: 0 }, uIntensity: { value: 1 }, uColor: { value: new THREE.Color(preset.rimColor) } }}
        vertexShader={rimVertexShader}
        fragmentShader={rimFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>

    <mesh position={[0, -.425, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={9}>
      <circleGeometry args={[1.74, 64]} />
      <shaderMaterial
        ref={causticMaterial}
        uniforms={{ uTime: { value: 0 }, uIntensity: { value: 1 }, uColor: { value: new THREE.Color(preset.rimColor) } }}
        vertexShader={causticVertexShader}
        fragmentShader={causticFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>

    <pointLight ref={moodLight} position={[-1.4, 3.05, 1.85]} color={preset.lightColor} intensity={.25} distance={6.2} decay={2} />
  </group>
}
