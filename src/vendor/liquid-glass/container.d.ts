export default class Container {
  constructor(options?: {borderRadius?:number;type?:'rounded'|'pill'|'circle';tintOpacity?:number})
  element: HTMLDivElement
  canvas: HTMLCanvasElement
  render?: () => void
  updateSizeFromDOM(): void
  destroy(): void
}
