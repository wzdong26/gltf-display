import { Viewer } from './Viewer.js'

export class ViewerConfigurator {
  /** @type {Viewer} */
  viewer
  _conf = {
    bgColor: '#ffffff', bgOpacity: 1, enableCtrl: true, rotate: 0,
    lightColor: '#ffffff', lightIntensity: 1,
    wireFrame: false, boxHelper: false, zoom: 0.5, alpha: 0.2,
    animationSpeed: 1
  }
  /** @type {typeof this._conf} */
  conf = {}
  constructor(addDefaultConf) {
    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    this.viewer = new Viewer({ renderer: { canvas } })
    document.body.appendChild(canvas)
    if (addDefaultConf) {
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
      model([url, blobs] = []) {
        viewer.loadGLTF(url, blobs)
      },
      wireFrame(v) {
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
