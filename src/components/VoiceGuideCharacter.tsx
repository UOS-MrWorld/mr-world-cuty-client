import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// 음성 예약 안내 캐릭터 "큐티": 헤드셋을 쓴 버추얼 아이돌 스타일 여행 가이드(오리지널 캐릭터).
// 애니메이션 느낌을 위해 툰 셰이딩을 쓰고, speaking이면 입·팔이 움직이고 listening이면 헤드셋 불빛이 켜진다.

const c = {
  skin: '#fff1ea',
  hair: '#c8b6ff',
  hairLight: '#e4dbff',
  hairDeep: '#a48df0',
  eyeLine: '#2b1d47',
  iris: '#ff5fa2',
  irisDeep: '#b8236a',
  blouse: '#ffffff',
  collar: '#8f7bff',
  ribbon: '#ff4f8b',
  skirt: '#ff8cc6',
  frill: '#ffffff',
  sock: '#5b4b8a',
  shoe: '#ff6fae',
  headset: '#f5f7ff',
  headsetDark: '#3a3f55',
  light: '#7ef0ff',
  cheek: '#ff9fb8',
  mouth: '#e0607f',
}

// 머리카락: 위는 밝고 아래로 갈수록 진해지는 세로 그라데이션
function makeHairTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 8
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 128)
  g.addColorStop(0, '#f1ebff')
  g.addColorStop(0.35, c.hair)
  g.addColorStop(1, '#8f74e8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// 볼 홍조: 가운데가 진하고 가장자리로 갈수록 투명해지는 원형 그라데이션
function makeBlushTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(255, 120, 150, 0.6)')
  g.addColorStop(0.55, 'rgba(255, 140, 165, 0.28)')
  g.addColorStop(1, 'rgba(255, 160, 180, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// 얼굴: 동글동글한 얼굴(아래쪽만 아주 살짝 좁아짐), 한 덩어리라 매끈함
function makeFaceGeometry() {
  const geometry = new THREE.SphereGeometry(0.6, 64, 64)
  const pos = geometry.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const t = Math.max(0, -v.y / 0.6) // 0(가운데) → 1(턱 끝)
    let sx = 0.92 * (1 - 0.16 * Math.pow(t, 2))
    // 볼살: 눈 아래~입 높이에서 앞·옆으로 살짝 부풀림
    const cheek = Math.exp(-Math.pow((v.y + 0.2) / 0.13, 2)) * (v.z > 0 ? 1 : 0.3)
    sx += cheek * 0.03
    const sz = 0.9 * (1 - 0.08 * Math.pow(t, 2)) + cheek * 0.02
    // 턱 끝을 살짝 앞으로
    const chinForward = Math.pow(t, 3) * 0.03
    pos.setXYZ(i, v.x * sx, v.y * 0.93, v.z * sz + chinForward)
  }
  geometry.computeVertexNormals()
  return geometry
}

function Toon({ color, ...props }: { color: string } & Partial<THREE.MeshToonMaterialParameters>) {
  return <meshToonMaterial color={color} {...props} />
}

function Eye({ x }: { x: number }) {
  const side = Math.sign(x)
  return <group position={[x, -0.07, 0.5]} rotation={[0, side * 0.3, 0]}>
    {/* 흰자 */}
    <mesh scale={[0.95, 1, 0.2]}>
      <sphereGeometry args={[0.13, 32, 32]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    {/* 홍채(아래로 갈수록 밝게) */}
    <mesh position={[0, -0.005, 0.02]} scale={[0.7, 0.92, 0.2]}>
      <sphereGeometry args={[0.13, 32, 32]} />
      <Toon color={c.iris} />
    </mesh>
    <mesh position={[0, 0.045, 0.03]} scale={[0.68, 0.45, 0.2]}>
      <sphereGeometry args={[0.13, 24, 24]} />
      <Toon color={c.irisDeep} />
    </mesh>
    <mesh position={[0, -0.065, 0.035]} scale={[0.42, 0.2, 0.15]}>
      <sphereGeometry args={[0.13, 20, 20]} />
      <meshBasicMaterial color="#ffc4e0" />
    </mesh>
    {/* 동공 */}
    <mesh position={[0, 0.005, 0.04]} scale={[0.28, 0.42, 0.15]}>
      <sphereGeometry args={[0.13, 20, 20]} />
      <meshBasicMaterial color="#4a1233" />
    </mesh>
    {/* 하이라이트 */}
    <mesh position={[side * -0.03, 0.055, 0.055]} scale={[1, 1.2, 0.5]}>
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    <mesh position={[side * 0.035, -0.045, 0.055]}>
      <sphereGeometry args={[0.014, 12, 12]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    {/* 윗속눈썹(두껍게) + 눈꼬리 */}
    <mesh position={[0, 0.005, 0.03]} scale={[1.02, 1.05, 1]}>
      <torusGeometry args={[0.128, 0.017, 8, 32, Math.PI]} />
      <Toon color={c.eyeLine} />
    </mesh>
    <mesh position={[side * 0.135, 0.03, 0.02]} rotation={[0, 0, side * -0.7]} scale={[1, 0.35, 0.4]}>
      <capsuleGeometry args={[0.018, 0.07, 6, 10]} />
      <Toon color={c.eyeLine} />
    </mesh>
    {/* 쌍꺼풀 선 */}
    <mesh position={[0, 0.03, 0.025]} scale={[1, 1, 1]}>
      <torusGeometry args={[0.14, 0.005, 6, 28, Math.PI * 0.8]} />
      <Toon color="#c98a8a" />
    </mesh>
    {/* 아랫속눈썹 */}
    <mesh position={[side * 0.02, -0.005, 0.025]} rotation={[0, 0, Math.PI + side * 0.35]}>
      <torusGeometry args={[0.12, 0.006, 6, 20, Math.PI * 0.35]} />
      <Toon color="#9b6b7d" />
    </mesh>
  </group>
}

// 마우스를 올리면 나오는 >< 눈
function HappyEye({ x }: { x: number }) {
  const side = Math.sign(x) // 왼쪽 눈(-)은 '>', 오른쪽 눈(+)은 '<'
  return <group position={[x, -0.07, 0.53]} rotation={[0, side * 0.3, 0]}>
    {[1, -1].map(k => <mesh key={k} position={[-side * 0.02, k * 0.04, 0]} rotation={[0, 0, -k * side * 0.55]}>
      <capsuleGeometry args={[0.02, 0.11, 6, 10]} />
      <Toon color={c.eyeLine} />
    </mesh>)}
  </group>
}

function Character({ speaking, listening, happy }: { speaking: boolean; listening: boolean; happy: boolean }) {
  const root = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const hairMap = useMemo(makeHairTexture, [])
  const blushMap = useMemo(makeBlushTexture, [])
  const faceGeometry = useMemo(makeFaceGeometry, [])
  const hairBack = useRef<THREE.Group>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const smile = useRef<THREE.Mesh>(null)
  const eyes = useRef<THREE.Group>(null)
  const glowL = useRef<THREE.MeshStandardMaterial>(null)
  const glowR = useRef<THREE.MeshStandardMaterial>(null)
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (root.current) {
      root.current.position.y = Math.sin(t * 2.2) * 0.05 + (speaking ? Math.abs(Math.sin(t * 8)) * 0.025 : 0)
      root.current.rotation.y = Math.sin(t * 0.7) * 0.22
    }
    if (head.current) {
      head.current.rotation.z = Math.sin(t * 1.5) * 0.07
      head.current.rotation.x = listening ? -0.1 + Math.sin(t * 3) * 0.03 : Math.sin(t * 1.2) * 0.04
    }
    if (hairBack.current) hairBack.current.rotation.x = Math.sin(t * 2.2 + 0.6) * 0.04
    if (mouth.current) {
      mouth.current.visible = speaking
      mouth.current.scale.set(1, 0.45 + Math.abs(Math.sin(t * 15)) * 0.9, 1)
    }
    if (smile.current) smile.current.visible = !speaking && !happy
    if (eyes.current) eyes.current.scale.y = (t % 3.6) > 3.48 ? 0.12 : 1
    const glow = listening ? 1.8 + Math.sin(t * 6) * 0.7 : 0.2
    if (glowL.current) glowL.current.emissiveIntensity = glow
    if (glowR.current) glowR.current.emissiveIntensity = glow
    if (armR.current) armR.current.rotation.z = speaking ? -1.15 + Math.sin(t * 6) * 0.35 : -0.18
    if (armL.current) armL.current.rotation.z = 0.18 + Math.sin(t * 2.2) * 0.04
  })

  return <group position={[0, 0.12, 0]}><group ref={root}>
    {/* ===== 몸 (머리:몸 ≈ 1:5.5 아이돌 비율) ===== */}
    {/* 목 */}
    <mesh position={[0, 0.1, 0]}>
      <cylinderGeometry args={[0.055, 0.06, 0.16, 12]} />
      <Toon color={c.skin} />
    </mesh>
    {/* 블라우스 */}
    <mesh position={[0, -0.28, 0]} scale={[1, 1, 0.75]}>
      <capsuleGeometry args={[0.2, 0.36, 8, 20]} />
      <Toon color={c.blouse} />
    </mesh>
    {/* 세일러 칼라 */}
    <mesh position={[0, -0.02, -0.01]} scale={[1.05, 0.32, 0.85]}>
      <sphereGeometry args={[0.24, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      <Toon color={c.collar} side={THREE.DoubleSide} />
    </mesh>
    {/* 리본 */}
    {[-1, 1].map(s => <mesh key={s} position={[s * 0.055, -0.1, 0.15]} rotation={[0, 0, s * 0.5]} scale={[1, 0.6, 0.4]}>
      <sphereGeometry args={[0.055, 16, 16]} />
      <Toon color={c.ribbon} />
    </mesh>)}
    <mesh position={[0, -0.1, 0.165]}>
      <sphereGeometry args={[0.028, 12, 12]} />
      <Toon color={c.ribbon} />
    </mesh>
    {/* 퍼프 소매 */}
    {[-0.22, 0.22].map(x => <mesh key={x} position={[x, -0.1, 0]} scale={[1, 0.9, 0.9]}>
      <sphereGeometry args={[0.1, 20, 20]} />
      <Toon color={c.blouse} />
    </mesh>)}
    {/* 프릴 속치마 */}
    <mesh position={[0, -0.74, 0]}>
      <cylinderGeometry args={[0.22, 0.42, 0.26, 24, 1, true]} />
      <Toon color={c.frill} side={THREE.DoubleSide} />
    </mesh>
    {/* 치마 */}
    <mesh position={[0, -0.64, 0]}>
      <cylinderGeometry args={[0.2, 0.38, 0.28, 24, 1, true]} />
      <Toon color={c.skirt} side={THREE.DoubleSide} />
    </mesh>
    {/* 다리: 짧은 맨다리 + 니삭스 */}
    {[-0.09, 0.09].map(x => <group key={x} position={[x, -1.05, 0]}>
      <mesh position={[0, 0.02, 0]}>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <Toon color={c.skin} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <capsuleGeometry args={[0.063, 0.38, 6, 12]} />
        <Toon color={c.sock} />
      </mesh>
      <mesh position={[0, -0.55, 0.04]} scale={[1, 0.65, 1.5]}>
        <sphereGeometry args={[0.072, 16, 16]} />
        <Toon color={c.shoe} />
      </mesh>
    </group>)}
    {/* 팔 */}
    <group ref={armL} position={[0.2, -0.06, 0]}>
      <mesh position={[0.03, -0.27, 0]}>
        <capsuleGeometry args={[0.05, 0.42, 6, 12]} />
        <Toon color={c.blouse} />
      </mesh>
      <mesh position={[0.04, -0.55, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <Toon color={c.skin} />
      </mesh>
    </group>
    <group ref={armR} position={[-0.2, -0.06, 0]}>
      <mesh position={[-0.03, -0.27, 0]}>
        <capsuleGeometry args={[0.05, 0.42, 6, 12]} />
        <Toon color={c.blouse} />
      </mesh>
      <mesh position={[-0.04, -0.55, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <Toon color={c.skin} />
      </mesh>
    </group>

    {/* 반짝이 */}
    {[[0.62, 0.9, 0.1], [-0.6, 0.55, 0.2], [0.55, 0.1, 0.25]].map(([x, y, z], i) => <mesh key={i} position={[x, y, z]} rotation={[0.4, 0.6 * i, 0.3]}>
      <octahedronGeometry args={[0.045 + i * 0.01]} />
      <meshStandardMaterial color="#fff3a6" emissive="#ffd84d" emissiveIntensity={0.8} />
    </mesh>)}
    {/* ===== 긴 뒷머리 (허리까지): 가닥을 부채꼴로 겹쳐 결을 만든다 ===== */}
    <group ref={hairBack} position={[0, 0.55, -0.16]} scale={0.88}>
      <mesh position={[0, -0.65, -0.02]} scale={[0.85, 1, 0.4]}>
        <capsuleGeometry args={[0.4, 1.0, 8, 24]} />
        <Toon color={c.hairDeep} />
      </mesh>
      {Array.from({ length: 11 }, (_, i) => {
        const a = (i / 10 - 0.5) * 2.6
        const len = 1.05 + Math.cos(i * 1.7) * 0.12
        return <mesh key={i} position={[Math.sin(a) * 0.36, -0.62 - Math.abs(Math.sin(a)) * 0.05, Math.cos(a) * 0.14 - 0.02]} rotation={[0, 0, Math.sin(a) * 0.12]}>
          <capsuleGeometry args={[0.11 - Math.abs(a) * 0.01, len, 6, 14]} />
          <Toon color="#ffffff" map={hairMap} />
        </mesh>
      })}
      {Array.from({ length: 7 }, (_, i) => {
        const x = (i - 3) * 0.12
        return <mesh key={i} position={[x, -1.3 - Math.abs(Math.sin(i * 2.1)) * 0.08, 0.04]} rotation={[Math.PI, 0, x * 0.5]}>
          <coneGeometry args={[0.07, 0.22, 8]} />
          <Toon color={c.hairDeep} />
        </mesh>
      })}
    </group>

    {/* ===== 머리 ===== */}
    <group ref={head} position={[0, 0.55, 0]} scale={0.88}>
      <mesh geometry={faceGeometry}>
        <Toon color={c.skin} />
      </mesh>
      {/* 코 */}
      <mesh position={[0, -0.16, 0.555]} scale={[0.8, 1, 0.6]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <Toon color="#f4c3b2" />
      </mesh>
      {/* 뒤통수 볼륨 */}
      <mesh position={[0, 0.02, -0.1]} scale={[0.98, 1.0, 0.95]}>
        <sphereGeometry args={[0.62, 40, 40, Math.PI * 0.62, Math.PI * 0.76]} />
        <Toon color="#ffffff" map={hairMap} side={THREE.DoubleSide} />
      </mesh>
      {/* 윗머리 + 천사링(광택 띠) */}
      <mesh position={[0, 0.07, -0.03]} scale={[1.0, 1.05, 1.02]}>
        <sphereGeometry args={[0.61, 48, 48, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <Toon color="#ffffff" map={hairMap} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.36, -0.03]} rotation={[Math.PI / 2 + 0.12, 0, Math.PI * 0.15]} scale={[1, 1.02, 1]}>
        <torusGeometry args={[0.5, 0.022, 8, 40, Math.PI * 0.7]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
      </mesh>
      {/* 앞머리: 가는 가닥 9개, 길이를 들쭉날쭉하게 */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = (i - 4) * 0.095
        const len = 0.3 + (i % 3 === 1 ? 0.08 : 0) - Math.abs(x) * 0.12
        return <mesh key={i} position={[x * 1.05, 0.28 - Math.abs(x) * 0.4, 0.5 - Math.abs(x) * 0.32]} rotation={[Math.PI - 0.38, x * -0.8, x * -0.7 + (i % 2 ? 0.08 : -0.08)]}>
          <coneGeometry args={[0.085, len + 0.06, 8]} />
          <Toon color="#ffffff" map={hairMap} />
        </mesh>
      })}
      {/* 옆머리: 두 가닥씩, 얼굴선을 따라 살짝 안쪽으로 */}
      {[-1, 1].flatMap(side => [0, 1].map(k => <mesh key={`${side}-${k}`} position={[side * (0.5 - k * 0.07), -0.3 - k * 0.04, 0.14 + k * 0.08]} rotation={[0.05, 0, side * (k ? 0.12 : -0.05)]}>
        <capsuleGeometry args={[0.075 - k * 0.012, 0.6 - k * 0.1, 6, 14]} />
        <Toon color="#ffffff" map={hairMap} />
      </mesh>))}
      {/* 바보털 */}
      <mesh position={[0.06, 0.72, 0.05]} rotation={[0, 0, -0.6]}>
        <torusGeometry args={[0.1, 0.022, 8, 20, Math.PI * 1.2]} />
        <Toon color={c.hairDeep} />
      </mesh>
      {/* 별 머리핀 */}
      <mesh position={[0.42, 0.36, 0.38]} rotation={[0, 0.4, 0.3]}>
        <octahedronGeometry args={[0.07]} />
        <meshStandardMaterial color="#ffe066" emissive="#ffcc33" emissiveIntensity={0.5} />
      </mesh>

      {/* 눈·눈썹 */}
      <group ref={eyes} visible={!happy}>
        <Eye x={-0.21} />
        <Eye x={0.21} />
      </group>
      {happy && <>
        <HappyEye x={-0.21} />
        <HappyEye x={0.21} />
      </>}
      {[-0.21, 0.21].map(x => <mesh key={x} position={[x, 0.07, 0.535]} rotation={[0, x > 0 ? 0.3 : -0.3, Math.PI * 0.225 + (x > 0 ? -0.12 : 0.12)]}>
        <torusGeometry args={[0.1, 0.008, 6, 20, Math.PI * 0.55]} />
        <Toon color={c.hairDeep} />
      </mesh>)}
      {/* 볼 홍조: 원형 그라데이션 */}
      {[-0.26, 0.26].map(x => <mesh key={x} position={[x, -0.2, 0.49]} rotation={[0, x > 0 ? 0.5 : -0.5, 0]}>
        <planeGeometry args={[0.24, 0.15]} />
        <meshBasicMaterial map={blushMap} transparent depthWrite={false} opacity={happy ? 1 : 0.75} />
      </mesh>)}
      {/* >< 표정일 때 입: 반달 모양(위는 평평, 아래는 둥근 활짝 웃는 입) */}
      {happy && !speaking && <group position={[0, -0.235, 0.535]}>
        <mesh scale={[1, 1.15, 0.35]}>
          <sphereGeometry args={[0.075, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <Toon color="#b8325c" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.05, 0.014]} scale={[1, 0.6, 0.3]}>
          <sphereGeometry args={[0.045, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <Toon color="#ff8aa6" side={THREE.DoubleSide} />
        </mesh>
      </group>}
      {/* 입: 평소엔 웃는 입, 말할 땐 벌린 입 */}
      <mesh ref={smile} position={[0, -0.25, 0.52]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.04, 0.009, 8, 16, Math.PI]} />
        <Toon color={c.mouth} />
      </mesh>
      <mesh ref={mouth} position={[0, -0.28, 0.51]} scale={[1, 0.3, 1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <Toon color={c.mouth} />
      </mesh>
      {/* 양쪽 똥머리 + 리본 */}
      {[-1, 1].map(side => <group key={side} position={[side * 0.5, 0.6, -0.12]}>
        <mesh>
          <sphereGeometry args={[0.2, 24, 24]} />
          <Toon color={c.hair} />
        </mesh>
        <mesh position={[side * 0.06, -0.14, 0.12]} rotation={[0, 0, side * 0.6]} scale={[1, 0.55, 0.5]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <Toon color={c.ribbon} />
        </mesh>
        <mesh position={[side * -0.07, -0.18, 0.12]} rotation={[0, 0, side * -0.6]} scale={[1, 0.55, 0.5]}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <Toon color={c.ribbon} />
        </mesh>
      </group>)}
      {/* 헤드셋 */}
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.68, 0.035, 12, 48, Math.PI]} />
        <meshStandardMaterial color={c.headset} metalness={0.3} roughness={0.3} />
      </mesh>
      {[-0.66, 0.66].map((x, index) => <group key={x} position={[x, 0.02, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.17, 0.17, 0.12, 24]} />
          <meshStandardMaterial color={c.headset} metalness={0.3} roughness={0.3} />
        </mesh>
        <mesh position={[x > 0 ? 0.07 : -0.07, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 24]} />
          <meshStandardMaterial ref={index === 0 ? glowL : glowR} color={c.light} emissive={c.light} emissiveIntensity={0.2} />
        </mesh>
      </group>)}
      <mesh position={[-0.56, -0.22, 0.26]} rotation={[0.2, -0.9, 0.9]}>
        <cylinderGeometry args={[0.018, 0.018, 0.42, 8]} />
        <meshStandardMaterial color={c.headsetDark} />
      </mesh>
      <mesh position={[-0.4, -0.36, 0.42]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color={c.headsetDark} />
      </mesh>
    </group>
  </group></group>
}

export default function VoiceGuideCharacter({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  const box = useRef<HTMLDivElement>(null)
  const [happy, setHappy] = useState(false)

  // 캐릭터는 클릭을 아래 화면으로 통과시키므로(pointer-events: none) 마우스 위치로 직접 올림 여부를 판단한다
  useEffect(() => {
    function onMove(event: PointerEvent) {
      const rect = box.current?.getBoundingClientRect()
      if (!rect) return
      const inside = event.clientX >= rect.left + rect.width * 0.15 && event.clientX <= rect.right - rect.width * 0.15
        && event.clientY >= rect.top && event.clientY <= rect.bottom
      setHappy(prev => (prev === inside ? prev : inside))
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return <div ref={box} className="voice-guide-character" aria-hidden="true">
    <Canvas camera={{ position: [0, 0, 4.7], fov: 38 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={1.35} />
      <directionalLight position={[1.5, 2.5, 5]} intensity={1.7} />
      <directionalLight position={[-3, 1, -2]} intensity={0.6} color="#ffd6ea" />
      <Character speaking={speaking} listening={listening} happy={happy} />
    </Canvas>
  </div>
}
