import * as THREE from 'three'

export type Point = [number, number, number]
export type Material = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial

/** Small, reusable modeling vocabulary. Each scene owns and disposes these resources. */
export class ModelKit {
  readonly materials = new Set<Material>()
  readonly geometries = new Set<THREE.BufferGeometry>()
  readonly textures = new Set<THREE.Texture>()
  private readonly colors = new Map<string, THREE.MeshStandardMaterial>()
  private readonly baseOpacities = new Map<Material, number>()

  material(color: string, roughness = .42, metalness = 0) {
    const key = `${color}:${roughness}:${metalness}`
    let result = this.colors.get(key)
    if (!result) {
      const enhanced = new THREE.Color(color)
      const hsl = { h: 0, s: 0, l: 0 }
      enhanced.getHSL(hsl)
      if (hsl.s > .08 && hsl.l > .14 && hsl.l < .93) enhanced.setHSL(hsl.h, Math.min(1, hsl.s + .09), Math.max(.1, hsl.l - .012))
      result = new THREE.MeshStandardMaterial({ color: enhanced, roughness, metalness, transparent: true })
      this.colors.set(key, result)
      this.materials.add(result)
      this.baseOpacities.set(result, result.opacity)
    }
    return result
  }

  texture<T extends THREE.Texture>(texture: T) {
    this.textures.add(texture)
    return texture
  }

  mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, color: string | Material, position: Point = [0, 0, 0], scale: Point = [1, 1, 1]) {
    this.geometries.add(geometry)
    const material = typeof color === 'string' ? this.material(color) : color
    this.materials.add(material)
    if (!this.baseOpacities.has(material)) this.baseOpacities.set(material, material.opacity)
    const result = new THREE.Mesh(geometry, material)
    result.position.set(...position)
    result.scale.set(...scale)
    result.castShadow = true
    result.receiveShadow = true
    parent.add(result)
    return result
  }

  group(parent: THREE.Object3D, position: Point = [0, 0, 0], scale = 1, rotation = 0) {
    const group = new THREE.Group()
    group.position.set(...position)
    group.scale.setScalar(scale)
    group.rotation.y = rotation
    parent.add(group)
    return group
  }

  sphere(parent: THREE.Object3D, color: string | Material, position: Point, scale: Point) {
    return this.mesh(parent, new THREE.SphereGeometry(1, 20, 14), color, position, scale)
  }

  box(parent: THREE.Object3D, color: string | Material, position: Point, size: Point) {
    return this.mesh(parent, new THREE.BoxGeometry(...size), color, position)
  }

  cylinder(parent: THREE.Object3D, color: string | Material, position: Point, top: number, bottom: number, height: number, segments = 18) {
    return this.mesh(parent, new THREE.CylinderGeometry(top, bottom, height, segments), color, position)
  }

  curve(parent: THREE.Object3D, color: string | Material, points: Point[], thickness = .025, segments = 36) {
    const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)))
    return this.mesh(parent, new THREE.TubeGeometry(curve, segments, thickness, 7, false), color)
  }

  /** A coastline is a modeled solid, rather than a stack of perfectly round discs. */
  land(parent: THREE.Object3D, color: string | Material, radius: number, height: number, elevation: number, seed: number, stretch: Point = [1, 1, 1]) {
    const shape = new THREE.Shape()
    const count = 80
    for (let i = 0; i <= count; i++) {
      const angle = i / count * Math.PI * 2
      const r = radius * (1 + Math.sin(angle * 3 + seed) * .06 + Math.sin(angle * 5 - seed) * .035)
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .055, bevelThickness: .045, curveSegments: 1 })
    geometry.rotateX(-Math.PI / 2)
    return this.mesh(parent, geometry, color, [0, elevation, -.12], stretch)
  }

  palm(parent: THREE.Object3D, position: Point, scale = 1, tilt = 0) {
    const g = this.group(parent, position, scale, tilt)
    this.curve(g, '#ab8161', [[0, 0, 0], [-.015, .42, .025], [.12, .92, 0]], .04)
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2
      const leaf = this.sphere(g, this.material(i % 2 ? '#5b9f74' : '#80b68a', .78), [.12 + Math.cos(a) * .22, .94, Math.sin(a) * .22], [.42, .035, .095])
      leaf.rotation.y = -a
      leaf.rotation.z = Math.cos(a) * -.23
      this.curve(g, '#8cbf92', [[.12, .96, 0], [.12 + Math.cos(a) * .26, .96, Math.sin(a) * .26], [.12 + Math.cos(a) * .56, .86, Math.sin(a) * .56]], .006, 10)
    }
    for (const x of [.06, .16]) this.sphere(g, '#947355', [x, .85, .04], [.055, .066, .055])
    return g
  }

  grass(parent: THREE.Object3D, color: string, count: number, radius: number, seed: number) {
    const geometry = new THREE.ConeGeometry(.018, .085, 4)
    const material = this.material(color, .92)
    const result = new THREE.InstancedMesh(geometry, material, count)
    const matrix = new THREE.Object3D()
    for (let i = 0; i < count; i++) {
      const angle = i * 2.39996 + seed
      const r = radius * (.2 + .8 * Math.sqrt((i + .5) / count))
      matrix.position.set(Math.cos(angle) * r, .37 + (i % 5) * .004, Math.sin(angle) * r - .12)
      matrix.rotation.set((i % 3 - 1) * .08, angle, (i % 4 - 1.5) * .035)
      const scale = .7 + (i % 7) * .06
      matrix.scale.set(scale, scale, scale)
      matrix.updateMatrix()
      result.setMatrixAt(i, matrix.matrix)
    }
    result.castShadow = true
    result.receiveShadow = true
    parent.add(result)
    this.geometries.add(geometry)
    this.materials.add(material)
    return result
  }

  tree(parent: THREE.Object3D, position: Point, scale = 1, conifer = false) {
    const g = this.group(parent, position, scale)
    this.cylinder(g, '#a88467', [0, .22, 0], .035, .048, .43, 9)
    if (conifer) {
      for (let i = 0; i < 3; i++) this.cylinder(g, this.material(['#3d7e69', '#55997a', '#76ae87'][i], .86), [0, .45 + i * .19, 0], .025, .28 - i * .065, .4, 9)
    } else {
      const clusters: Array<[string, Point, Point]> = [
        ['#93b899', [-.12, .61, .01], [.27, .32, .27]],
        ['#78a786', [.13, .72, -.03], [.25, .31, .25]],
        ['#a8c5a0', [0, .87, .02], [.22, .23, .24]],
        ['#659776', [.02, .68, .14], [.18, .21, .18]],
      ]
      clusters.forEach(([color, point, shape]) => this.mesh(g, new THREE.DodecahedronGeometry(1, 1), this.material(color, .88), point, shape))
    }
    return g
  }

  person(parent: THREE.Object3D, position: Point, shirt: string, scale = 1, options: { older?: boolean; seated?: boolean; backpack?: boolean; scarf?: boolean; golfing?: boolean } = {}) {
    const g = this.group(parent, position, scale)
    const y = options.seated ? .17 : .24
    for (const x of [-.046, .046]) {
      this.cylinder(g, '#334e61', [x, options.seated ? .06 : .10, options.seated ? .04 : 0], .025, .025, options.seated ? .1 : .2, 9)
      this.box(g, '#e3d2b5', [x, .015, .035], [.06, .034, .10])
      if (options.seated) this.box(g, '#334e61', [x, .13, .04], [.05, .043, .12])
    }
    this.cylinder(g, shirt, [0, y, 0], .058, .068, .17, 12)
    this.sphere(g, '#ebc3a2', [0, y + .15, 0], [.07, .08, .066])
    this.sphere(g, options.older ? '#b8b9af' : '#63544c', [0, y + .195, -.015], [.073, .047, .063])
    for (const x of [-.077, .077]) {
      const arm = this.cylinder(g, shirt, [x, y + .015, options.seated ? .03 : 0], .021, .018, .14, 8)
      arm.rotation.z = x > 0 ? -.2 : .2
      this.sphere(g, '#ebc3a2', [x, y - .05, .04], [.023, .026, .024])
    }
    if (options.backpack) {
      this.box(g, '#d5a56e', [0, y + .01, -.072], [.115, .14, .058])
      for (const x of [-.04, .04]) this.box(g, '#d4bd9a', [x, y + .03, .054], [.015, .13, .015])
    }
    if (options.scarf) {
      this.cylinder(g, '#efad85', [0, y + .085, 0], .064, .064, .037, 12)
      this.box(g, '#efad85', [.038, y + .017, .066], [.03, .11, .012])
    }
    if (options.golfing) {
      this.sphere(g, '#f7f2df', [0, y + .22, .017], [.082, .02, .09])
      this.curve(g, '#a4b7bb', [[.09, y - .03, .035], [.17, .04, .17], [.21, .02, .19]], .008, 7)
      this.box(g, '#374e61', [.21, .019, .195], [.065, .025, .03])
    }
    return g
  }

  car(parent: THREE.Object3D, position: Point, coach = false, rotation = 0) {
    const g = this.group(parent, position, 1, rotation)
    const length = coach ? .7 : .46
    this.box(g, '#e6edf0', [0, .14, 0], [.26, .14, length])
    this.box(g, '#91b9ce', [0, .265, -.01], [.23, coach ? .19 : .115, length * .71])
    this.box(g, '#f8f7ee', [0, coach ? .37 : .33, -.01], [.27, .035, length * .75])
    for (const x of [-.133, .133]) {
      for (const z of [-length * .32, length * .32]) {
        const wheel = this.cylinder(g, '#385264', [x, .1, z], .065, .065, .035, 14)
        wheel.rotation.z = Math.PI / 2
        const hub = this.cylinder(g, '#c2d3d8', [x * 1.15, .1, z], .026, .026, .036, 10)
        hub.rotation.z = Math.PI / 2
      }
      if (coach) for (let i = 0; i < 4; i++) this.box(g, '#dfeef3', [x * .9, .28, -.23 + i * .135], [.009, .10, .098])
    }
    for (const x of [-.086, .086]) this.box(g, '#ffe6ae', [x, .15, length / 2 + .002], [.038, .028, .009])
    return g
  }

  resort(parent: THREE.Object3D, position: Point, color: string, scale = 1) {
    const g = this.group(parent, position, scale)
    this.box(g, '#f8eddb', [0, .3, 0], [.79, .57, .60])
    const roof = this.cylinder(g, color, [0, .67, 0], 0, .63, .28, 4)
    roof.rotation.y = Math.PI / 4
    roof.scale.z = .83
    this.box(g, '#a4cfd9', [0, .22, .306], [.19, .35, .02])
    for (const x of [-.26, .26]) {
      this.box(g, '#a4cbd2', [x, .36, .307], [.17, .18, .02])
      this.box(g, '#fff7e7', [x, .36, .324], [.016, .18, .012])
      this.box(g, '#fff7e7', [x, .36, .324], [.17, .016, .012])
    }
    this.box(g, '#d9bb93', [0, .05, .43], [.86, .045, .31])
    for (const x of [-.36, .36]) this.cylinder(g, '#e7d4b9', [x, .33, .49], .022, .024, .57, 9)
    this.box(g, '#f4e6d0', [0, .61, .45], [.86, .05, .31])
    return g
  }

  fade(opacity: number) {
    this.materials.forEach(material => {
      const baseOpacity = this.baseOpacities.get(material) ?? 1
      material.opacity = baseOpacity * opacity
      material.depthWrite = baseOpacity > .98 && opacity > .98
    })
  }

  dispose() {
    this.geometries.forEach(geometry => geometry.dispose())
    this.materials.forEach(material => material.dispose())
    this.textures.forEach(texture => texture.dispose())
  }
}
