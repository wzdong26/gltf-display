import { Configurator } from '@lib/gltfDisplay'

main()

function main() {
  const configurator = new Configurator()
  configurator.setConf(getSearchParams())
}

// =================== searchParams input ===================
function getSearchParams() {
  const { href } = location
  const { searchParams } = new URL(href)
  const searchP = Object.fromEntries(searchParams.entries())

  if (!searchP.model) {
    alert('未指定glTF，请在url query串中添加model参数！')
    return {}
  }

  searchP.model = [searchP.model]
  searchP.enableCtrl = searchP.enableCtrl != null
    ;['boxHelper', 'wireFrame'].forEach((e) => {
      if (searchP[e] != null) {
        searchP[e] = true
      }
    })

  searchP.rotate = str2Num(searchP.rotate, [-100, 100])
  searchP.zoom = str2Num(searchP.zoom, [1e-4])
  searchP.alpha = str2Num(searchP.alpha, [1e-4])
  searchP.animationSpeed = str2Num(searchP.animationSpeed, [0, 3])

  const [backgroundColorStr, backgroundOpacityStr] = searchP.bgColor?.split(/[,，]/) || []
  const [bgColor, bgOpacity] = [str2Color(backgroundColorStr), str2Num(backgroundOpacityStr, [0, 1])]

  const [lightColorStr, lightIntensityStr] = searchP.light?.split(/[,，]/) || []
  searchP.light = undefined
  const [lightColor, lightIntensity] = [str2Color(lightColorStr), str2Num(lightIntensityStr, [0], Boolean)]

  const animations = searchP.animations?.split(/[,，]/)

  const rst = JSON.parse(JSON.stringify({ ...searchP, bgColor, bgOpacity, lightColor, lightIntensity, animations }))
  return rst
}

// =================== common utils ===================
/**
 * 'fff' / 'ffffff' -> 0xffffff
 * @param {string} str 长度 3 or 6 的hex颜色字符串
 * @returns color 16进制hex色彩值
 */
function str2Color(str) {
  if (str?.startsWith('#') && [4, 7].includes(str.length)) return str
  if (str?.length === 3) {
    str = [...str].map(e => e.repeat(2)).join('')
  }
  let color
  if (str?.length === 6) {
    color = parseInt(str, 16)
    if (Number.isNaN(color)) {
      color = undefined
    }
  }
  return color
}

/**
 * 字符串转数字: 非法字符串返回 undefined
 * @param {string} str 
 * @param {[min: number, max: number]} minmax 
 * @param {(str: string, num: string) => boolean} condition 
 * @returns 
 */
function str2Num(str, [min, max] = [], condition) {
  let num = +str
  const z = !Number.isNaN(num) &&
    num <= (max ?? num) &&
    num >= (min ?? num) &&
    !condition || condition?.(str, num)
  if (z)
    return num
}
