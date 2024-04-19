
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  LoadingManager,
  REVISION,
  Box3,
  Vector3,
  BoxHelper,
  AnimationMixer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

/**
 * @typedef {{fov: number, near: number, far: number}} PerspectiveCameraOptions
 * @typedef {import('three').WebGLRendererParameters} WebGLRendererParameters
 * @typedef {import('three').ColorRepresentation} ColorRepresentation
 * @typedef {import('three/examples/jsm/loaders/GLTFLoader.js').GLTF} GLTF
 */

const GLTF_LOADER = initGLTFLoader()

/**
 * @type {<T extends 'onProgress' | 'onStart' | 'onError' | 'onLoad' | 'onLoading'>(evtName: T, fn: typeof GLTF_LOADER[T]) => () => void}
 */
export const onGLTFLoad = (evtName, fn) => {
  GLTF_LOADER[evtName] = fn
  return () => { GLTF_LOADER.onProgress = null }
}

export class Viewer {
  /** @property {Scene} */
  scene
  /** @property {PerspectiveCamera} */
  camera
  /** @property {WebGLRenderer} */
  renderer
  /** @type {OrbitControls} */
  controls
  /** @type {import('three').Light} */
  light
  /** @type {GLTF} */
  gltf
  /** @private gltf state */
  _gltfState = {
    zoom: 0.5,
    alpha: 0.2,
    wireframe: false,
    /** @type {BoxHelper} */
    boxHelper: null,
    /** @type {AnimationMixer & {destroy: () => void}} */
    mixer: null,
    /** @type {string[]} */
    animations: null,
    /** @type {number} */
    animTimeScale: undefined,
  }

  /** @param {{camera: PerspectiveCameraOptions; renderer: WebGLRendererParameters}} */
  constructor({ camera: { fov, near, far } = {}, renderer = {} } = {}) {
    this.scene = new Scene()
    this.camera = new PerspectiveCamera(fov ?? 75, 2, near ?? 0.1, far ?? 10000)
    this.renderer = new WebGLRenderer({ ...renderer, antialias: true, alpha: true })
    this.canvas = this.renderer.domElement
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.addEventListener('change', this.render.bind(this))
    window?.addEventListener('resize', this.render.bind(this))
    this.light = new AmbientLight()
    this.scene.add(this.light)
    GLTF_LOADER.ktx2LoaderDetectSupport(this.renderer)
  }
  render = rafDebounce(({ delta }, ...args) => {
    this._resizeToDisplaySize()
    this.controls.update()
    this._gltfState.mixer && this._gltfState.mixer.update(delta / 1000)
    this.renderer.render(this.scene, this.camera)
  })
  /**@private */
  _resizeToDisplaySize() {
    const { width, clientWidth, height, clientHeight } = this.canvas
    const needResize = clientWidth !== width || clientHeight !== height
    if (needResize) {
      this.renderer.setSize(clientWidth, clientHeight, false)
      this.camera.aspect = clientWidth / clientHeight
      this.camera.updateProjectionMatrix()
    }
    return needResize
  }
  /**
   * @param {ColorRepresentation} color 
   * @param {number} alpha 
   */
  setBgColor(color, alpha) {
    this.renderer.setClearColor(color, alpha)
    this.render()
  }
  /** @param {number} speed */
  autoRotate(speed) {
    this.controls.autoRotate = !!speed
    this.controls.autoRotateSpeed = speed
    this.render()
  }
  /** @param {boolean} enabled */
  enableCtrl(enabled) {
    this.controls.enabled = enabled
    this.render()
  }
  /** @param {{color: ColorRepresentation; intensity: number}} */
  setLight({ color, intensity } = {}) {
    color != null && (this.light.color.set(color))
    intensity != null && (this.light.intensity = intensity)
    this.render()
  }
  /**
   * @param {string} url 
   * @param {Record<string, Blob>} blobs 
   */
  async loadGLTF(url, blobs) {
    this.unloadGLTF()
    this.gltf = await GLTF_LOADER.load(url, blobs)
    this.scene.add(this.gltf.scene)

    this.gltfAlignCenter()
    const { wireframe, boxHelper } = this._gltfState
    wireframe && this.gltfWireFrame(wireframe)
    boxHelper?.setFromObject(this.gltf.scene)
    this.gltfAnimate()

    this.render()
    return this.gltf
  }
  unloadGLTF() {
    this.mixer().destroy?.()
    const { gltf } = this
    gltf && this.scene.remove(gltf.scene)
    this.gltf = null
    this.render()
    return !gltf
  }

  /** @param {{zoom: number; alpha: number}} */
  gltfAlignCenter({ zoom, alpha } = {}) {
    const { _gltfState } = this
    if (zoom != null) _gltfState.zoom = zoom
    if (alpha != null) _gltfState.alpha = alpha
    const { zoom: _zoom, alpha: _alpha } = _gltfState
    if (!this.gltf) return false
    const model = this.gltf.scene
    model.updateMatrixWorld() // important! 更新模型的世界矩阵
    const box = new Box3().setFromObject(model)
    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3()).length()
    this.controls.maxDistance = size * 10
    this.controls.minDistance = size / 100
    this.camera.near = size / 100
    this.camera.far = size * 100
    this.camera.position.copy(center)
    this.camera.position.x += size * (zoom ?? _zoom)
    this.camera.position.y += size * (alpha ?? _alpha)
    this.camera.position.z += size * (zoom ?? _zoom)
    this.camera.updateProjectionMatrix() // important! 更新相机的投影矩阵
    this.controls.target = center
    this.render()
  }
  /** @param {boolean} wireframe */
  gltfWireFrame(wireframe) {
    this._gltfState.wireframe = wireframe
    if (!this.gltf) return false
    const model = this.gltf.scene
    model.traverse((node) => {
      if (!node.geometry) return
      const materials = Array.isArray(node.material) ? node.material : [node.material]
      materials.forEach((material) => {
        material.wireframe = wireframe
      })
    })
    this.render()
  }
  /** @param {ColorRepresentation} color */
  gltfBoxHelper(color) {
    const { boxHelper } = this._gltfState
    if (color == null && boxHelper) return boxHelper
    const box = new BoxHelper(this.gltf?.scene, color)
    this._gltfState.boxHelper = box
    this.scene.add(box)
    const dispose = box.dispose.bind(box)
    this.render()
    return Object.assign(box, {
      dispose: () => {
        this.scene.remove(box)
        dispose()
        this._gltfState.boxHelper = null
        this.render()
      }
    })
  }
  mixer() {
    const { mixer, animTimeScale } = this._gltfState
    if (mixer) return mixer
    const nullRst = Object.defineProperties({ timeScale: animTimeScale }, {
      timeScale: {
        set: (v) => {
          this._gltfState.animTimeScale = v
          return v
        }
      }
    })
    if (!this.gltf) return nullRst
    const { animations, scene } = this.gltf
    if (!animations?.length) return nullRst
    const mMixer = new AnimationMixer(scene)
    this._gltfState.mixer = mMixer
    if (animTimeScale) {
      mMixer.timeScale = animTimeScale
    }
    const timer = setInterval(this.render.bind(this))
    return Object.assign(mMixer, {
      destroy: () => {
        clearInterval(timer)
        mMixer.stopAllAction()
        this._gltfState.animations = null
        mMixer.uncacheRoot(mMixer.getRoot())
        this._gltfState.mixer = null
        this._gltfState.animTimeScale = undefined
      }
    })
  }
  /** @param {string[]} names */
  gltfAnimate(names) {
    const animationsMap = {}
    if (names) {
      this._gltfState.animations?.forEach(e => {
        animationsMap[e] = false
      })
      this._gltfState.animations = [...names]
    } else {
      names = this._gltfState.animations
    }
    if (!this.gltf || !names) return false
      ; names.forEach(e => {
        animationsMap[e] = true
      })
    const { animations } = this.gltf
    for (const clip of animations) {
      if (animationsMap[clip.name]) {
        const action = this.mixer().clipAction?.(clip)
        action?.reset().play()
      }
      if (animationsMap[clip.name] === false) {
        this.mixer().uncacheAction?.(clip)
      }
    }
  }
}

/**
 * initGLTFLoader: 创建 glTF Loader
 * @param {{renderer: WebGLRenderer; threePath: string}} param
 * @returns 
 */
function initGLTFLoader({
  renderer,
  threePath = `https://unpkg.com/three@0.${REVISION}.x`
} = {}) {
  const manager = new LoadingManager()
  const dracoLoader = new DRACOLoader(manager).setDecoderPath(
    `${threePath}/examples/jsm/libs/draco/gltf/`,
  )
  const ktx2Loader = new KTX2Loader(manager).setTranscoderPath(
    `${threePath}/examples/jsm/libs/basis/`,
  )
  /** @param {WebGLRenderer} renderer */
  function ktx2LoaderDetectSupport(renderer) {
    ktx2Loader.detectSupport(renderer)
  }
  renderer && ktx2LoaderDetectSupport(renderer)
  const loader = new GLTFLoader(manager)
    .setCrossOrigin('anonymous')
    .setDRACOLoader(dracoLoader)
    .setKTX2Loader(ktx2Loader)
    .setMeshoptDecoder(MeshoptDecoder)
  /**@param {ProgressEvent<EventTarget>} evt */
  function onLoading(evt) { }
  const mm = Object.assign(manager, { onLoading })
  return Object.assign(manager, {
    ktx2LoaderDetectSupport,
    /**
     * @param {string} gltfUrl 
     * @param {Record<string, Blob>} blobs 
     */
    load(gltfUrl, blobs) {
      const objectURLs = []
      manager.setURLModifier((url) => {
        const blob = blobs?.[url]
        if (blob) {
          url = URL.createObjectURL(blob)
        }
        objectURLs.push(url)
        return url
      })
      const cleanup = () => objectURLs.forEach((url) => URL.revokeObjectURL(url))
      return new Promise((resolve, reject) => {
        loader.load(gltfUrl, (data) => {
          resolve(data)
          cleanup()
        }, (e) => mm.onLoading?.(e), (err) => {
          reject(err)
          cleanup()
        })
      })
    }
  })
}

/**
 * requestAnimationFrame debounce: 在一个动画帧内的频繁事件仅在下一次重绘前执行一次
 * @type {<T extends any[], R>(cb: (t: {time: number; delta: number}, ...args: T) => R) => (...args: T) => Promise<R>}
 */
function rafDebounce(cb) {
  let pending
  let prevTime = 0
  return function (...args) {
    if (pending) return pending
    return (pending = new Promise((resolve, reject) =>
      requestAnimationFrame((time) => {
        pending = null
        const delta = time - prevTime
        resolve(
          cb?.call(this, { time, delta }, ...args)
        )
        prevTime = time
      })
    ))
  }
}
