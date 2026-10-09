import * as THREE from 'three'
import { ModelKit } from './modelKit'

export function createEnclosure() {
  const kit = new ModelKit(), group = new THREE.Group()
  group.name = 'CUTY clear glass snowglobe'
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#82caff', transparent: true, opacity: .60, depthWrite: false,
    roughness: .014, metalness: 0, transmission: .96, thickness: .18,
    ior: 1.18, dispersion: .016, attenuationDistance: 2.8,
    attenuationColor: new THREE.Color('#82c5ff'), clearcoat: .75,
    clearcoatRoughness: .022, iridescence: .035,
    iridescenceIOR: 1.22, iridescenceThicknessRange: [120, 320],
    envMapIntensity: .22, side: THREE.FrontSide,
  })
  const glass = kit.mesh(group, new THREE.SphereGeometry(2.61, 80, 56, 0, Math.PI * 2, 0, 2.57), glassMaterial, [0, 1.60, 0])
  glass.castShadow = false
  glass.receiveShadow = false
  glass.renderOrder = 10
  const blue = new THREE.MeshPhysicalMaterial({ color: '#a8cee0', roughness: .16, metalness: .08, clearcoat: 1, clearcoatRoughness: .08, transparent: true })
  kit.cylinder(group, blue, [0, -.66, 0], 1.78, 1.89, .28, 80)
  const lowerBand = new THREE.MeshPhysicalMaterial({ color: '#7fa9c0', roughness: .12, metalness: .16, clearcoat: 1, clearcoatRoughness: .05, transparent: true })
  kit.cylinder(group, lowerBand, [0, -.83, 0], 1.90, 1.94, .09, 80)
  const pearl = new THREE.MeshPhysicalMaterial({ color: '#e5f2f2', roughness: .10, metalness: .08, clearcoat: 1, transparent: true })
  kit.cylinder(group, pearl, [0, -.49, 0], 1.82, 1.82, .055, 80)
  const ring = kit.mesh(group, new THREE.TorusGeometry(1.82, .040, 12, 80), kit.material('#d1e6e9', .20, .08), [0, -.45, 0])
  ring.rotation.x = Math.PI / 2
  const reflection = new THREE.MeshBasicMaterial({ color: '#edf8ff', transparent: true, opacity: .52, depthWrite: false })
  const shine = kit.curve(group, reflection, [[-1.71, 2.84, 1.25], [-1.46, 3.30, 1.05], [-1.0, 3.65, .94]], .025, 36)
  shine.castShadow = false
  shine.renderOrder = 11
  const reflection2 = new THREE.MeshBasicMaterial({ color: '#acd9ff', transparent: true, opacity: .26, depthWrite: false })
  const shine2 = kit.curve(group, reflection2, [[1.72, .93, 1.44], [1.94, 1.66, 1.50], [1.87, 2.15, 1.29]], .014, 36)
  shine2.castShadow = false
  shine2.renderOrder = 11
  const badge = kit.box(group, pearl, [0, -.66, 1.819], [.46, .10, .016])
  badge.rotation.y = .04
  const mark = kit.mesh(group, new THREE.TorusGeometry(.052, .009, 8, 24, Math.PI * 1.62), '#88aebe', [-.045, -.66, 1.835])
  mark.rotation.set(Math.PI / 2, 0, -.54)
  for (let i = 0; i < 3; i++) kit.sphere(group, '#9ebaca', [.035 + i * .047, -.66, 1.84], [.012, .012, .007])
  return { group, kit }
}
