import * as THREE from 'three'

/**
 * VR 全景立方体多分辨率瓦片按需加载引擎 (Cubemap Multi-Resolution Tile Loader)
 *
 * 核心特性：
 * 1. 视锥体动态可见性剔除 (THREE.Frustum)，仅拉取当前摄像机视野内的 512x512 瓦片；
 * 2. 视线中心注视点优先排序 (Center-first Priority)，屏幕中央瓦片优先加载；
 * 3. 严格受控的并发下载队列 (并发数 6)，防止移动端与弱网网络阻塞；
 * 4. 贴图加载完成后平滑淡入 (Fade-in)，无缝覆盖底层 LQIP 秒开底图；
 * 5. 跨场景切换显存释放防御 (全面 dispose Geometry, Texture 与 Material)。
 */
export class VrTileLoader {
  /**
   * @param {THREE.Scene} scene Three.js 场景对象
   * @param {Object} options 配置项
   * @param {number} [options.radius=39.5] 立方体半尺寸（紧贴内壁 40 全景球）
   * @param {number} [options.maxConcurrent=6] 最大并发下载数
   */
  constructor(scene, options = {}) {
    this.scene = scene
    this.radius = options.radius || 39.5
    this.maxConcurrent = options.maxConcurrent || 6

    this.tileGroup = new THREE.Group()
    this.tileGroup.name = 'vr-cubemap-tiles'
    this.scene.add(this.tileGroup)

    this.textureLoader = new THREE.TextureLoader()

    // 内部状态
    this.currentSceneId = null
    this.token = 0
    this.tiles = [] // 全部瓦片网格对象
    this.loadingSet = new Set() // 正在下载中的瓦片 key
    this.loadedSet = new Set() // 已下载完成的瓦片 key
    this.queue = [] // 待下载队列
    this.activeRequests = 0

    // 视锥体与数学计算复用变量（杜绝 GC 内存抖动）
    this.frustum = new THREE.Frustum()
    this.projScreenMatrix = new THREE.Matrix4()
    this.camDir = new THREE.Vector3()
    this.lastCamPos = new THREE.Vector3()
    this.lastCamQuat = new THREE.Quaternion()
    this.lastCheckTime = 0
  }

  /**
   * 根据场景配置装配立方体瓦片网格
   * @param {Object} sceneData 场景对象 (包含 hasTiles, tilePrefix, tileConfig)
   * @returns {boolean} 是否成功加载瓦片配置
   */
  loadScene(sceneData) {
    this.clear()
    this.token++
    const currentToken = this.token

    if (!sceneData || !sceneData.hasTiles || !sceneData.tilePrefix) {
      return false
    }

    let config = null
    try {
      config = typeof sceneData.tileConfig === 'string'
        ? JSON.parse(sceneData.tileConfig)
        : sceneData.tileConfig
    } catch (e) {
      console.warn('解析 tileConfig 失败:', e)
      return false
    }

    if (!config || !config.cols || !config.rows) {
      return false
    }

    this.currentSceneId = sceneData.id
    const prefix = sceneData.tilePrefix.endsWith('/') ? sceneData.tilePrefix : `${sceneData.tilePrefix}/`
    const cols = config.cols
    const rows = config.rows
    const ext = config.ext || 'jpg'
    const faces = config.faces || ['f', 'b', 'l', 'r', 'u', 'd']

    // 构建立方体 6 面网格瓦片
    for (const face of faces) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tileKey = `${face}_${c}_${r}`
          const tileUrl = `${prefix}${face}/${c}_${r}.${ext}`

          const u0 = -1 + (2 * c) / cols
          const u1 = -1 + (2 * (c + 1)) / cols
          const v0 = -1 + (2 * r) / rows
          const v1 = -1 + (2 * (r + 1)) / rows

          const geometry = this._createTileGeometry(face, u0, u1, v0, v1, this.radius)

          // 初始材质：透明隐藏，等待贴图加载就绪后淡入
          const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            visible: false,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
          })

          const mesh = new THREE.Mesh(geometry, material)
          mesh.renderOrder = 1 // 处于全景球 (0) 与地面补地遮罩 (999) 之间
          mesh.userData = {
            key: tileKey,
            url: tileUrl,
            face,
            col: c,
            row: r,
            center: geometry.boundingSphere.center.clone()
          }

          this.tileGroup.add(mesh)
          this.tiles.push(mesh)
        }
      }
    }

    return true
  }

  /**
   * 构造单块瓦片的四边形缓冲几何体
   */
  _createTileGeometry(face, u0, u1, v0, v1, R) {
    const pTL = this._getThreeCoord(face, u0, v0, R)
    const pTR = this._getThreeCoord(face, u1, v0, R)
    const pBL = this._getThreeCoord(face, u0, v1, R)
    const pBR = this._getThreeCoord(face, u1, v1, R)

    const positions = new Float32Array([
      pTL.x, pTL.y, pTL.z,
      pBL.x, pBL.y, pBL.z,
      pTR.x, pTR.y, pTR.z,
      pBR.x, pBR.y, pBR.z
    ])

    const uvs = new Float32Array([
      0, 1,
      0, 0,
      1, 1,
      1, 0
    ])

    // 三角面缠绕顺序：面向原点 (0, 0, 0)
    const indices = new Uint16Array([
      0, 1, 2,
      2, 1, 3
    ])

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    return geometry
  }

  /**
   * 等距柱状图立方体面参数坐标 -> Three.js 世界坐标转换
   */
  _getThreeCoord(face, u, v, R) {
    let x = 0, y = 0, z = 0
    switch (face) {
      case 'f': x = R; y = -v * R; z = u * R; break
      case 'b': x = -R; y = -v * R; z = -u * R; break
      case 'l': x = u * R; y = -v * R; z = -R; break
      case 'r': x = -u * R; y = -v * R; z = R; break
      case 'u': x = v * R; y = R; z = u * R; break
      case 'd': x = -v * R; y = -R; z = u * R; break
    }
    return new THREE.Vector3(x, y, z)
  }

  /**
   * 帧循环更新：视锥体可见性检测与并发下载队列驱动
   * @param {THREE.Camera} camera 当前活动相机
   */
  update(camera) {
    if (!camera || this.tiles.length === 0) return

    const now = performance.now()
    // 节流检测：若摄像机未产生明显位移/旋转，且距离上次检测未超过 80ms，则跳过繁重计算
    const posDiff = this.lastCamPos.distanceToSquared(camera.position)
    const quatDiff = this.lastCamQuat.angleTo(camera.quaternion)

    if (now - this.lastCheckTime < 80 && posDiff < 0.0001 && quatDiff < 0.001) {
      return
    }

    this.lastCheckTime = now
    this.lastCamPos.copy(camera.position)
    this.lastCamQuat.copy(camera.quaternion)

    // 1. 更新视锥体
    camera.updateMatrixWorld()
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix)
    camera.getWorldDirection(this.camDir)

    // 2. 遍历瓦片计算可见性与优先级
    const candidates = []
    const toTileVec = new THREE.Vector3()

    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i]
      const key = tile.userData.key

      // 视锥体相交测试
      const isVisible = this.frustum.intersectsObject(tile)

      if (isVisible) {
        if (this.loadedSet.has(key)) {
          // 已下载：确保处于可见展示状态
          if (!tile.visible) tile.visible = true
        } else if (!this.loadingSet.has(key)) {
          // 未下载：计算与视线方向的点积作为优先级（越接近注视中心，优先级越高）
          toTileVec.subVectors(tile.userData.center, camera.position).normalize()
          const priority = toTileVec.dot(this.camDir)
          candidates.push({ tile, priority })
        }
      }
    }

    // 3. 按优先级由高到低排序，入队下载
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.priority - a.priority)
      for (const item of candidates) {
        const key = item.tile.userData.key
        if (!this.loadingSet.has(key) && !this.queue.some(q => q.key === key)) {
          this.queue.push({
            key,
            tile: item.tile,
            url: item.tile.userData.url
          })
        }
      }
      this._processQueue()
    }
  }

  /**
   * 处理下载队列
   */
  _processQueue() {
    while (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
      const item = this.queue.shift()
      if (this.loadedSet.has(item.key) || this.loadingSet.has(item.key)) {
        continue
      }
      this._loadTileTexture(item)
    }
  }

  /**
   * 单块瓦片贴图加载与平滑淡入
   */
  _loadTileTexture(item) {
    const { key, tile, url } = item
    const token = this.token
    this.loadingSet.add(key)
    this.activeRequests++

    this.textureLoader.load(
      url,
      (texture) => {
        this.loadingSet.delete(key)
        this.activeRequests--

        // 若当前场景已切换，则丢弃贴图
        if (this.token !== token) {
          texture.dispose()
          return
        }

        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.generateMipmaps = false

        if (tile && tile.material) {
          tile.material.map = texture
          tile.material.opacity = 0
          tile.material.visible = true
          tile.material.needsUpdate = true

          // 平滑淡入 (0 -> 1，约 180ms)
          this._fadeInTile(tile)
        }

        this.loadedSet.add(key)
        this._processQueue()
      },
      undefined,
      (err) => {
        this.loadingSet.delete(key)
        this.activeRequests--
        console.warn(`瓦片贴图加载失败 [${key}]:`, err)
        this._processQueue()
      }
    )
  }

  /**
   * 瓦片加载完成后的平滑淡入动效
   */
  _fadeInTile(tile) {
    const startTime = performance.now()
    const duration = 180 // 180ms 平滑淡入

    const step = (time) => {
      if (!tile || !tile.material) return
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      tile.material.opacity = progress
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }

  /**
   * 彻底清空并释放当前场景瓦片显存
   */
  clear() {
    this.token++
    this.queue = []
    this.loadingSet.clear()
    this.loadedSet.clear()
    this.activeRequests = 0

    while (this.tiles.length > 0) {
      const tile = this.tiles.pop()
      this.tileGroup.remove(tile)

      if (tile.geometry) {
        tile.geometry.dispose()
      }
      if (tile.material) {
        if (tile.material.map) {
          tile.material.map.dispose()
        }
        tile.material.dispose()
      }
    }
  }

  /**
   * 销毁加载器实例（组件卸载时调用）
   */
  destroy() {
    this.clear()
    if (this.tileGroup) {
      this.scene.remove(this.tileGroup)
    }
  }
}

export default VrTileLoader

