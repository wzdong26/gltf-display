import Stats from 'three/examples/jsm/libs/stats.module.js'

const stats = new Stats()
function render() {
  // 更新帧数
  stats.update()
  requestAnimationFrame(render)
}
render()
stats.setMode(0)
document.body.appendChild(stats.dom)
stats.dom.style.top = '.3em'
stats.dom.style.left = '.3em'