<template>
  <div ref="containerRef" class="m-vr-container" @click="handleScreenTap">
    <!-- WebGL Canvas 挂载容器 -->
    <div ref="canvasWrapperRef" class="m-canvas-wrapper" :class="{ 'is-blur': sceneSwitching }" />

    <!-- 初始全景加载中 Loading 遮罩 -->
    <transition name="fade">
      <div v-if="loading" class="m-vr-loading-mask">
        <div class="m-loading-content">
          <div class="m-loading-spinner" />
          <h2 class="m-loading-title">顺峰山 720° VR</h2>
          <p class="m-loading-sub">极速加载全景场景数据...</p>
        </div>
      </div>
    </transition>

    <!-- 🌟 场景切换时的轻量毛玻璃 Loading 提示 -->
    <transition name="fade">
      <div v-if="sceneSwitching" class="m-scene-switch-mask">
        <div class="m-switch-loading-pill">
          <div class="m-switch-spinner" />
          <div class="m-switch-info">
            <span class="m-switch-label">正在载入场景</span>
            <span class="m-switch-target-name">{{ currentScene?.name }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 顶部极简场景水印与分类信息 (沉浸模式下隐藏) -->
    <transition name="fade">
      <div v-show="!isImmersive" class="m-watermark" @click.stop>
        <div class="m-watermark-title-row">
          <span class="m-cat-tag">{{ currentCategory?.name || '顺峰全景' }}</span>
          <h1 class="m-scene-title">{{ currentScene?.name || '全景漫游' }}</h1>
        </div>
        <p class="m-view-tag">视角: {{ currentViewName }}</p>
      </div>
    </transition>

    <!-- 右侧垂直圆形悬浮按钮栏 (沉浸模式下隐藏) -->
    <transition name="fade">
      <div v-show="!isImmersive" class="m-right-action-bar" @click.stop>
        <!-- 1. 背景音乐 -->
        <button
          class="m-action-ball"
          :class="{ active: isBgmPlaying }"
          @click="toggleBgm"
          title="背景音乐"
        >
          <el-icon :class="{ 'm-spin-slow': isBgmPlaying }"><Headset /></el-icon>
        </button>

        <!-- 2. 导览地图 (有地图底图时显示) -->
        <button
          v-if="currentCategory?.mapUrl"
          class="m-action-ball"
          :class="{ active: isShowMap }"
          @click="isShowMap = !isShowMap"
          title="园区导览地图"
        >
          <el-icon><MapLocation /></el-icon>
        </button>

        <!-- 3. 视角切换选择器 -->
        <button
          class="m-action-ball"
          :class="{ active: isShowViewModal }"
          @click="isShowViewModal = !isShowViewModal"
          title="视角切换"
        >
          <el-icon><View /></el-icon>
        </button>

        <!-- 4. 自动巡航开关 -->
        <button
          class="m-action-ball"
          :class="{ active: isAutoRotate }"
          @click="toggleAutoRotate"
          title="自动旋转巡航"
        >
          <el-icon :class="{ 'm-spin-slow': isAutoRotate }"><RefreshRight /></el-icon>
        </button>

        <!-- 5. 🌟 一键沉浸开关 (隐藏所有 UI) -->
        <button
          class="m-action-ball highlight"
          @click="toggleImmersive"
          title="一键沉浸视角 (隐藏全部UI)"
        >
          <el-icon><Hide /></el-icon>
        </button>

        <!-- 6. 返回 VR 移动首页 -->
        <button
          class="m-action-ball"
          @click="goHomeMobile"
          title="返回 VR 首页"
        >
          <el-icon><HomeFilled /></el-icon>
        </button>
      </div>
    </transition>

    <!-- 左下角场景抽屉呼出按钮 (沉浸模式下隐藏) -->
    <transition name="fade">
      <div v-show="!isImmersive" class="m-bottom-left-trigger" @click.stop>
        <button
          class="m-drawer-toggle-ball"
          :class="{ active: isShowSceneDrawer }"
          @click="isShowSceneDrawer = !isShowSceneDrawer"
        >
          <el-icon><Menu /></el-icon>
          <span class="m-trigger-label">场景</span>
        </button>
      </div>
    </transition>

    <!-- 底部水平滑动场景缩略图抽屉 (沉浸模式下隐藏) -->
    <transition name="slide-up">
      <div v-show="!isImmersive && isShowSceneDrawer" class="m-scene-drawer" @click.stop>
        <div class="m-drawer-top-bar">
          <div class="m-drawer-cat-switch">
            <button
              v-for="cat in categoryList"
              :key="cat.id"
              class="m-cat-pill"
              :class="{ active: currentCategoryId === cat.id }"
              @click="switchCategory(cat.id)"
            >
              {{ cat.name }}
            </button>
          </div>
          <button class="m-drawer-close-btn" @click="isShowSceneDrawer = false">×</button>
        </div>

        <div class="m-thumb-scroll-row">
          <div
            v-for="scene in sceneList"
            :key="scene.id"
            class="m-thumb-card"
            :class="{ active: currentScene?.id === scene.id }"
            @click="switchScene(scene)"
          >
            <div class="m-thumb-box">
              <img :src="scene.previewUrl || scene.panoramaUrl" class="m-thumb-img" draggable="false" />
              <div v-if="currentScene?.id === scene.id" class="m-current-badge">
                <span>当前</span>
              </div>
            </div>
            <span class="m-thumb-name">{{ scene.name }}</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- 导览底图弹窗 (移动端响应式，沉浸模式下隐藏) -->
    <transition name="fade">
      <div v-if="!isImmersive && isShowMap && currentCategory?.mapUrl" class="m-map-overlay" @click.self="isShowMap = false">
        <div class="m-map-modal">
          <div class="m-map-modal-head">
            <div class="m-map-title">
              <el-icon><Compass /></el-icon>
              <span>{{ currentCategory.name }} · 导览地图</span>
            </div>
            <button class="m-map-close-btn" @click="isShowMap = false">×</button>
          </div>

          <div class="m-map-modal-body">
            <div class="m-map-img-container">
              <img :src="currentCategory.mapUrl" class="m-map-img" draggable="false" />

              <!-- 地图标注点 -->
              <div
                v-for="scene in sceneList"
                :key="scene.id"
                class="m-map-dot"
                :class="{ 'is-active': currentScene?.id === scene.id }"
                :style="{ left: scene.leftPercent + '%', top: scene.topPercent + '%' }"
                @click.stop="handleMapPinClick(scene)"
              >
                <!-- 临时停用：导向雷达扇形锥（待后期后台全景可视化精灵图标注/场景跳转功能时再启用） -->
                <!--
                <div
                  v-if="currentScene?.id === scene.id"
                  class="m-radar-sector"
                  :style="{ transform: `translate(-50%, -50%) rotate(${cameraHeading}deg)` }"
                />
                -->
                <span class="m-dot-circle" />
                <span class="m-pin-name">{{ scene.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 视角切换弹窗 (沉浸模式下隐藏) -->
    <transition name="fade">
      <div v-if="!isImmersive && isShowViewModal" class="m-view-modal-mask" @click.self="isShowViewModal = false">
        <div class="m-view-modal-content">
          <div class="m-view-modal-title">全景视角切换</div>
          <div class="m-view-grid">
            <div
              v-for="(preset, key) in VIEW_PRESETS"
              :key="key"
              class="m-view-option"
              :class="{ active: currentViewKey === key }"
              @click="selectView(key)"
            >
              <div class="m-view-opt-name">{{ preset.name }}</div>
              <div class="m-view-opt-sub">{{ preset.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 🌟 沉浸模式下微型唤醒药丸 (轻触恢复) -->
    <transition name="fade">
      <div
        v-if="isImmersive"
        class="m-immersive-wake-fab"
        @click.stop="toggleImmersive"
        title="点击恢复界面显示"
      >
        <el-icon :size="16"><View /></el-icon>
        <span>显示界面</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as TWEEN from '@tweenjs/tween.js'
import { vrApi } from '@/api/vr'
import { createNadirPatchMesh } from '@/utils/nadirPatch'
import {
  Headset,
  MapLocation,
  View,
  RefreshRight,
  Hide,
  HomeFilled,
  Menu,
  Compass
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// DOM 引用
const containerRef = ref(null)
const canvasWrapperRef = ref(null)

// 响应式业务状态
const loading = ref(true)
const sceneSwitching = ref(false)
const categoryList = ref([])
const currentCategoryId = ref(null)
const sceneList = ref([])
const currentScene = ref(null)

// 交互界面状态
const isShowMap = ref(false)
const isShowViewModal = ref(false)
const isShowSceneDrawer = ref(false)
const isAutoRotate = ref(true)
const isBgmPlaying = ref(false)
const isImmersive = ref(false)
const currentViewKey = ref('NORMAL')
const currentViewName = ref('正常视角')
const cameraHeading = ref(0)

// 视点预设
const VIEW_PRESETS = {
  NORMAL: { x: -5, y: 0, z: -5, fov: 75, maxDistance: 15, time: 2000, name: '正常视角', desc: '标准 75° 沉浸环视' },
  PLANET: { x: -5, y: 35, z: -5, fov: 135, maxDistance: 40, time: 2000, name: '小行星', desc: '超广角星体漫游' },
  FISHEYE: { x: -8, y: 15, z: -8, fov: 100, maxDistance: 40, time: 2000, name: '鱼眼透视', desc: '弧形曲面纵深感' },
  CRYSTAL: { x: -50, y: 50, z: -50, fov: 75, maxDistance: 100, time: 1500, name: '水晶球', desc: '宏观上帝空间视角' }
}

// Three.js 原生变量 (严禁 Vue Proxy 代理)
let scene = null
let camera = null
let renderer = null
let controls = null
let textureLoader = null
let animFrameId = null
let currentSphere = null
let nadirMesh = null
let bgmAudio = null
let isTransitioning = false

// 触控判定变量
let touchStartTime = 0
let touchStartPoint = { x: 0, y: 0 }

const currentCategory = computed(() => {
  return categoryList.value.find(c => String(c.id) === String(currentCategoryId.value)) || null
})

// ==========================================
// 1. 数据驱动初始化
// ==========================================
async function initData() {
  try {
    const res = await vrApi.portalCategoryList({ status: 1 })
    if (res.data && res.data.length > 0) {
      categoryList.value = res.data

      const queryCatId = route.query.categoryId
      const queryCatCode = route.query.code

      let targetCat = null
      if (queryCatId) {
        targetCat = categoryList.value.find(c => String(c.id) === String(queryCatId))
      } else if (queryCatCode) {
        targetCat = categoryList.value.find(c => c.code === queryCatCode)
      }

      if (!targetCat) {
        targetCat = categoryList.value[0]
      }

      currentCategoryId.value = targetCat.id
      await loadCategoryScenes(targetCat.id)
    } else {
      ElMessage.warning('暂无开启的 VR 园区分类')
      loading.value = false
    }
  } catch (err) {
    ElMessage.error('获取全景数据失败')
    loading.value = false
  }
}

async function loadCategoryScenes(categoryId, isCategorySwitch = false) {
  try {
    const res = await vrApi.portalSceneList({ categoryId, status: 1 })
    if (res.data && res.data.length > 0) {
      sceneList.value = res.data

      const querySceneId = isCategorySwitch ? null : route.query.sceneId
      let targetScene = null
      if (querySceneId) {
        targetScene = sceneList.value.find(s => String(s.id) === String(querySceneId))
      }
      if (!targetScene) {
        targetScene = sceneList.value[0]
      }

      if (!scene) {
        initThree(targetScene)
      } else {
        switchScene(targetScene)
      }
    } else {
      sceneList.value = []
      currentScene.value = null
      ElMessage.info('该园区暂无场景')
      loading.value = false
    }
  } catch (err) {
    ElMessage.error('加载场景列表失败')
    loading.value = false
  }
}

// 切换园区分类
async function switchCategory(categoryId) {
  if (currentCategoryId.value === categoryId) return
  currentCategoryId.value = categoryId
  await loadCategoryScenes(categoryId, true)
}

// ==========================================
// 2. Three.js 全景引擎初始化
// ==========================================
function initThree(initialScene) {
  const container = canvasWrapperRef.value
  if (!container) return

  scene = new THREE.Scene()

  const w = window.innerWidth
  const h = window.innerHeight
  camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000)
  camera.position.set(-5, 0, -5)

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.autoRotate = isAutoRotate.value
  controls.autoRotateSpeed = 0.5
  controls.minDistance = 1
  controls.maxDistance = 15
  controls.enableZoom = true

  textureLoader = new THREE.TextureLoader()

  window.addEventListener('resize', onWindowResize)

  switchScene(initialScene, true)
  setupNadirPatch()
  animate()
}

// 🌟 装配/更新移动端全景球脚底补地遮罩 (支持园区全局配置与场景个别覆盖)
function setupNadirPatch() {
  if (!scene) return
  if (nadirMesh) {
    scene.remove(nadirMesh)
    nadirMesh.geometry.dispose()
    if (nadirMesh.material.map) nadirMesh.material.map.dispose()
    nadirMesh.material.dispose()
    nadirMesh = null
  }

  // 优先读取场景私有配置，未配置时继承园区全局配置，最后使用默认值
  function parseCfg(raw) {
    if (!raw) return {}
    if (typeof raw === 'object') return raw
    try {
      return JSON.parse(raw)
    } catch (e) {
      return {}
    }
  }

  const sceneCfg = parseCfg(currentScene.value?.nadirConfig)
  const categoryCfg = parseCfg(currentCategory.value?.nadirConfig)

  // 如果场景明确禁用补地 (nadirEnabled === 0 或 false)
  if (sceneCfg.nadirEnabled === 0 || sceneCfg.nadirEnabled === false) {
    return
  }

  const type = sceneCfg.type || categoryCfg.type || 'stamp'
  const text = sceneCfg.nadirText || categoryCfg.nadirText || 'genting拍摄'
  const subText = sceneCfg.nadirSubText || categoryCfg.nadirSubText || '720° SPATIAL PANORAMA'
  const centerText = sceneCfg.nadirCenterText || categoryCfg.nadirCenterText || '720°'
  const bgColor = sceneCfg.nadirBgColor || categoryCfg.nadirBgColor || 'rgba(11, 19, 41, 0.90)'
  const textColor = sceneCfg.nadirTextColor || categoryCfg.nadirTextColor || '#38bdf8'
  const borderColor = sceneCfg.nadirBorderColor || categoryCfg.nadirBorderColor || '#38bdf8'
  const imageUrl = sceneCfg.nadirImageUrl || categoryCfg.nadirImageUrl || null

  // 移动端全景球半径为 50，默认补地遮罩圆盘半径扩大到 18（彻底遮严实三脚架），并支持动态配置
  const patchRadius = Number(sceneCfg.nadirRadius || categoryCfg.nadirRadius || 18)

  nadirMesh = createNadirPatchMesh({
    type,
    text,
    subText,
    centerText,
    bgColor,
    textColor,
    borderColor,
    imageUrl
  }, 50, patchRadius)

  scene.add(nadirMesh)
}

// ==========================================
// 3. 场景平滑过渡切换
// ==========================================
function switchScene(targetScene, isInitial = false) {
  if (!targetScene || !targetScene.panoramaUrl) return
  if (currentScene.value?.id === targetScene.id && !isInitial) return
  if (isTransitioning) return

  isTransitioning = true
  if (isInitial) {
    loading.value = true
  } else {
    sceneSwitching.value = true
  }

  currentScene.value = targetScene

  textureLoader.load(
    targetScene.panoramaUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter

      const geometry = new THREE.SphereGeometry(50, 64, 32)
      geometry.scale(-1, 1, 1)

      const newMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: isInitial ? 1 : 0
      })

      const nextSphere = new THREE.Mesh(geometry, newMaterial)
      scene.add(nextSphere)

      if (isInitial) {
        currentSphere = nextSphere
        isTransitioning = false
        loading.value = false
        return
      }

      const oldSphere = currentSphere
      loading.value = false
      sceneSwitching.value = false

      const fadeObj = { opacity: 0 }
      new TWEEN.Tween(fadeObj)
        .to({ opacity: 1 }, 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(() => {
          newMaterial.opacity = fadeObj.opacity
          if (oldSphere) {
            oldSphere.material.opacity = 1 - fadeObj.opacity
          }
        })
        .onComplete(() => {
          if (oldSphere) {
            scene.remove(oldSphere)
            oldSphere.geometry.dispose()
            if (oldSphere.material.map) {
              oldSphere.material.map.dispose()
            }
            oldSphere.material.dispose()
          }
          currentSphere = nextSphere
          isTransitioning = false
          // 🌟 场景切换完成，更新当前场景的脚底补地遮罩
          setupNadirPatch()
        })
        .start()
    },
    undefined,
    (err) => {
      console.error('全景图加载失败', err)
      ElMessage.error('全景图片加载失败')
      isTransitioning = false
      sceneSwitching.value = false
      loading.value = false
    }
  )
}

function handleMapPinClick(scene) {
  switchScene(scene)
  isShowMap.value = false
}

// ==========================================
// 4. 视角与控制操作
// ==========================================
function selectView(modeKey) {
  currentViewKey.value = modeKey
  const preset = VIEW_PRESETS[modeKey]
  if (!preset || !camera || !controls) return

  currentViewName.value = preset.name
  isShowViewModal.value = false

  if (preset.maxDistance > controls.maxDistance) {
    controls.maxDistance = preset.maxDistance
  }

  const start = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    fov: camera.fov
  }

  const target = {
    x: preset.x,
    y: preset.y,
    z: preset.z,
    fov: preset.fov
  }

  new TWEEN.Tween(start)
    .to(target, preset.time || 1800)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => {
      camera.position.set(start.x, start.y, start.z)
      camera.fov = start.fov
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
      controls.target.set(0, 0, 0)
      controls.update()
    })
    .onComplete(() => {
      controls.maxDistance = preset.maxDistance
    })
    .start()
}

function toggleAutoRotate() {
  isAutoRotate.value = !isAutoRotate.value
  if (controls) {
    controls.autoRotate = isAutoRotate.value
  }
}

function toggleBgm() {
  if (!bgmAudio) {
    bgmAudio = new Audio('https://1967.oss-cn-guangzhou.aliyuncs.com/image/VR/bliss.mp3')
    bgmAudio.loop = true
  }

  if (isBgmPlaying.value) {
    bgmAudio.pause()
    isBgmPlaying.value = false
  } else {
    bgmAudio.play().then(() => {
      isBgmPlaying.value = true
    }).catch(() => {
      ElMessage.warning('需交互后方可播放音频')
    })
  }
}

// 🌟 一键沉浸视角切换
function toggleImmersive() {
  isImmersive.value = !isImmersive.value
  if (isImmersive.value) {
    isShowMap.value = false
    isShowViewModal.value = false
    isShowSceneDrawer.value = false
    ElMessage.info({
      message: '已开启全景沉浸模式，轻触屏幕任意位置或右下角按钮即可恢复。',
      duration: 3000
    })
  }
}

// 屏幕点击处理：在沉浸模式下轻触屏幕唤醒 UI
function handleScreenTap() {
  if (isImmersive.value) {
    isImmersive.value = false
  }
}

function goHomeMobile() {
  router.push('/m')
}

// ==========================================
// 5. 渲染循环与航向更新
// ==========================================
function animate(time) {
  animFrameId = requestAnimationFrame(animate)

  TWEEN.update(time)

  if (controls) {
    controls.update()
  }

  if (camera) {
    const deg = Math.atan2(camera.position.x, camera.position.z) * (180 / Math.PI)
    cameraHeading.value = Math.round(deg + 180)
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function onWindowResize() {
  if (!camera || !renderer) return
  const w = window.innerWidth
  const h = window.innerHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

// ==========================================
// 6. 生命周期
// ==========================================
onMounted(() => {
  initData()
})

onBeforeUnmount(() => {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
  }
  window.removeEventListener('resize', onWindowResize)
  TWEEN.removeAll()

  if (controls) {
    controls.dispose()
  }

  if (currentSphere) {
    currentSphere.geometry.dispose()
    if (currentSphere.material.map) {
      currentSphere.material.map.dispose()
    }
    currentSphere.material.dispose()
  }

  if (nadirMesh) {
    nadirMesh.geometry.dispose()
    if (nadirMesh.material.map) {
      nadirMesh.material.map.dispose()
    }
    nadirMesh.material.dispose()
    nadirMesh = null
  }

  if (renderer) {
    renderer.dispose()
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
  }

  if (bgmAudio) {
    bgmAudio.pause()
    bgmAudio = null
  }
})
</script>

<style scoped>
.m-vr-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: #000;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
}

.m-canvas-wrapper {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  transition: filter 0.4s ease, transform 0.4s ease;
}

/* 🌟 移动端场景切换高斯模糊 */
.m-canvas-wrapper.is-blur {
  filter: blur(10px) brightness(0.85);
  transform: scale(1.03);
}

/* 🌟 移动端场景切换轻量级居中 Loading */
.m-scene-switch-mask {
  position: absolute;
  inset: 0;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.m-switch-loading-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 18px;
  border-radius: 30px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.3);
  color: #fff;
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.m-switch-spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(56, 189, 248, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.8s infinite linear;
}

.m-switch-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.m-switch-label {
  font-size: 10px;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.m-switch-target-name {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.5px;
}

/* 加载遮罩 */
.m-vr-loading-mask {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.m-loading-content {
  text-align: center;
}

.m-loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(56, 189, 248, 0.15);
  border-top-color: #38bdf8;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.9s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.m-loading-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.m-loading-sub {
  font-size: 12px;
  color: #94a3b8;
}

/* 顶部场景水印 */
.m-watermark {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  pointer-events: none;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.85);
}

.m-watermark-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.m-cat-tag {
  background: rgba(2, 132, 199, 0.8);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
}

.m-scene-title {
  font-size: 18px;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
}

.m-view-tag {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin: 4px 0 0 0;
}

/* 右侧圆形悬浮操作栏 */
.m-right-action-bar {
  position: absolute;
  right: 14px;
  top: 16px;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.m-action-ball {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f1f5f9;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  transition: all 0.2s;
}

.m-action-ball:active {
  transform: scale(0.92);
}

.m-action-ball.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #fff;
}

.m-action-ball.highlight {
  background: rgba(2, 132, 199, 0.85);
  border-color: #38bdf8;
  color: #fff;
}

.m-spin-slow {
  animation: spin 3.5s infinite linear;
}

/* 左下角抽屉触发球 */
.m-bottom-left-trigger {
  position: absolute;
  left: 14px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  z-index: 30;
}

.m-drawer-toggle-ball {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f1f5f9;
  padding: 8px 14px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
}

.m-drawer-toggle-ball.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #fff;
}

/* 底部场景横向抽屉 */
.m-scene-drawer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.92);
  backdrop-filter: blur(24px);
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 12px 14px calc(env(safe-area-inset-bottom, 0px) + 20px);
  z-index: 35;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.6);
}

.m-drawer-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.m-drawer-cat-switch {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.m-cat-pill {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 14px;
  cursor: pointer;
}

.m-cat-pill.active {
  background: #0284c7;
  color: #fff;
  border-color: #38bdf8;
  font-weight: 600;
}

.m-drawer-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
}

.m-thumb-scroll-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.m-thumb-card {
  flex-shrink: 0;
  width: 86px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.m-thumb-box {
  position: relative;
  width: 100%;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid transparent;
  background: #1e293b;
}

.m-thumb-card.active .m-thumb-box {
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
}

.m-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.m-current-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(2, 132, 199, 0.9);
  color: #fff;
  font-size: 9px;
  text-align: center;
  padding: 1px 0;
  font-weight: 600;
}

.m-thumb-name {
  font-size: 11px;
  color: #cbd5e1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.m-thumb-card.active .m-thumb-name {
  color: #38bdf8;
  font-weight: 600;
}

/* 导览地图弹窗 */
.m-map-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(10px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.m-map-modal {
  width: 100%;
  max-width: 360px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
}

.m-map-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  font-size: 13px;
  font-weight: 600;
}

.m-map-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.m-map-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
}

.m-map-modal-body {
  padding: 12px;
}

.m-map-img-container {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.m-map-img {
  width: 100%;
  height: auto;
  display: block;
  pointer-events: none;
}

.m-map-dot {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.m-dot-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #38bdf8;
  border: 2px solid #fff;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
}

.m-map-dot.is-active .m-dot-circle {
  background: #f59e0b;
  border-color: #fef08a;
  box-shadow: 0 0 10px #f59e0b;
  transform: scale(1.3);
}

.m-radar-sector {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 48px;
  height: 48px;
  pointer-events: none;
  background: conic-gradient(from -30deg at 50% 50%,
      rgba(56, 189, 248, 0) 0deg,
      rgba(56, 189, 248, 0.55) 30deg,
      rgba(56, 189, 248, 0) 60deg);
  border-radius: 50%;
  transform-origin: center center;
  z-index: -1;
}

.m-pin-name {
  font-size: 9px;
  color: #fff;
  background: rgba(15, 23, 42, 0.85);
  padding: 1px 4px;
  border-radius: 3px;
  margin-top: 2px;
  white-space: nowrap;
}

/* 视角选择弹窗 */
.m-view-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.m-view-modal-content {
  width: 100%;
  max-width: 320px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.m-view-modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  text-align: center;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.m-view-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.m-view-option {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.m-view-option.active {
  background: rgba(2, 132, 199, 0.35);
  border-color: #38bdf8;
}

.m-view-opt-name {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.m-view-option.active .m-view-opt-name {
  color: #38bdf8;
}

.m-view-opt-sub {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

/* 沉浸模式唤醒微型药丸 */
.m-immersive-wake-fab {
  position: absolute;
  right: 18px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #f1f5f9;
  padding: 8px 14px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  animation: pulseFab 2.5s infinite;
}

@keyframes pulseFab {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

/* 动效 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
