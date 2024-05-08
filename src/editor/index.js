import { Configurator, onGLTFLoad } from '@lib/gltfDisplay'
import { readDirFiles } from '@lib/readDirFiles'
import { saveBlob } from '@lib/saveBlob'
import { validGLTF } from '@lib/validGLTF'
import { GUI } from 'dat.gui'
import { showInfo } from './styles'
import './stats'
import './index.css'

const form = document.querySelector('form')

const gui = new GUI()
gui.close()

keyboardEvt();
function keyboardEvt() {
  document.addEventListener('keydown', function (event) {
    const { key, ctrlKey, altKey } = event;
    if (key === 'g' && ctrlKey) {
      event.preventDefault();
      form.hidden = !form.hidden;
    }
  });
}

const { viewer, conf } = new Configurator({ defaultConf: true })

  ;[form, viewer.canvas].map(e =>
    e.addEventListener('touchend', gui.close.bind(gui))
  )

const { addScreenCaptureItem, addShareItem } = (function addBasicFolder() {
  const basicFolder = gui.addFolder('Basic')
  basicFolder.add({
    home() {
      form.hidden = !form.hidden
    }
  }, 'home')

  const basicOptions = { imgPixelRatio: window.devicePixelRatio }

  let screenCaptureItem, shareItem
  return {
    addScreenCaptureItem() {
      screenCaptureItem && basicFolder.remove(screenCaptureItem)
      screenCaptureItem = basicFolder.add({
        async saveImg() {
          const { canvas } = viewer
          const { imgPixelRatio: pixelRatio } = basicOptions
          await viewer.render({ pixelRatio })
          canvas.toBlob((blob) => {
            saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`)
            Promise.resolve().then(() => viewer.render())
          })
        }
      }, 'saveImg')
      basicFolder.add(basicOptions, 'imgPixelRatio', 0.5, 3)
    },
    addShareItem(modelUrl) {
      shareItem && basicFolder.remove(shareItem)
      shareItem = modelUrl && basicFolder.add({
        share() {
          if (!modelUrl) return
          let search = `src=${encodeURIComponent(modelUrl)}&`
          const { model, animations, bgColor, bgOpacity, lightColor, lightIntensity, ...newConf } = conf
          search += animations ? `animations=${encodeURIComponent(animations.join(','))}&` : ''
          search += `bgColor=${encodeURIComponent(bgColor) + ',' + encodeURIComponent(bgOpacity)}&`
          search += `light=${encodeURIComponent(lightColor) + ',' + encodeURIComponent(lightIntensity)}&`
          Object.entries(newConf).forEach(([k, v]) => {
            if (!v) return
            search += `${k}=${encodeURIComponent(v)}&`
          })
          window.open(new URL(`../?${search}`, location.href))
        }
      }, 'share')
    }
  }
})()

{
  const sceneFolder = gui.addFolder('Scene')
  sceneFolder.addColor(conf, 'bgColor')
  sceneFolder.add(conf, 'bgOpacity', 0, 1)
  sceneFolder.add(conf, 'enableCtrl')
  sceneFolder.add(conf, 'rotate', -100, 100)
}

{
  const lightFolder = gui.addFolder('Light')
  lightFolder.addColor(conf, 'lightColor')
  lightFolder.add(conf, 'lightIntensity', 0, 8)
}

{
  const modelFolder = gui.addFolder('Model')
  modelFolder.add(conf, 'wireframe')
  modelFolder.add(conf, 'boxHelper')
  modelFolder.add(conf, 'zoom', 0, 2)
  modelFolder.add(conf, 'alpha', 0, 2)
}

let animationsFolder
function addAnimationsGUI(animations) {
  try {
    gui.removeFolder(animationsFolder)
  } catch { }
  if (!animations?.length) return
  animationsFolder = gui.addFolder('Animations')
  animationsFolder.add(conf, 'animationSpeed', 0, 2)
    ; animations.forEach(({ name }, idx) => {
      const opts = { [name]: false }
      if (idx === 0) {
        opts[name] = true
        conf.animations = [name]
      }
      animationsFolder.add(opts, name).name(`${idx + 1}. ${name}`)
        .onChange(v => {
          if (v) {
            conf.animations = [...conf.animations, name]
          } else {
            const idx = conf.animations.indexOf(name)
            if (idx >= 0) {
              conf.animations.splice(idx, 1)
              conf.animations = [...conf.animations]
            }
          }
        })
    })
}

const loadGLTF = (...p) => {
  const { loadingTime, progressTime, cleaup } = calcLoadTime()
  const pending = viewer.loadGLTF(...p)
  pending.then(({ animations }) => {
    addScreenCaptureItem()
    addAnimationsGUI(animations)
    form.hidden = true
    gui.open()
  }, (e) => {
    console.error('Load glTF error:', e)
    form.hidden = false
  })
  pending.then(cleaup)
  validGLTF(...p).then(async e => {
    const { info } = e
    const { resources, ...ifo } = info
    await pending;
    showInfo({ ...ifo, loadingTime: loadingTime(), progressTime: progressTime() })
  })
}

function calcLoadTime() {
  const cleaup0 = onGLTFLoad('onStart', (evt) => {
    loadingTime.first ??= performance.now()
  })
  // 加载loading
  let loadingTime = {}
  const cleaup1 = onGLTFLoad('onLoading', (evt) => {
    const nowTime = performance.now()
    loadingTime.first ??= nowTime
    loadingTime.gap = nowTime - loadingTime.first
    progressTime.first = nowTime
  })
  // 渲染loading
  let progressTime = {}
  const cleaup2 = onGLTFLoad('onProgress', (url, loaded, total) => {
    const nowTime = performance.now()
    progressTime.first ??= loadingTime.last
    progressTime.gap = nowTime - progressTime.first
  })
  return {
    loadingTime: () => +((loadingTime.gap).toFixed(2)),
    progressTime: () => +((progressTime.gap).toFixed(2)),
    cleaup() {
      cleaup0()
      cleaup1()
      cleaup2()
    }
  }
}

onUploadGLTF(loadGLTF, console.error)
onDragDropGLTF(loadGLTF, console.error)

function onUploadGLTF(onLoad, onError) {
  const [fileBtn, urlInput, fileInput] = form
  fileInput.addEventListener('change', ({ target }) => {
    const { files } = target
    for (const file of files) {
      if (file.name.match(/\.gl(b|tf)$/)) {
        onLoad?.(file.name, { [file.name]: file })
        return
      }
    }
    onError?.('Not gltf')
  })
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    addShareItem(urlInput.value)
    onLoad?.(urlInput.value)
  })
}

function onDragDropGLTF(onLoad, onError) {
  const dropArea = document.body
  dropArea.addEventListener('dragenter', ondragenter)
  function ondragenter(evt) {
    dropArea.classList.add('dragging-hover')
    if (evt.target !== dropArea) return
    const ondragover = (evt) => evt.preventDefault()
    const onEnd = (evt) => {
      evt.preventDefault()
      if (evt.target === dropArea) {
        dropArea.classList.remove('dragging-hover')
        cleanup()
      }
    }
    dropArea.addEventListener('dragover', ondragover)
      ;['dragleave', 'drop', 'click'].forEach(e => {
        dropArea.addEventListener(e, onEnd)
      })
    function cleanup() {
      dropArea.removeEventListener('dragover', ondragover)
        ;['dragleave', 'drop', 'click'].forEach(e => {
          dropArea.removeEventListener(e, onEnd)
        })
    }
    return cleanup
  }
  dropArea.addEventListener('drop', async ({ dataTransfer }) => {
    const { items } = dataTransfer || {} // 获取文件列表
    const files = await Promise.all(await readDirFiles(items))
    const blobs = {}
    let gltfFile
    files.forEach(({ file, fullPath }) => {
      blobs[fullPath] = file
      if (fullPath.match(/\.gl(b|tf)$/)) {
        gltfFile = fullPath
      }
    })
    if (gltfFile) {
      onLoad?.(gltfFile, blobs)
    } else {
      onError?.('Not gltf')
    }
  }, false)
}
