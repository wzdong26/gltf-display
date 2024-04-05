
import { Configurator, onGLTFLoad } from '@lib/gltfDisplay'
import { readDirFiles } from '@lib/readDirFiles.js'
import { GUI } from 'dat.gui'
import './index.css'

const form = document.querySelector('form')
const [fileInput, urlInput] = form

const gui = new GUI()
gui.close()

const configurator = new Configurator(true)
const { viewer, conf } = configurator

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
  const saveBlob = (function () {
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style.display = 'none'
    return function saveData(blob, fileName) {
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = fileName
      a.click()
    }
  }())

  let screenCaptureItem, shareItem
  return {
    addScreenCaptureItem() {
      screenCaptureItem && basicFolder.remove(screenCaptureItem)
      screenCaptureItem = basicFolder.add({
        async screenCapture() {
          await viewer.render()
          const { canvas } = viewer
          canvas.toBlob((blob) => {
            saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`)
          })
        }
      }, 'screenCapture')
    },
    addShareItem(modelUrl) {
      shareItem && basicFolder.remove(shareItem)
      shareItem = modelUrl && basicFolder.add({
        share() {
          if (!modelUrl) return
          let search = `model=${encodeURIComponent(modelUrl)}&`
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
  modelFolder.add(conf, 'wireFrame')
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
  viewer.loadGLTF(...p).then(({ animations }) => {
    addScreenCaptureItem()
    addAnimationsGUI(animations)
    form.hidden = true
  }, (e) => {
    console.error('Load glTF error:', e)
    form.hidden = false
  })
}

onUploadGLTF(loadGLTF, console.error)
onDragDropGLTF(loadGLTF, console.error)

  // =================== loading ===================
  ; (function createLoading() {
    const loadingT = document.querySelector('.loading')

    const progress = loadingT.querySelector('.progress')
    document.createElement('div')

    setLoading(false)

    let startCount
    onGLTFLoad('onStart', (url, loaded, total) => {
      startCount = total
      setLoading(true)
    })
    let _total
    // 加载loading
    onGLTFLoad('onLoading', (evt) => {
      const { loaded, total = _total, lengthComputable } = evt
      progress.style.setProperty('--progress', Math.min((loaded / total).toFixed(3), 1) * 0.7)
      _total = total
    })
    // 渲染loading
    onGLTFLoad('onProgress', (url, loaded, total) => {
      const v = ((loaded - startCount) / (total - startCount)).toFixed(3) * 0.3 + 0.7
      progress.style.setProperty('--progress', v)
    })
      ;['onLoad', 'onError'].map(e => onGLTFLoad(e, () => setLoading(false)))

    function setLoading(flag) {
      loadingT.hidden = !flag
      progress.style.setProperty('--progress', +!flag)
    }
  })()

  // ================== gltf input ===================
  ; (function onUrlInput() {
    const urlDemo = document.querySelector('.url-recommend')
    const inputEvent = new Event('input', { bubbles: true })
    urlDemo.addEventListener('click', ({ target }) => {
      if (target.tagName === 'LI') {
        urlInput.value = target.innerText
        urlInput.dispatchEvent(inputEvent)
        urlInput.scrollBy({ left: 999 })
      }
    })
    urlInput.addEventListener('input', ({ target }) => {
      fileInput.setAttribute('type', target.value ? 'submit' : 'button')
      const [label] = fileInput.children
      label.setAttribute('for', target.value ? '' : 'fileInput')
      label.innerHTML = target.value ? '<output>Submit</output>' : 'Upload'
      urlDemo.hidden = !!target.value
      urlDemo.hidden && (isPointerover = false)
    })
    urlInput.addEventListener('focus', ({ target }) => {
      if (!target.value) {
        urlDemo.hidden = false
      }
    })
    urlInput.addEventListener('blur', () => {
      if (!isPointerover) {
        urlDemo.hidden = true
      }
    })
    let isPointerover
    urlDemo.addEventListener('pointerenter', () => {
      isPointerover = true
    })
    urlDemo.addEventListener('pointerleave', (evt) => {
      isPointerover = evt.pointerType !== 'mouse'
    })
  })()

function onUploadGLTF(onLoad, onError) {
  const fileInputOrigin = document.getElementById('fileInput')
  fileInputOrigin.addEventListener('change', ({ target }) => {
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
