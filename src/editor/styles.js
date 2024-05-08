import { onGLTFLoad } from '@lib/gltfDisplay'
import ChevronsUpIcon from '/chevrons-up.svg?raw'
import ChevronsDownIcon from '/chevrons-down.svg?raw'

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
    const fileInput = document.querySelector('.file-input')
    const urlInput = document.getElementById('urlInput')
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

  // ================== gltf info ===================
  ; (function showInfoBtn() {
    const infoPanelBtn = document.querySelector('.info-panel-btn')
    const infoPanel = document.querySelector('.gltf-info')
    infoPanelBtn.innerHTML = infoPanel.hidden ? ChevronsDownIcon : ChevronsUpIcon
    infoPanelBtn.addEventListener('click', () => {
      infoPanel.hidden = !infoPanel.hidden
      infoPanelBtn.innerHTML = infoPanel.hidden ? ChevronsDownIcon : ChevronsUpIcon
    })
  })()

export function showInfo(info) {
  const infoPanel = document.querySelector('.gltf-info')
  infoPanel.hidden = false
  infoPanel.innerHTML = `
  <ul>
    ${Object.entries(info).map(([k, v]) => {
    return `<li><span>${k}</span>: <span>${JSON.stringify(v, undefined, 2)}</span></li>`
  }).join('')}
  </ul>
    `
}
