import * as THREE from 'three'

/**
 * 补地印章生成与材质构建模块 (Nadir Patch)
 * 支持纯 Canvas 矢量动态绘制（双层同心圆、圆弧环绕文字、中心徽标、渐变色）
 */

/**
 * 动态绘制印章 Canvas
 * @param {Object} options 配置项
 * @param {string} options.text 环绕文字，例如 "genting拍摄"
 * @param {string} options.subText 底部小字，例如 "720° VR"
 * @param {string} options.centerText 中心文字，例如 "VR"
 * @param {string} options.bgColor 圆盘背景色
 * @param {string} options.textColor 文字颜色
 * @param {string} options.borderColor 边框线条颜色
 * @param {number} options.size Canvas 像素尺寸 (默认 512x512)
 * @returns {HTMLCanvasElement}
 */
export function createStampCanvas({
  text = 'genting拍摄',
  subText = '720° SPATIAL PANORAMA',
  centerText = '720°',
  bgColor = 'rgba(11, 19, 41, 0.90)',
  textColor = '#38bdf8',
  borderColor = '#38bdf8',
  size = 1024
} = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const center = size / 2
  const outerRadius = size * 0.44
  const innerRadius = size * 0.36
  const centerRingRadius = size * 0.20

  // 1. 底盘背景绘制（微透明圆盘 + 外边缘主边框）
  ctx.save()
  ctx.beginPath()
  ctx.arc(center, center, outerRadius, 0, Math.PI * 2)
  ctx.fillStyle = bgColor
  ctx.fill()

  // 外边缘主边框
  ctx.lineWidth = Math.round(size * 0.014)
  ctx.strokeStyle = borderColor
  ctx.stroke()
  ctx.restore()

  // 2. 双同心虚线装饰环
  ctx.save()
  ctx.beginPath()
  ctx.arc(center, center, innerRadius, 0, Math.PI * 2)
  ctx.lineWidth = Math.round(size * 0.0055)
  ctx.strokeStyle = borderColor
  ctx.setLineDash([Math.round(size * 0.018), Math.round(size * 0.014)])
  ctx.stroke()
  ctx.restore()

  // 3. 核心：上半圆弧形环绕文字 (顺时针，顶部居中对称排布)
  if (text) {
    ctx.save()
    ctx.fillStyle = textColor
    const fontSize = Math.round(size * 0.068)
    ctx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const chars = text.split('')
    const arcRadius = (outerRadius + innerRadius) / 2
    // 每个字符所占弧度步长（根据字数自适应）
    const charSpacing = 0.22
    const totalArc = (chars.length - 1) * charSpacing
    const startAngle = -Math.PI / 2 - totalArc / 2

    chars.forEach((char, i) => {
      const angle = startAngle + i * charSpacing
      ctx.save()
      ctx.translate(center + Math.cos(angle) * arcRadius, center + Math.sin(angle) * arcRadius)
      // 旋转切线：角度 + PI/2 让文字字底朝向圆心，字头朝外
      ctx.rotate(angle + Math.PI / 2)
      ctx.fillText(char, 0, 0)
      ctx.restore()
    })
    ctx.restore()
  }

  // 4. 下半圆弧形环绕辅助小字 (可选副标，字头朝向圆心)
  if (subText) {
    ctx.save()
    ctx.fillStyle = textColor
    const subFontSize = Math.round(size * 0.0386)
    ctx.font = `600 ${subFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const subChars = subText.split('')
    const subRadius = innerRadius * 0.88
    const subSpacing = 0.12
    const totalSubArc = (subChars.length - 1) * subSpacing
    // 下半圆正中心角度为 PI / 2
    const startSubAngle = Math.PI / 2 + totalSubArc / 2

    subChars.forEach((char, i) => {
      const angle = startSubAngle - i * subSpacing
      ctx.save()
      ctx.translate(center + Math.cos(angle) * subRadius, center + Math.sin(angle) * subRadius)
      // 下方弧形字头向外：旋转角度 - PI/2
      ctx.rotate(angle - Math.PI / 2)
      ctx.fillText(char, 0, 0)
      ctx.restore()
    })
    ctx.restore()
  }

  // 5. 内圈同心圆与中心图案
  ctx.save()
  ctx.beginPath()
  ctx.arc(center, center, centerRingRadius, 0, Math.PI * 2)
  ctx.lineWidth = Math.round(size * 0.007)
  ctx.strokeStyle = borderColor
  ctx.stroke()

  // 中心十字罗盘点缀线
  ctx.strokeStyle = borderColor
  ctx.lineWidth = Math.round(size * 0.007)
  ctx.beginPath()
  // 水平小刻度
  ctx.moveTo(center - centerRingRadius * 0.9, center)
  ctx.lineTo(center - centerRingRadius * 0.55, center)
  ctx.moveTo(center + centerRingRadius * 0.55, center)
  ctx.lineTo(center + centerRingRadius * 0.9, center)
  // 垂直小刻度
  ctx.moveTo(center, center - centerRingRadius * 0.9)
  ctx.lineTo(center, center - centerRingRadius * 0.55)
  ctx.moveTo(center, center + centerRingRadius * 0.55)
  ctx.lineTo(center, center + centerRingRadius * 0.9)
  ctx.stroke()

  // 中心主文字
  if (centerText) {
    ctx.fillStyle = textColor
    const centerFontSize = Math.round(size * 0.082)
    ctx.font = `bold ${centerFontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(centerText, center, center)
  }
  ctx.restore()

  return canvas
}

/**
 * 创建补地 Three.js 贴片网格 (Nadir Mesh)
 * @param {Object} options 印章/图片配置
 * @param {string} options.imageUrl 自定义补地图片 URL (如有则优先贴图)
 * @param {number} sphereRadius 全景球体半径 (PC 一般为 40，移动端为 50)
 * @param {number} patchRadius 补地圆盘半径 (通常为 8 ~ 25)
 * @param {Function} onTextureLoaded 贴图异步加载完成回调 (可选)
 * @returns {THREE.Mesh}
 */
export function createNadirPatchMesh(options = {}, sphereRadius = 40, patchRadius = 14, onTextureLoaded = null) {
  let texture = null
  let material = null

  if (options.type === 'image' && options.imageUrl) {
    const loader = new THREE.TextureLoader()
    texture = loader.load(options.imageUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearFilter
      if (onTextureLoaded) onTextureLoaded(tex)
    })
  } else {
    const canvas = createStampCanvas(options)
    texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
  }

  const geometry = new THREE.CircleGeometry(patchRadius, 64)
  material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: options.opacity !== undefined ? options.opacity : 0.98,
    side: THREE.DoubleSide,
    depthTest: false, // 🌟 关键：彻底关闭深度测试，杜绝被全景球体内表面切除外圈
    depthWrite: false // 零深度写入，防穿透闪烁
  })

  const mesh = new THREE.Mesh(geometry, material)

  // 姿态调整：
  // 1. 水平平躺在地面：绕 X 轴旋转 -90° (朝上正对俯视相机)
  mesh.rotation.x = -Math.PI / 2
  // 2. 放置在全景球体脚底正下方微浮空处
  const posY = -(sphereRadius - 1.5)
  mesh.position.set(0, posY, 0)
  mesh.renderOrder = 999 // 确保优先在全景球内表面之上完整光栅化

  return mesh
}
