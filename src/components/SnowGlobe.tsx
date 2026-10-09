import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import type { GlobeMood } from '../types/landing'
import { createThemeScene } from './globe/themeScenes'
import { createEnclosure } from './globe/enclosure'
import { GlobeEffects } from './globe/effects'
import { StaticGlobe } from './StaticGlobe'

interface Props {
  mood: GlobeMood
  paused: boolean
  reducedMotion: boolean
}

const moods: GlobeMood[] = ['honeymoon', 'family', 'golf', 'trekking']

class GlobeBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function Miniature({ mood, paused, reducedMotion, visible, onContextLost }: Props & { visible: boolean; onContextLost: () => void }) {
  const gl = useThree(state => state.gl)
  const scene = useThree(state => state.scene)
  const camera = useThree(state => state.camera)
  const invalidate = useThree(state => state.invalidate)
  const models = useMemo(() => moods.map(createThemeScene), [])
  const enclosure = useMemo(createEnclosure, [])
  const globe = useRef<THREE.Group>(null)
  // Keep the circular globe centered within the background canvas.
  const cameraTarget = useMemo(() => new THREE.Vector3(0, 1.6, 0), [])
  const clock = useRef({ time: 0, current: mood, target: mood, from: mood, progress: 1 })

  useEffect(() => {
    camera.lookAt(cameraTarget)
    const room = new RoomEnvironment()
    const pmrem = new THREE.PMREMGenerator(gl)
    const environment = pmrem.fromScene(room, .05)
    scene.environment = environment.texture
    scene.environmentIntensity = .40
    room.dispose()
    pmrem.dispose()
    let alive = true
    // Warm every theme's material program once; switching never recreates the WebGL root.
    models.forEach(model => { model.group.visible = true })
    void gl.compileAsync(scene, camera).then(() => { if (alive) invalidate() }).catch(() => { if (alive) onContextLost() })
    const lost = (event: Event) => { event.preventDefault(); onContextLost() }
    gl.domElement.addEventListener('webglcontextlost', lost)
    invalidate()
    return () => {
      alive = false
      scene.environment = null
      environment.dispose()
      gl.domElement.removeEventListener('webglcontextlost', lost)
    }
  }, [camera, cameraTarget, gl, invalidate, models, onContextLost, scene])

  useEffect(() => () => {
    models.forEach(model => model.kit.dispose())
    enclosure.kit.dispose()
  }, [models, enclosure])

  useEffect(() => {
    const state = clock.current
    if (state.target !== mood) {
      state.from = state.progress < .5 ? state.from : state.target
      state.target = mood
      state.current = state.from
      state.progress = reducedMotion ? 1 : 0
    }
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false
    function tick() {
      if (stopped || !visible || document.hidden) return
      invalidate()
      if ((!paused && !reducedMotion) || clock.current.progress < 1) timer = setTimeout(tick, 1000 / 30)
    }
    tick()
    return () => { stopped = true; clearTimeout(timer) }
  }, [mood, paused, reducedMotion, visible, invalidate])

  useFrame(({ scene: frameScene, camera: frameCamera }, delta) => {
    if (!visible || document.hidden) return
    const state = clock.current
    const dt = Math.min(delta, 1 / 20)
    if (!paused && !reducedMotion) {
      state.time += dt
    }
    if (reducedMotion) state.progress = 1
    else state.progress = Math.min(1, state.progress + dt / 1.65)
    const mix = state.progress * state.progress * (3 - 2 * state.progress)
    models.forEach(model => {
      let opacity = 0
      if (state.from === state.target) opacity = model.mood === state.target ? 1 : 0
      else if (model.mood === state.target) opacity = mix
      else if (model.mood === state.from) opacity = 1 - mix
      model.group.visible = opacity > .002
      if (!model.group.visible) return
      model.kit.fade(opacity)
      const scale = model.mood === state.target ? .975 + mix * .025 : 1 - mix * .025
      model.group.scale.setScalar(scale)
      model.group.position.y = model.mood === state.target ? -.045 * (1 - mix) : -.045 * mix
      model.group.rotation.y = model.mood === state.target ? (1 - mix) * .055 : -mix * .045
      const time = state.time
      if (model.mood === 'honeymoon' || model.mood === 'golf') {
        const angle = time * (model.mood === 'golf' ? .09 : .16) + .78
        model.flyer.position.set(Math.cos(angle) * 1.72, 2.68 + Math.sin(angle) * .13, Math.sin(angle) * 1.21)
        model.flyer.rotation.set(.015, Math.PI - angle, -.10)
        model.flyer.scale.setScalar(model.mood === 'golf' ? .55 : .94)
      } else if (model.mood === 'family') {
        model.flyer.position.set(.41 + Math.sin(time * .15) * .19, 2.55 + Math.sin(time * .38) * .075, .22)
        model.flyer.rotation.z = Math.sin(time * .3) * .025
      } else {
        const angle = time * .11 + .37
        model.flyer.position.set(Math.cos(angle) * 1.11, 2.86 + Math.sin(time * .3) * .07, Math.sin(angle) * .58 + .36)
        model.flyer.rotation.y = -angle + .8
      }
      model.accents.forEach((accent, i) => accent.scale.setScalar(1 + Math.sin(time * .6 + i) * .009))
      model.waterTexture.offset.set(time * .0045, Math.sin(time * .08) * .015)
    })
    if (state.progress === 1) state.current = state.target
    if (globe.current && !paused && !reducedMotion) {
      globe.current.rotation.x = THREE.MathUtils.damp(globe.current.rotation.x, 0, 3.2, dt)
      globe.current.rotation.y = THREE.MathUtils.damp(globe.current.rotation.y, Math.sin(state.time * .10) * .035, 3, dt)
      globe.current.rotation.z = THREE.MathUtils.damp(globe.current.rotation.z, 0, 3, dt)
      globe.current.position.y = Math.sin(state.time * .48) * .018
      camera.lookAt(cameraTarget)
    }
    gl.render(frameScene, frameCamera)
  }, 1)

  return <>
    <hemisphereLight color="#f2f7ff" groundColor="#aab795" intensity={1.05} />
    <directionalLight position={[-4, 7, 5]} color="#fff0d8" intensity={1.7} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-.0003} shadow-normalBias={.035} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={5} shadow-camera-bottom={-3} />
    <directionalLight position={[5, 3, -4]} color="#b6d9ef" intensity={.6} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.885, 0]} receiveShadow>
      <circleGeometry args={[3.7, 64]} />
      <shadowMaterial transparent opacity={.17} depthWrite={false} />
    </mesh>
    <group ref={globe}>
      {models.map(model => <primitive key={model.mood} object={model.group} dispose={null} />)}
      <primitive object={enclosure.group} dispose={null} />
      <GlobeEffects mood={mood} paused={paused} reducedMotion={reducedMotion} visible={visible} />
    </group>
  </>
}

export default function SnowGlobe(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const contextLost = useMemo(() => () => setUnavailable(true), [])
  useEffect(() => {
    const container = host.current
    if (!container) return
    let intersecting = true
    const update = () => setVisible(intersecting && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update() })
    observer.observe(container)
    document.addEventListener('visibilitychange', update)
    update()
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update) }
  }, [])
  const fallback = <StaticGlobe mood={props.mood} />
  const animationActive = visible && !props.paused && !props.reducedMotion && !unavailable
  return <div className={`snowglobe-render${unavailable ? ' globe-unavailable' : ''}`} ref={host} aria-hidden="true" data-animation-active={animationActive ? 'true' : 'false'} data-r3f-scene="cuty-snowglobe-v2">
    {unavailable ? fallback : <GlobeBoundary fallback={fallback}>
      {/* CSS zoom must not change the renderer dimensions during scroll. */}
      <Canvas resize={{ scroll: false, offsetSize: true }} frameloop="demand" dpr={[1, 1.5]} shadows="percentage" gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: .93 }} camera={{ position: [0, 3, 12], fov: 38, near: .1, far: 40 }} fallback={fallback}>
        <Miniature {...props} visible={visible} onContextLost={contextLost} />
      </Canvas>
    </GlobeBoundary>}
  </div>
}
