import * as THREE from 'three'
import type { GlobeMood } from '../../types/landing'
import { ModelKit, type Point } from './modelKit'

export interface ThemeScene {
  mood: GlobeMood
  group: THREE.Group
  kit: ModelKit
  flyer: THREE.Group
  accents: THREE.Mesh[]
  waterTexture: THREE.Texture
}

function proceduralTexture(kit: ModelKit, kind: 'earth' | 'water', seed: number, size = 64) {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const index = (y * size + x) * 4
    const value = kind === 'water'
      ? 128 + Math.sin(x * .44 + y * .08 + seed) * 34 + Math.sin(x * .13 - y * .27) * 18
      : 98 + ((x * 37 + y * 61 + seed * 97) % 127) + Math.sin(x * .8 + y * .63) * 15
    const channel = Math.max(0, Math.min(255, Math.round(value)))
    data[index] = data[index + 1] = data[index + 2] = channel
    data[index + 3] = 255
  }
  const texture = kit.texture(new THREE.DataTexture(data, size, size, THREE.RGBAFormat))
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(kind === 'water' ? 2.6 : 8, kind === 'water' ? 2.6 : 8)
  texture.colorSpace = THREE.NoColorSpace
  texture.needsUpdate = true
  return texture
}

function groundMaterial(kit: ModelKit, color: string, seed: number) {
  const surface = proceduralTexture(kit, 'earth', seed)
  const richer = new THREE.Color(color).offsetHSL(0, .08, -.015)
  return new THREE.MeshStandardMaterial({
    color: richer, roughness: .9, metalness: 0, roughnessMap: surface,
    bumpMap: surface, bumpScale: .024, transparent: true,
  })
}

function beachChair(kit: ModelKit, parent: THREE.Object3D, position: Point, color: string, rotation = 0) {
  const g = kit.group(parent, position, 1, rotation)
  kit.box(g, '#bc9477', [0, .09, 0], [.20, .06, .44])
  kit.box(g, color, [0, .13, .04], [.19, .045, .34])
  const back = kit.box(g, color, [0, .23, -.15], [.19, .24, .04])
  back.rotation.x = -.45
  for (const x of [-.075, .075]) for (const z of [-.13, .13]) kit.box(g, '#a98366', [x, .025, z], [.025, .09, .025])
  return g
}

function table(kit: ModelKit, parent: THREE.Object3D, position: Point, romantic = false) {
  const g = kit.group(parent, position)
  kit.cylinder(g, '#f9f0dc', [0, .30, 0], .205, .205, .035, 32)
  kit.cylinder(g, '#c8a382', [0, .15, 0], .025, .038, .3, 10)
  kit.cylinder(g, '#c8a382', [0, .026, 0], .13, .13, .018, 18)
  for (const x of [-.10, .10]) {
    kit.cylinder(g, '#fcfcf2', [x, .324, 0], .058, .058, .007, 20)
    kit.sphere(g, '#cf9675', [x, .333, .006], [.035, .009, .024])
    kit.cylinder(g, '#cee6e7', [x, .35, -.09], .025, .018, .045, 12)
    kit.curve(g, '#e8ddd0', [[x + .029, .35, -.09], [x + .042, .35, -.09], [x + .029, .333, -.09]], .004, 8)
  }
  if (romantic) {
    kit.cylinder(g, '#f3dcb6', [0, .363, 0], .025, .025, .08, 10)
    kit.sphere(g, '#ffd38e', [0, .416, 0], [.012, .026, .012])
    kit.cylinder(g, '#579079', [.02, .365, .065], .017, .021, .079, 12)
    kit.sphere(g, '#f5b2a5', [.02, .424, .065], [.043, .039, .042])
  } else {
    kit.sphere(g, '#ba8766', [0, .366, 0], [.044, .034, .041])
    kit.cylinder(g, '#ba8766', [0, .406, 0], .019, .023, .015, 10)
    kit.curve(g, '#ba8766', [[.02, .36, 0], [.068, .365, 0], [.072, .388, 0]], .009, 10)
  }
  return g
}

function boardwalk(kit: ModelKit, parent: THREE.Object3D, start: Point, end: Point, count = 11, width = .29) {
  const dx = end[0] - start[0], dz = end[2] - start[2]
  const rotation = Math.atan2(dx, dz)
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const plank = kit.box(parent, '#c5a37f', [start[0] + dx * t, start[1] + (end[1] - start[1]) * t, start[2] + dz * t], [width, .027, Math.hypot(dx, dz) / count * .86])
    plank.rotation.y = rotation
  }
}

function pavilion(kit: ModelKit, parent: THREE.Object3D, position: Point) {
  const g = kit.group(parent, position)
  kit.box(g, '#decdb1', [0, .025, 0], [.72, .05, .60])
  for (const x of [-.28, .28]) for (const z of [-.23, .23]) kit.cylinder(g, '#d3bb98', [x, .3, z], .025, .025, .58, 12)
  const roof = kit.cylinder(g, '#5f8f99', [0, .68, 0], 0, .57, .24, 4)
  roof.rotation.y = Math.PI / 4
  roof.scale.z = .86
  kit.box(g, '#d1b99c', [0, .22, -.22], [.58, .045, .14])
  kit.box(g, '#d1b99c', [0, .3, -.28], [.58, .15, .025])
}

function flowers(kit: ModelKit, parent: THREE.Object3D, center: Point, count: number, radius: number) {
  for (let i = 0; i < count; i++) {
    const angle = i * 2.39996
    const r = radius * Math.sqrt((i + 1) / count)
    const x = center[0] + Math.cos(angle) * r, z = center[2] + Math.sin(angle) * r
    kit.cylinder(parent, '#61946d', [x, center[1] + .045, z], .006, .006, .075, 5)
    kit.sphere(parent, ['#eeb3a9', '#edc57d', '#fff3d7'][i % 3], [x, center[1] + .088, z], [.025, .022, .025])
  }
}

function airplane(kit: ModelKit, parent: THREE.Object3D) {
  const g = kit.group(parent)
  kit.sphere(g, '#79b7df', [0, 0, 0], [.095, .108, .43])
  kit.sphere(g, '#cae6f0', [0, .065, -.23], [.072, .045, .105])
  const wings = kit.box(g, '#a6d5ec', [0, -.012, .005], [.92, .037, .145])
  wings.rotation.y = -.12
  kit.box(g, '#78b4dc', [0, .06, .30], [.42, .025, .10])
  const tail = kit.sphere(g, '#7fbae0', [0, .16, .32], [.028, .15, .085])
  tail.rotation.x = -.15
  for (const x of [-.20, .20]) {
    kit.sphere(g, '#5298c4', [x, -.07, -.015], [.041, .041, .12])
    kit.cylinder(g, '#d9e7e9', [x, -.07, -.13], .023, .023, .012, 12).rotation.x = Math.PI / 2
  }
  for (let i = 0; i < 5; i++) for (const x of [-.084, .084]) kit.sphere(g, '#f3f7ef', [x, .021, -.12 + i * .065], [.01, .017, .011])
  g.scale.setScalar(.94)
  return g
}

function balloon(kit: ModelKit, parent: THREE.Object3D) {
  const g = kit.group(parent)
  const colors = ['#98cddd', '#f8ebd8', '#e3ad99', '#f8ebd8', '#9abda0', '#f8ebd8', '#e3ad99', '#f8ebd8']
  colors.forEach((color, i) => kit.mesh(g, new THREE.SphereGeometry(.34, 8, 24, i * Math.PI / 4, Math.PI / 4), color, [0, .22, 0], [1, 1.22, 1]))
  kit.cylinder(g, '#dfc9a8', [0, -.18, 0], .085, .07, .08, 16)
  kit.box(g, '#bb9871', [0, -.43, 0], [.18, .14, .15])
  for (let i = 0; i < 4; i++) kit.box(g, '#d4b894', [0, -.47 + i * .026, .077], [.18, .008, .004])
  for (const x of [-.065, .065]) for (const z of [-.055, .055]) kit.curve(g, '#8b846a', [[x, -.36, z], [x * 1.6, -.19, z * 1.6]], .006, 4)
  return g
}

function paraglider(kit: ModelKit, parent: THREE.Object3D) {
  const g = kit.group(parent)
  const points: number[] = [], colors: number[] = [], indices: number[] = []
  const panels = 32, chords = 8
  const palette = ['#db9d7e', '#edcdb0', '#f4e4c7', '#8eaeae'].map(color => new THREE.Color(color))
  for (let i = 0; i <= panels; i++) for (let j = 0; j <= chords; j++) {
    const x = -.55 + i / panels * 1.10, t = j / chords
    const y = .105 + Math.sqrt(Math.max(0, 1 - (x / .56) ** 2)) * .145 + Math.sin(t * Math.PI) * .037
    points.push(x, y, -.19 + t * .36)
    const color = palette[Math.floor(i / 4) % palette.length]
    colors.push(color.r, color.g, color.b)
    if (i < panels && j < chords) {
      const index = i * (chords + 1) + j
      indices.push(index, index + 1, index + chords + 1, index + 1, index + chords + 2, index + chords + 1)
    }
  }
  const shape = new THREE.BufferGeometry()
  shape.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  shape.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  shape.setIndex(indices)
  shape.computeVertexNormals()
  kit.mesh(g, shape, new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, side: THREE.DoubleSide, roughness: .44 }))
  for (const x of [-.48, -.29, -.1, .1, .29, .48]) kit.curve(g, '#b7c6c1', [[x, .105 + Math.sqrt(1 - (x / .56) ** 2) * .145, -.11], [x * .18, -.36, .02]], .004, 8)
  kit.person(g, [0, -.67, .04], '#467d91', .65, { seated: true, scarf: true })
  kit.sphere(g, '#364f61', [0, -.48, -.025], [.063, .09, .055])
  return g
}

function honeymoon(kit: ModelKit, group: THREE.Group) {
  kit.land(group, '#efd5ad', 1.66, .09, .10, .8, [1, 1, .94])
  kit.land(group, groundMaterial(kit, '#91b879', .8), 1.42, .07, .19, .8, [1, 1, .92])
  kit.grass(group, '#72a66c', 38, 1.31, .8)
  kit.resort(group, [-.25, .27, -.63], '#d69782', 1.18)
  kit.resort(group, [.77, .26, -.77], '#e2b197', .63)
  kit.sphere(group, '#77c8d3', [.31, .317, -.12], [.35, .018, .18])
  const poolRim = kit.mesh(group, new THREE.TorusGeometry(.22, .025, 8, 40), '#ede1c8', [.31, .319, -.12], [1.6, .83, 1])
  poolRim.rotation.x = Math.PI / 2
  kit.palm(group, [-1.05, .30, -.43], .95, -.1)
  kit.palm(group, [.96, .29, .14], .96, .8)
  kit.palm(group, [-1.24, .25, .33], .64, .3)
  boardwalk(kit, group, [-.4, .30, .44], [-.39, .19, 1.67], 16, .28)
  for (const z of [.65, 1.17, 1.6]) for (const x of [-.51, -.28]) kit.cylinder(group, '#b89373', [x, .1, z], .019, .025, .31, 8)
  beachChair(kit, group, [.25, .24, .77], '#f9e9ce', -.25)
  beachChair(kit, group, [.61, .24, .77], '#f3d1c0', -.25)
  const umbrella = kit.cylinder(group, '#edb59e', [.49, .77, .56], 0, .38, .15, 14)
  umbrella.rotation.y = .1
  kit.cylinder(group, '#bd9d7c', [.49, .49, .56], .014, .014, .57, 10)
  table(kit, group, [-.85, .27, .74], true)
  const a = kit.person(group, [-1.13, .27, .75], '#e9a99f', .78, { seated: true }); a.rotation.y = Math.PI / 2
  const b = kit.person(group, [-.58, .27, .75], '#f3eee1', .78, { seated: true }); b.rotation.y = -Math.PI / 2
  const arch = kit.mesh(group, new THREE.TorusGeometry(.29, .023, 9, 40, Math.PI), '#ede3c9', [.95, .65, .54])
  arch.rotation.z = 0
  for (const x of [.66, 1.24]) kit.cylinder(group, '#d9c3a0', [x, .46, .54], .021, .025, .4, 10)
  for (let i = 0; i < 15; i++) {
    const angle = i / 14 * Math.PI
    kit.sphere(group, i % 3 ? '#efb9b0' : '#faf0d5', [.95 + Math.cos(angle) * .29, .65 + Math.sin(angle) * .29, .55], [.035, .038, .031])
  }
  flowers(kit, group, [1.03, .26, .97], 16, .23)
  kit.car(group, [-.06, .29, 1.1], false, -.65)
  return airplane(kit, group)
}

function family(kit: ModelKit, group: THREE.Group) {
  kit.land(group, '#dddbc0', 1.67, .10, .10, 1.8, [1, 1, .96])
  kit.land(group, groundMaterial(kit, '#78aa78', 1.8), 1.48, .09, .20, 1.8, [1, 1, .94])
  kit.grass(group, '#609667', 40, 1.37, 1.8)
  kit.sphere(group, '#89bdcb', [.48, .351, .58], [.68, .017, .49])
  kit.sphere(group, '#b1d5d6', [.48, .367, .59], [.61, .004, .42])
  pavilion(kit, group, [.23, .31, -.52])
  kit.resort(group, [-.7, .3, -.79], '#7999a5', .69)
  boardwalk(kit, group, [-.78, .39, .82], [.88, .39, .73], 22, .26)
  boardwalk(kit, group, [-.55, .39, .72], [-.26, .35, -.28], 13, .24)
  for (const x of [-.62, -.15, .35, .81]) kit.cylinder(group, '#baa180', [x, .43, .84], .012, .012, .21, 7)
  kit.curve(group, '#c9b395', [[-.63, .53, .84], [.0, .53, .84], [.81, .53, .84]], .012)
  table(kit, group, [-.52, .33, .1])
  const p1 = kit.person(group, [-.81, .33, .13], '#b4c0cc', .89, { seated: true, older: true }); p1.rotation.y = Math.PI / 2
  const p2 = kit.person(group, [-.23, .33, .13], '#cfa894', .89, { seated: true, older: true }); p2.rotation.y = -Math.PI / 2
  // A stone-rimmed warm pool and two reclining massage/rest beds give healing a distinct silhouette.
  kit.sphere(group, '#c7c5b3', [.94, .32, -.14], [.43, .08, .31])
  kit.sphere(group, '#b6d8cd', [.94, .385, -.14], [.33, .019, .23])
  for (let i = 0; i < 11; i++) {
    const angle = i / 11 * Math.PI * 2
    kit.sphere(group, '#c7c7b7', [.94 + Math.cos(angle) * .38, .385, -.14 + Math.sin(angle) * .28], [.071, .05, .058])
  }
  beachChair(kit, group, [1.08, .3, -.72], '#e7e4cb', .9)
  beachChair(kit, group, [.67, .3, -.89], '#f0dfcd', .9)
  for (const [x, z, s] of [[-1.15, -.32, .90], [.92, -1.1, .82], [-1.05, .66, .61], [1.30, .18, .66]]) kit.tree(group, [x, .3, z], s)
  flowers(kit, group, [-1.03, .31, .36], 18, .26)
  flowers(kit, group, [.33, .31, -1.18], 14, .24)
  kit.car(group, [-.73, .30, 1.03], true, -.85)
  return balloon(kit, group)
}

function golfCart(kit: ModelKit, parent: THREE.Object3D, position: Point) {
  const g = kit.group(parent, position, 1, .28)
  kit.box(g, '#87a894', [0, .14, 0], [.31, .10, .45])
  kit.box(g, '#f4e9cc', [0, .23, -.025], [.26, .06, .20])
  kit.box(g, '#f4e9cc', [0, .32, -.09], [.26, .13, .045])
  for (const x of [-.125, .125]) for (const z of [-.17, .16]) {
    kit.cylinder(g, '#a2b4ac', [x, .39, z], .010, .010, .39, 6)
    const wheel = kit.cylinder(g, '#40565a', [x * 1.2, .10, z], .063, .063, .037, 12)
    wheel.rotation.z = Math.PI / 2
  }
  kit.box(g, '#f6efd9', [0, .60, -.015], [.38, .035, .51])
  kit.box(g, '#7db0bd', [0, .38, .16], [.25, .12, .008])
  const bag = kit.cylinder(g, '#d9a980', [.08, .34, -.26], .054, .055, .25, 12)
  bag.rotation.z = -.12
  for (let i = 0; i < 3; i++) {
    kit.curve(g, '#a2b5b4', [[.05 + i * .022, .45, -.26], [.075 + i * .03, .68 + i * .025, -.25]], .005, 3)
    kit.box(g, '#5a7478', [.089 + i * .03, .68 + i * .025, -.25], [.04, .016, .023])
  }
}

function golf(kit: ModelKit, group: THREE.Group) {
  kit.land(group, '#d5dfbb', 1.70, .10, .10, 2.8, [1, 1, .94])
  kit.land(group, groundMaterial(kit, '#559655', 2.8), 1.52, .10, .20, 2.8, [1, 1, .94])
  kit.grass(group, '#3f854b', 44, 1.40, 2.8)
  const path: Point[] = [[-.88, .32, .94], [-.61, .34, .45], [-.02, .34, .02], [.27, .34, -.58], [.03, .34, -.99]]
  const rough = kit.curve(group, '#8eb37f', path, .33, 40); rough.scale.y = .19; rough.position.y = .272
  const fairway = kit.curve(group, '#a6c18a', path, .235, 40); fairway.scale.y = .21; fairway.position.y = .292
  // Alternating mown strips follow the fairway instead of reading as generic lawn.
  for (let i = 0; i < 7; i++) {
    const z = -.5 + i * .17
    const x = -.22 - z * .52
    const stripe = kit.sphere(group, i % 2 ? '#9fbd85' : '#acc58f', [x, .416, z], [.23, .005, .07])
    stripe.rotation.y = -.42
  }
  kit.sphere(group, '#bdce97', [.07, .384, -.83], [.36, .018, .29])
  kit.cylinder(group, '#526867', [.16, .405, -.82], .036, .036, .008, 14)
  kit.cylinder(group, '#eee7ca', [.16, .69, -.82], .012, .012, .59, 10)
  const flag = kit.box(group, '#dd9d83', [.27, .93, -.82], [.21, .13, .012]); flag.rotation.y = -.2
  kit.sphere(group, '#ede0ba', [-.41, .344, -.81], [.28, .014, .18])
  kit.sphere(group, '#efe1bd', [.49, .344, -.50], [.21, .015, .15])
  kit.sphere(group, '#81b7bc', [.78, .352, .29], [.36, .012, .46])
  kit.sphere(group, '#a2cecb', [.78, .364, .29], [.29, .004, .38])
  kit.box(group, '#95b078', [-.93, .369, .83], [.30, .022, .27])
  for (const x of [-1.07, -.81]) kit.sphere(group, '#e5c17d', [x, .406, .76], [.022, .022, .022])
  kit.person(group, [-.92, .39, .98], '#e7e7d5', 1.05, { golfing: true })
  kit.sphere(group, '#f7f5e8', [-.64, .397, 1.16], [.029, .029, .029])
  golfCart(kit, group, [.32, .32, .83])
  kit.curve(group, '#ddd5b7', [[.18, .335, 1.17], [.3, .335, .69], [.43, .335, -.06], [.91, .335, -.81]], .038)
  kit.resort(group, [.84, .30, -.98], '#7d9690', .73)
  for (const [x, z, s] of [[-1.1, -.87, .7], [-1.3, -.14, .8], [1.35, -.20, .6], [1.12, .82, .61]]) kit.tree(group, [x, .28, z], s)
  kit.car(group, [.97, .32, .99], true, -.55)
  // The keepsake golf ball has small modeled dimples, echoing the accessory supplied with the theme.
  kit.cylinder(group, '#ccbfa1', [-.16, .385, 1.24], .13, .14, .1, 16)
  const ballCenter: Point = [-.16, .52, 1.24]
  kit.sphere(group, '#f7f2df', ballCenter, [.115, .115, .115])
  for (let i = 0; i < 30; i++) {
    const y = 1 - (i + .5) / 30 * 2, r = Math.sqrt(1 - y * y), angle = i * 2.39996
    kit.sphere(group, '#dfdfd0', [ballCenter[0] + Math.cos(angle) * r * .114, ballCenter[1] + y * .114, ballCenter[2] + Math.sin(angle) * r * .114], [.009, .009, .009])
  }
  return airplane(kit, group)
}

function mountain(kit: ModelKit, parent: THREE.Object3D, position: Point, radius: number, height: number, seed: number) {
  const vertices: number[] = [], colors: number[] = [], indices: number[] = []
  const rings = 10, segments = 48
  const green = new THREE.Color('#82a598'), stone = new THREE.Color('#9aaead'), snow = new THREE.Color('#f7f6e7')
  for (let ring = 0; ring <= rings; ring++) for (let i = 0; i <= segments; i++) {
    const a = i / segments * Math.PI * 2, t = ring / rings
    const ridge = 1 + Math.sin(a * 5 + seed) * .11 + Math.sin(a * 9 - seed) * .04
    const r = t * radius * ridge
    const h = height * (1 - t) ** 1.15 + Math.sin(a * 5 + seed) * .10 * Math.sin(t * Math.PI)
    vertices.push(Math.cos(a) * r, h, Math.sin(a) * r * .8)
    const color = h > height * .71 ? snow : h > height * .3 ? stone : green
    const varied = color.clone().multiplyScalar(.96 + Math.sin(a * 4 + ring) * .045)
    colors.push(varied.r, varied.g, varied.b)
    if (ring < rings && i < segments) {
      const index = ring * (segments + 1) + i
      indices.push(index, index + segments + 1, index + 1, index + 1, index + segments + 1, index + segments + 2)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .69, transparent: true })
  return kit.mesh(parent, geometry, material, position)
}

function trekking(kit: ModelKit, group: THREE.Group) {
  kit.land(group, '#c5ccae', 1.7, .12, .10, 3.8, [1, 1, .94])
  kit.land(group, groundMaterial(kit, '#719d79', 3.8), 1.54, .10, .23, 3.8, [1, 1, .94])
  kit.grass(group, '#4f825f', 42, 1.42, 3.8)
  mountain(kit, group, [-.28, .32, -.58], .90, 1.93, .5)
  mountain(kit, group, [.69, .32, -.75], .67, 1.48, 1.8)
  mountain(kit, group, [-1.0, .32, -.55], .52, 1.13, 2.5)
  kit.curve(group, '#d9d4b6', [[-.99, .40, .82], [-.55, .44, .64], [-.2, .49, .48], [.05, .60, .18], [-.21, .83, -.02], [-.34, 1.00, -.29], [-.09, 1.25, -.48]], .047, 44)
  kit.curve(group, '#92bcc2', [[.99, .36, -.46], [.81, .35, .15], [.96, .35, .62], [.82, .3, 1.33]], .087, 36).scale.x = .65
  for (const [x, z, s] of [[-1.26, .11, .63], [-.97, .33, .83], [-.66, .96, .5], [.46, .96, .67], [1.26, .23, .70], [1.22, -.3, .56], [-1.26, -.42, .48], [.94, .84, .52]]) kit.tree(group, [x, .35, z], s, true)
  kit.person(group, [-.61, .47, .65], '#d39e77', .91, { backpack: true, scarf: true })
  const hiker = kit.person(group, [-.19, .55, .41], '#6894a6', .81, { backpack: true, scarf: true }); hiker.rotation.y = -.6
  kit.curve(group, '#a18c70', [[-.52, .72, .68], [-.48, .46, .78]], .007, 3)
  kit.cylinder(group, '#b19170', [-.92, .68, 1.04], .022, .022, .58, 10)
  for (const [y, angle] of [[.84, -.25], [.71, .3]]) {
    const sign = kit.box(group, '#ebd7af', [-.9, y, 1.04], [.28, .075, .025]); sign.rotation.y = angle
  }
  // Planked suspension bridge with sagging rope rails crosses the stream.
  for (let i = 0; i < 12; i++) {
    const t = i / 11, x = .34 + .96 * t, y = .43 - Math.sin(t * Math.PI) * .055
    kit.box(group, '#b99b79', [x, y, .54], [.072, .023, .26])
  }
  for (const x of [.33, 1.31]) for (const z of [.40, .68]) kit.cylinder(group, '#9b8568', [x, .55, z], .018, .020, .37, 9)
  for (const z of [.4, .68]) {
    kit.curve(group, '#d4c29f', [[.33, .73, z], [.80, .61, z], [1.31, .73, z]], .009, 24)
    for (let i = 1; i < 8; i++) kit.curve(group, '#b8a68a', [[.33 + i * .12, .43 - Math.sin(i / 8 * Math.PI) * .055, z], [.33 + i * .12, .73 - Math.sin(i / 8 * Math.PI) * .12, z]], .005, 3)
  }
  kit.resort(group, [-1.04, .35, 1.0], '#947b64', .38)
  kit.car(group, [-.16, .32, 1.28], true, .4)
  return paraglider(kit, group)
}

export function createThemeScene(mood: GlobeMood): ThemeScene {
  const kit = new ModelKit(), group = new THREE.Group()
  group.name = `CUTY ${mood} miniature`
  const waterColor = mood === 'honeymoon' ? '#54bfd4' : mood === 'golf' ? '#65b6a7' : mood === 'family' ? '#67b4c5' : '#5ca4b6'
  const waterTexture = proceduralTexture(kit, 'water', moodsIndex(mood))
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: waterColor, roughness: .15, metalness: .03, clearcoat: 1,
    clearcoatRoughness: .065, bumpMap: waterTexture, bumpScale: .028, transparent: true, opacity: 1,
  })
  const water = kit.cylinder(group, waterMaterial, [0, -.175, 0], 2.01, 1.76, .64, 72)
  water.receiveShadow = true
  const waterSurface = kit.mesh(group, new THREE.CircleGeometry(1.98, 72), new THREE.MeshPhysicalMaterial({
    color: waterColor, roughness: .065, metalness: .02, clearcoat: 1,
    clearcoatRoughness: .03, bumpMap: waterTexture, bumpScale: .045, transparent: true, opacity: .40, depthWrite: false,
  }), [0, .151, 0])
  waterSurface.rotation.x = -Math.PI / 2
  waterSurface.receiveShadow = false
  waterSurface.renderOrder = 2
  const builder = { honeymoon, family, golf, trekking }[mood]
  const flyer = builder(kit, group)
  const accents: THREE.Mesh[] = []
  for (let i = 0; i < 4; i++) {
    const ripple = kit.mesh(group, new THREE.TorusGeometry(.23 + i * .055, .005, 5, 44, Math.PI * 1.45), '#d3ece7', [1.18, .145, .88])
    ripple.rotation.x = Math.PI / 2
    ripple.rotation.z = -.8
    accents.push(ripple)
  }
  const shoreline = kit.mesh(group, new THREE.TorusGeometry(1.88, .018, 8, 96), new THREE.MeshBasicMaterial({ color: '#dff5f1', transparent: true, opacity: .42, depthWrite: false }), [0, .16, 0])
  shoreline.rotation.x = Math.PI / 2
  shoreline.renderOrder = 3
  for (const [x, y, z, s] of [[-1.15, 2.48, -.42, .30], [.80, 2.67, -.83, .22]]) {
    for (const dx of [-.16, 0, .15]) kit.sphere(group, '#edf5f0', [x + dx, y + (dx === 0 ? .05 : 0), z], [s * .65, s * .39, s * .41])
  }
  return { mood, group, kit, flyer, accents, waterTexture }
}

function moodsIndex(mood: GlobeMood) {
  return ({ honeymoon: .7, family: 1.9, golf: 3.1, trekking: 4.3 })[mood]
}
