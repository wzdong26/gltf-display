import { Viewer } from './Viewer.js'

export class Configurator {
  /** @type {Viewer} */
  viewer
  _conf = {
    bgColor: '#ffffff', bgOpacity: 1, enableCtrl: true, rotate: 0,
    lightColor: '#ffffff', lightIntensity: 1,
    wireframe: false, boxHelper: false, zoom: 0.5, alpha: 0.2,
    animationSpeed: 1
  }
  /** @type {typeof this._conf & { src: string; animations: string[]; }} */
  conf = {}
  /** @param {{ defaultConf: boolean; container: Element; }} */
  constructor({ defaultConf, container } = {}) {
    const canvas = document.createElement('canvas')
    this.viewer = new Viewer({ renderer: { canvas } })
    {
      canvas.style.display = 'block'
      canvas.style.width = '100%'
      canvas.style.height = '100%'
    }
    (container ?? document.body).appendChild(canvas)
    if (defaultConf) {
      this.conf = this._conf
    }
    this.watchConf()
  }
  watchConf() {
    const { viewer, conf } = this
    const p = {
      bgColor(v) {
        viewer.setBgColor(v, conf.bgOpacity)
      },
      bgOpacity(v) {
        viewer.setBgColor(conf.bgColor, v)
      },
      enableCtrl: viewer.enableCtrl.bind(viewer),
      rotate: viewer.autoRotate.bind(viewer),
      lightColor(color) {
        viewer.setLight({ color })
      },
      lightIntensity(intensity) {
        viewer.setLight({ intensity })
      },
      src(url) {
        viewer.loadGLTF(url)
      },
      model([url, blobs] = []) {
        viewer.loadGLTF(url, blobs)
      },
      wireframe(v) {
        viewer.gltfWireFrame(v)
      },
      boxHelper(v) {
        v ? viewer.gltfBoxHelper() : viewer.gltfBoxHelper().dispose()
      },
      zoom: (v) => viewer.gltfAlignCenter({ zoom: v }),
      alpha: (v) => viewer.gltfAlignCenter({ alpha: v }),
      animations: (v) => {
        viewer.gltfAnimate(v)
      },
      animationSpeed(v) {
        viewer.mixer().timeScale = v
      }
    }
    const watchSetFn = (fn, _v) => {
      return {
        set(v) {
          if (fn.call(this, v) === false) {
            return _v
          }
          return (_v = v)
        },
        get() {
          return _v
        }
      }
    }
    const propertiesF = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, watchSetFn(v, conf[k])]))
    Object.defineProperties(conf, propertiesF)
  }
  /** @param {typeof this.conf} conf */
  setConf(conf) {
    Object.assign(this.conf, conf)
  }
}
