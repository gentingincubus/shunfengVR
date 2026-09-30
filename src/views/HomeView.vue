<template>
  <div class="mainPageContainer">
    <!-- 顶部导航栏 (原汁原味还原动效与滑动形态，融入管理后台胶囊入口) -->
    <transition name="head" appear>
      <div v-show="isShowHead" class="headContainer transition"
        :class="isHeadTop ? 'headContainer_active' : 'headContainer_hidden'">
        <div class="head transition">
          <div class="head-left flexRowAlign">
            <div v-if="isHeadTop" class="editorText transition">MADE BY GENTING</div>
            <div v-else class="editorText transition">顺峰山VR</div>
          </div>

          <img src="@/assets/img/head.png" class="portrait transition" alt="avatar" />

          <!-- 右侧导航 + 胶囊入口容器 -->
          <div class="head-right flexRowAlign">
            <!-- 滚轮切页导航 -->
            <div class="navContainer flexCol transition">
              <div class="nav flexRow transition">
                <div v-for="(item, index) of navBtnList" :key="index" class="navBtn flexRowAlign transition"
                  :style="{ color: index === navIndex ? 'aqua' : '' }" @click="changeNav($event, index)">
                  {{ item.name }}
                </div>
              </div>
              <!-- 导航下滑动的青色指示线 -->
              <div class="navbar transition" :style="{ width: navbarWidth + 'px', left: navbarLeft + 'px' }"></div>
            </div>

            <!-- 🌟 顶部右上角：全景漫游入口 -->
            <div class="capsule-wrap">
              <div class="capsule-btn vr-mode" title="进入 720° VR 全景漫游" @click="enterVrDirectly">
                <el-icon :size="14">
                  <Compass />
                </el-icon>
                <span class="capsule-text">全景漫游</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 页面滚屏容器 -->
    <div ref="mainPageRef" class="mainPage" :style="{ top: -mainPageScrollTop + 'px' }">
      <!-- 区域 1：首屏巨幕宣传 -->
      <div class="mainContainer area_1 clearfix">
        <div class="contentContainer flexColCenter">
          <div class="content">顺峰山公园</div>
          <div class="content">顺峰揽胜</div>
          <div class="hero-btn-row flexRowCenter">
            <div ref="startViewBtnRef" class="startViewBtn" @click="startView">
              亮点巡礼
            </div>
            <div class="enterVrDirectBtn" @click="enterVrDirectly">
              <el-icon>
                <Compass />
              </el-icon>
              <span>进入全景漫游</span>
            </div>
          </div>
        </div>
        <div class="footerContainer"></div>
      </div>

      <!-- 区域 2：顺峰揽胜 · 3D 毛玻璃视界轮播 (自适应 80% 屏幕 & 翻转富文本) -->
      <div class="mainContainer area_2 flexColCenter">
        <div class="carousel-section-container">
          <!-- 区域标题 -->
          <div class="carousel-header flexColCenter">
            <span class="section-tag">SPATIAL HIGHLIGHTS</span>
            <h2 class="carousel-title">顺峰揽胜 · 全景视界精选</h2>
            <p class="carousel-subtitle">
              探索岭南名园经典胜景 · 点击中央卡片翻转阅读图文详解
            </p>
          </div>

          <!-- 3D 轮播舞台 (屏幕 80% 黄金视口边界) -->
          <div class="carousel-3d-stage"
            :style="{ width: stageMaxBound.width + 'px', height: stageMaxBound.height + 'px' }">
            <!-- 轮播卡片群 (当前清晰，前后 N 张梯级虚化) -->
            <div v-for="(item, index) in carouselList" :key="item.id" class="carousel-card-item"
              :style="getCardStyle(index)" @click="handleCardClick(index)">
              <div class="card-flipper" :class="{ 'is-flipped': isFlipped && getCardOffset(index) === 0 }">
                <!-- 正面：封面海报 + 标题 + 提示 -->
                <div class="card-face card-front">
                  <img :src="item.coverUrl" class="card-img" draggable="false"
                    @load="handleImageLoad(item.id, $event)" />
                  <div class="card-front-glass-overlay">
                    <div class="card-top-tag">
                      <span class="pulse-point"></span>
                      <span>顺峰名胜</span>
                    </div>
                    <div class="card-text-group">
                      <h3 class="card-main-title">{{ item.title }}</h3>
                      <p v-if="item.subtitle" class="card-sub-title">{{ item.subtitle }}</p>
                    </div>
                    <div class="flip-hint-badge">
                      <el-icon>
                        <Refresh />
                      </el-icon>
                      <span>点击翻转卡片</span>
                    </div>
                  </div>
                </div>

                <!-- 背面：深色毛玻璃 + ParseText 富文本组件 + 返回按键 -->
                <div class="card-face card-back" @click.stop>
                  <div class="back-head-bar">
                    <div class="back-head-info">
                      <span class="back-dot"></span>
                      <span class="back-title-text">{{ item.title }}</span>
                    </div>
                    <button class="back-return-btn" @click.stop="isFlipped = false">
                      <el-icon>
                        <ArrowLeft />
                      </el-icon>
                      <span>返回正面</span>
                    </button>
                  </div>
                  <div class="back-scroll-content custom-scrollbar">
                    <ParseText :text="item.content" theme="dark" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 左右切换箭头按钮 (仅在多张卡片时显示) -->
            <button v-if="carouselList.length > 1" class="carousel-arrow prev-arrow" @click.stop="prevCard" title="上一张">
              <el-icon :size="22">
                <ArrowLeft />
              </el-icon>
            </button>
            <button v-if="carouselList.length > 1" class="carousel-arrow next-arrow" @click.stop="nextCard" title="下一张">
              <el-icon :size="22">
                <ArrowRight />
              </el-icon>
            </button>
          </div>

          <!-- 底部圆点指示器 -->
          <div v-if="carouselList.length > 1" class="carousel-indicators">
            <span v-for="(item, index) in carouselList" :key="'ind-' + item.id" class="indicator-dot"
              :class="{ active: index === currentIndex }" @click.stop="goToCard(index)" />
          </div>
        </div>
      </div>

      <!-- 区域 3：顺峰山 VR 地图 -->
      <div class="mainContainer area_3">
        <div class="mapContainer">
          <img class="mapImg" src="@/assets/img/thirdArea/leftMap.jpg" alt="青云湖地图" @click="goVR('leftMapPC')" />
          <img class="mapImg" src="@/assets/img/thirdArea/rightMap.jpg" alt="桂畔湖地图" @click="goVR('rightMapPC')" />
        </div>
        <div class="mapBackground"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Refresh, Compass, Position } from '@element-plus/icons-vue'
import { carouselApi } from '@/api/carousel'
import ParseText from '@/components/md-editor-v3/parseText.vue'

const router = useRouter()

const navIndex = ref(0)
const navbarWidth = ref(0)
const navbarLeft = ref(0)
const navBtnList = reactive([
  { name: '首页' },
  { name: '亮点巡礼' },
  { name: '漫游地图' }
])

function enterVrDirectly() {
  router.push('/vr')
}

// ==========================================
// 首页第二页：3D 毛玻璃自适应翻转轮播
// ==========================================
const carouselList = ref([])
const currentIndex = ref(0)
const isFlipped = ref(false)
const imgDimensionsMap = reactive({})

// 屏幕 80% 黄金视口边界
const stageMaxBound = reactive({
  width: 960,
  height: 560
})

function updateStageBound() {
  const w = window.innerWidth
  const h = window.innerHeight
  // 占满屏幕宽高的约 80%
  stageMaxBound.width = Math.min(Math.round(w * 0.80), 1260)
  stageMaxBound.height = Math.min(Math.round(h * 0.70), 720)
}

function handleImageLoad(id, event) {
  const img = event.target
  if (img && img.naturalWidth && img.naturalHeight) {
    imgDimensionsMap[id] = {
      w: img.naturalWidth,
      h: img.naturalHeight,
      ratio: img.naturalWidth / img.naturalHeight
    }
  }
}

// 动态尺寸计算：高度优先，超宽转宽度优先
const activeCardSize = computed(() => {
  const current = carouselList.value[currentIndex.value]
  if (!current) {
    return {
      width: `${stageMaxBound.width}px`,
      height: `${stageMaxBound.height}px`
    }
  }

  const dim = imgDimensionsMap[current.id]
  const ratio = dim ? dim.ratio : 16 / 9

  // 1. 高度优先原则
  let targetH = stageMaxBound.height
  let targetW = targetH * ratio

  // 2. 超宽转宽度优先
  if (targetW > stageMaxBound.width) {
    targetW = stageMaxBound.width
    targetH = targetW / ratio
  }

  return {
    width: `${Math.round(targetW)}px`,
    height: `${Math.round(targetH)}px`
  }
})

function getCardOffset(index) {
  const len = carouselList.value.length
  if (len <= 1) return 0
  let diff = index - currentIndex.value
  if (diff > len / 2) diff -= len
  if (diff < -len / 2) diff += len
  return diff
}

function getCardStyle(index) {
  const d = getCardOffset(index)
  const isCenter = d === 0

  if (isCenter) {
    return {
      width: activeCardSize.value.width,
      height: activeCardSize.value.height,
      transform: 'translate3d(-50%, -50%, 0) scale(1) rotateY(0deg)',
      filter: 'blur(0px)',
      opacity: 1,
      zIndex: 10,
      pointerEvents: 'auto'
    }
  }

  const absD = Math.abs(d)
  if (absD > 2) {
    return {
      display: 'none',
      opacity: 0,
      pointerEvents: 'none'
    }
  }

  const scale = absD === 1 ? 0.84 : 0.70
  const blurPx = absD === 1 ? 6 : 12
  const opacity = absD === 1 ? 0.65 : 0.35
  const zIndex = 10 - absD * 3
  const rotateDeg = d > 0 ? -18 : 18
  const centerW = parseInt(activeCardSize.value.width, 10) || 600
  const shiftX = d > 0 ? (centerW * 0.52 + (absD - 1) * 160 + 60) : -(centerW * 0.52 + (absD - 1) * 160 + 60)

  return {
    width: activeCardSize.value.width,
    height: activeCardSize.value.height,
    transform: `translate3d(calc(-50% + ${shiftX}px), -50%, -${absD * 100}px) scale(${scale}) rotateY(${rotateDeg}deg)`,
    filter: `blur(${blurPx}px)`,
    opacity,
    zIndex,
    cursor: 'pointer'
  }
}

function handleCardClick(index) {
  const d = getCardOffset(index)
  if (d === 0) {
    isFlipped.value = !isFlipped.value
  } else {
    goToCard(index)
  }
}

function prevCard() {
  if (carouselList.value.length <= 1) return
  isFlipped.value = false
  currentIndex.value = (currentIndex.value - 1 + carouselList.value.length) % carouselList.value.length
}

function nextCard() {
  if (carouselList.value.length <= 1) return
  isFlipped.value = false
  currentIndex.value = (currentIndex.value + 1) % carouselList.value.length
}

function goToCard(index) {
  if (currentIndex.value === index) return
  isFlipped.value = false
  currentIndex.value = index
}

async function loadCarouselList() {
  try {
    const res = await carouselApi.portalList()
    if (res && res.data && res.data.length > 0) {
      carouselList.value = res.data
    } else {
      carouselList.value = []
    }
  } catch (err) {
    carouselList.value = []
  }
}

function handleKeydown(e) {
  if (navIndex.value !== 1) return
  if (e.key === 'ArrowLeft') {
    prevCard()
  } else if (e.key === 'ArrowRight') {
    nextCard()
  } else if (e.key === ' ' || e.key === 'Enter') {
    isFlipped.value = !isFlipped.value
  }
}

// 页面滑动状态
const mainPageScrollTop = ref(0)
const scrollDuration = 600
const isHeadTop = ref(true)
const isScroll = ref(false)
const isShowHead = ref(true)
const mainPageRef = ref(null)
const startViewBtnRef = ref(null)

// 监听导航变化，联动滑块位置
watch(navIndex, (newValue, oldValue) => {
  if (oldValue !== newValue && isShowHead.value) {
    isHeadTop.value = newValue === 0
    nextTick(() => {
      const btnList = document.getElementsByClassName('navBtn')
      if (btnList && btnList[navIndex.value]) {
        const btn = btnList[navIndex.value]
        navbarWidth.value = btn.clientWidth
        navbarLeft.value = btn.offsetLeft
      }
    })
  }
})

// 点击导航项
function changeNav(e, index) {
  navIndex.value = index
  navbarLeft.value = e.target.offsetLeft
  const page = document.getElementsByClassName('mainContainer')
  if (page && page[navIndex.value]) {
    mainPageScrollTop.value = page[navIndex.value].offsetTop
  }
}

// 滚轮事件监听 (全屏滚轮切页)
function scrollChange(e) {
  if (!isScroll.value) {
    isScroll.value = true
    const direction = e.wheelDelta < 0 ? 'down' : 'up'
    pageScroll(direction)
    isShowHead.value = direction !== 'down'
    setTimeout(() => {
      isScroll.value = false
    }, scrollDuration)
  }
}

// 页面翻页计算
function pageScroll(direction, num = 1) {
  const page = document.getElementsByClassName('mainContainer')
  if (!page || page.length === 0) return
  const pageCount = page.length
  if (direction === 'down') {
    if (navIndex.value < pageCount - 1) {
      navIndex.value += num
    }
  } else {
    if (navIndex.value > 0) {
      navIndex.value -= num
    }
  }
  if (page[navIndex.value]) {
    mainPageScrollTop.value = page[navIndex.value].offsetTop
  }
}

// 开始浏览按钮动效与自动翻页
function startView(e) {
  const rect = e.target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  const ripple = document.createElement('div')
  ripple.className = 'ripple'
  ripple.style.left = x + 'px'
  ripple.style.top = y + 'px'
  e.target.appendChild(ripple)

  setTimeout(() => {
    ripple.remove()
    pageScroll('down', 1)
  }, 650)
}

function goVR(mapName) {
  if (mapName === 'leftMapPC' || mapName === 'west_park') {
    router.push({ path: '/vr', query: { code: 'west_park' } })
  } else if (mapName === 'rightMapPC' || mapName === 'east_park') {
    router.push({ path: '/vr', query: { code: 'east_park' } })
  } else {
    router.push('/vr')
  }
}

onMounted(() => {
  loadCarouselList()
  updateStageBound()
  nextTick(() => {
    const btnList = document.getElementsByClassName('navBtn')
    if (btnList && btnList[navIndex.value]) {
      navbarWidth.value = btnList[navIndex.value].clientWidth
    }
  })
  window.addEventListener('wheel', scrollChange, { passive: true })
  window.addEventListener('resize', updateStageBound)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('wheel', scrollChange)
  window.removeEventListener('resize', updateStageBound)
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/* 字体定义 */
@font-face {
  font-family: 'FZZJ-HYJTJF';
  src: url("@/assets/font/FZZJ-HYJTJF_compress.ttf");
}

@font-face {
  font-family: 'tengxiang';
  src: url("@/assets/font/tengxiang_compress.ttf");
}

/* 核心布局 */
.mainPageContainer {
  --rem: calc((100vw / 750) * 40);
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #000;
}

.mainPage {
  position: absolute;
  width: 100%;
  font-size: 16px;
  transition: all 0.5s linear;
}

.mainPage::-webkit-scrollbar {
  display: none;
  width: 0 !important;
  height: 0 !important;
  background: transparent;
}

.mainContainer {
  width: 100%;
  height: 100vh;
  position: relative;
}

/* ================= 区域 1：首屏宣传大图 ================= */
.area_1 {
  background-color: black;
  background-image: url('@/assets/img/firstArea/background.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.area_1 .contentContainer {
  width: 100%;
  height: 100%;
}

.area_1 .contentContainer .content {
  color: white;
  font-family: 'FZZJ-HYJTJF', sans-serif;
  line-height: 1.15;
}

.area_1 .contentContainer .content:nth-child(1) {
  font-size: calc(var(--rem) * 3);
  text-shadow: 6px 6px 2px black;
  margin-bottom: 10px;
}

.area_1 .contentContainer .content:nth-child(2) {
  font-size: calc(var(--rem) * 1.5);
  text-shadow: 3px 3px 2px black;
  margin-bottom: 30px;
}

.hero-btn-row {
  gap: 24px;
  margin-top: 10px;
}

.enterVrDirectBtn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 32px;
  height: 60px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.enterVrDirectBtn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: #38bdf8;
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(56, 189, 248, 0.35);
}

.capsule-btn.portal-mode {
  text-decoration: none;
  background: rgba(14, 165, 233, 0.18);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
}

.capsule-btn.portal-mode:hover {
  background: rgba(14, 165, 233, 0.35);
}

.capsule-btn.vr-mode {
  background: rgba(16, 185, 129, 0.18);
  border: 1px solid rgba(52, 211, 153, 0.4);
  color: #34d399;
}

.capsule-btn.vr-mode:hover {
  background: rgba(16, 185, 129, 0.35);
}

/* ================= 区域 2：顺峰揽胜 · 3D 毛玻璃轮播 ================= */
.area_2 {
  background: radial-gradient(circle at 50% 30%, #064e3b 0%, #065f46 40%, #0f172a 100%);
  padding: 24px 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.carousel-section-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  box-sizing: border-box;
}

.carousel-header {
  text-align: center;
  margin-bottom: 12px;
}

.section-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #34d399;
  background: rgba(52, 211, 153, 0.12);
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid rgba(52, 211, 153, 0.3);
  margin-bottom: 6px;
  display: inline-block;
}

.carousel-title {
  font-size: clamp(24px, 2.6vw, 36px);
  color: #f8fafc;
  margin: 0 0 6px;
  font-weight: 800;
  letter-spacing: 1px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.carousel-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* 3D 轮播舞台容器 (屏幕 80% 黄金视口边界) */
.carousel-3d-stage {
  position: relative;
  perspective: 1400px;
  transform-style: preserve-3d;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: auto;
}

/* 轮播单卡片外壳 */
.carousel-card-item {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1),
    filter 0.6s ease,
    opacity 0.6s ease,
    width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform, filter, opacity, width, height;
}

/* 3D 翻转器 (Flip Card) */
.card-flipper {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.card-flipper.is-flipped {
  transform: rotateY(180deg);
}

/* 卡片正反面通用样式 */
.card-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15);
}

/* 正面海报 */
.card-front {
  transform: rotateY(0deg);
  background: #0f172a;
  cursor: pointer;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-front-glass-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.5) 50%, transparent 100%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}

.card-top-tag {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  margin-bottom: 8px;
  backdrop-filter: blur(8px);
}

.pulse-point {
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 8px #10b981;
}

.card-main-title {
  margin: 0;
  color: #fff;
  font-size: clamp(20px, 2.2vw, 28px);
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
}

.card-sub-title {
  margin: 6px 0 0;
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.5;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

.flip-hint-badge {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 20px;
  margin-top: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s;
}

.carousel-card-item:hover .flip-hint-badge {
  background: rgba(56, 189, 248, 0.3);
  border-color: rgba(56, 189, 248, 0.6);
  color: #38bdf8;
  transform: translateY(-2px);
}

/* 反面富文本 */
.card-back {
  transform: rotateY(180deg);
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.back-head-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.back-head-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-dot {
  width: 8px;
  height: 8px;
  background: #38bdf8;
  border-radius: 50%;
  box-shadow: 0 0 10px #38bdf8;
}

.back-title-text {
  font-size: 16px;
  font-weight: 700;
  color: #f8fafc;
}

.back-return-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s;
}

.back-return-btn:hover {
  background: rgba(56, 189, 248, 0.25);
  border-color: #38bdf8;
  color: #38bdf8;
  transform: translateX(-2px);
}

.back-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px;
}

/* 左右浮动切换按键 */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
  transition: all 0.3s;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.carousel-arrow:hover {
  background: rgba(56, 189, 248, 0.4);
  border-color: #38bdf8;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 10px 30px rgba(56, 189, 248, 0.4);
}

.prev-arrow {
  left: -24px;
}

.next-arrow {
  right: -24px;
}

/* 底部指示圆点 */
.carousel-indicators {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
  z-index: 30;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.indicator-dot:hover {
  background: rgba(255, 255, 255, 0.6);
}

.indicator-dot.active {
  width: 26px;
  background: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.8);
}

/* 自定义精巧滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

/* ================= 区域 3：顺峰山 VR 地图 ================= */
.area_3 {
  position: relative;
  background: linear-gradient(60deg, #654ea3 0%, #eaafc8 100%);
  min-height: 500px;
  min-width: 850px;
}

.area_3 .mapBackground {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 75%;
  height: 85%;
  filter: blur(1px);
  opacity: 0.3;
  border-radius: 10px;
  background-color: #fff;
  z-index: 1;
}

.area_3 .mapContainer {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 75%;
  height: 85%;
  z-index: 10;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
}

.area_3 .mapContainer .mapImg {
  height: 85%;
  border-radius: 10px;
  filter: brightness(0.6);
  cursor: pointer;
  transition: all 0.3s;
}

.area_3 .mapContainer .mapImg:hover {
  filter: brightness(1);
  transform: scale(1.02);
}

/* ================= 区域 4：🌟 站点导航矩阵 ================= */
.area_4 {
  background: linear-gradient(60deg, #543ab7 0%, #00acc1 100%);
  padding: 60px 24px;
  box-sizing: border-box;
  overflow-y: auto;
}

.area4-wrapper {
  max-width: 1120px;
  width: 100%;
}

.area4-header {
  text-align: center;
  margin-bottom: 32px;
}

.area4-title {
  font-size: clamp(28px, 3.2vw, 42px);
  color: #ffffff;
  font-weight: 800;
  margin: 0 0 12px;
  letter-spacing: 1px;
}

.area4-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
}

.nav-matrix-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  width: 100%;
}

.matrix-card {
  position: relative;
  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 22px 20px;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
}

.matrix-card:hover {
  transform: translateY(-6px);
  background: rgba(255, 255, 255, 0.26);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
}

.matrix-card.admin-portal-card {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.35), rgba(99, 102, 241, 0.35));
  border: 1.5px solid #38bdf8;
  box-shadow: 0 8px 30px rgba(56, 189, 248, 0.25);
}

.matrix-card.admin-portal-card:hover {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.5), rgba(99, 102, 241, 0.5));
  box-shadow: 0 16px 40px rgba(56, 189, 248, 0.45);
}

.card-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  color: #e2e8f0;
}

.admin-portal-card .card-badge {
  background: #38bdf8;
  color: #0f172a;
}

.card-icon {
  font-size: 34px;
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 6px;
}

.card-detail {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.5;
  margin: 0 0 16px;
  flex: 1;
  word-break: break-all;
}

.card-jump {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #38bdf8;
  transition: transform 0.2s;
}

.matrix-card:hover .card-jump {
  transform: translateX(4px);
  color: #7dd3fc;
}

/* ================= 头部导航栏与胶囊入口 ================= */
.headContainer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
}

.headContainer .head {
  position: relative;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  width: 92%;
  align-items: center;
}

.head-left {
  flex-shrink: 0;
}

/* 左侧艺术字体 */
.headContainer .head .editorText {
  font-size: calc(var(--rem) * 0.5);
  font-family: 'tengxiang', sans-serif;
  letter-spacing: 1px;
}

/* 中间头像 */
.headContainer .head .portrait {
  position: absolute;
  inset: 0;
  margin: auto;
  flex-shrink: 1;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

/* 导航栏容器 */
.headContainer .head .navContainer {
  position: relative;
  height: 100%;
}

.headContainer .head .navContainer .nav {
  align-items: center;
}

.headContainer .head .navContainer .nav .navBtn {
  margin-right: 22px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.headContainer .head .navContainer .nav .navBtn:hover {
  color: aqua !important;
}

.headContainer .head .navContainer .navbar {
  position: relative;
  height: 3px;
  background-color: aqua;
  transition: all 0.3s ease;
}

/* 🌟 右上角胶囊按钮 */
.capsule-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  user-select: none;
}

.capsule-btn.admin-mode {
  background: rgba(56, 189, 248, 0.18);
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #38bdf8;
  backdrop-filter: blur(8px);
}

.capsule-btn.admin-mode:hover {
  background: rgba(56, 189, 248, 0.35);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #34d399;
  box-shadow: 0 0 6px #34d399;
}

.capsule-btn.login-mode {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #ffffff;
  backdrop-filter: blur(8px);
}

.capsule-btn.login-mode:hover {
  background: rgba(255, 255, 255, 0.3);
  color: #38bdf8;
  border-color: #38bdf8;
}

/* 导航处于顶部形态 */
.headContainer_active .head {
  height: 90px;
  border-bottom: 3px solid rgba(192, 192, 192, 0.5);
}

.headContainer_active .head .editorText {
  color: white;
}

.headContainer_active .head .portrait {
  width: 70px;
  height: 70px;
}

.headContainer_active .head .navBtn {
  color: white;
}

/* 导航下滑后的隐藏形态 */
.headContainer_hidden {
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.headContainer_hidden .head {
  height: 54px;
}

.headContainer_hidden .head .editorText {
  color: #0f172a;
  font-size: 22px;
}

.headContainer_hidden .head .portrait {
  width: 0px;
  height: 0px;
  opacity: 0;
}

.headContainer_hidden .head .navBtn {
  color: #334155;
}

.headContainer_hidden .capsule-btn.admin-mode {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

.headContainer_hidden .capsule-btn.login-mode {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

/* 弹性工具类 */
.flexRow {
  display: flex;
  flex-direction: row;
}

.flexCol {
  display: flex;
  flex-direction: column;
}

.flexRowCenter {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.flexRowAlign {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.flexColCenter {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.transition {
  transition: all 0.5s ease-out;
}

/* 按钮动画 */
.startViewBtn {
  position: relative;
  width: 300px;
  height: 80px;
  border-radius: 50px;
  line-height: 80px;
  font-size: 25px;
  text-align: center;
  color: white;
  overflow: hidden;
  user-select: none;
  cursor: pointer;
  background: linear-gradient(90deg, #03a9f4, #f441a5, #ffeb3b, #03a9f4);
  background-size: 400%;
  z-index: 2;
}

.startViewBtn::before {
  content: "";
  position: absolute;
  inset: -5px;
  border-radius: 50px;
  background: linear-gradient(90deg, #03a9f4, #f441a5, #ffeb3b, #03a9f4);
  background-size: 400%;
  filter: blur(20px);
  z-index: -1;
}

.startViewBtn:hover::before,
.startViewBtn:hover {
  animation: liuguang 8s infinite;
}

@keyframes liuguang {
  100% {
    background-position: -400% 0;
  }
}

:deep(.ripple) {
  position: absolute;
  background-color: #fff;
  transform: translate(-50%, -50%);
  pointer-events: none;
  border-radius: 50%;
  animation: ripple 1s linear infinite;
  z-index: 10;
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.5;
  }

  100% {
    width: 500px;
    height: 500px;
    opacity: 0;
  }
}

/* 导航栏进入离开过渡 */
.head-enter-active {
  transform: translateY(0);
  animation: headDown 0.3s linear;
}

.head-leave-active {
  transform: translateY(-100%);
  opacity: 0;
  animation: headUp 0.3s linear;
}

@keyframes headDown {
  0% {
    transform: translateY(-100%);
  }

  100% {
    transform: translateY(0);
  }
}

@keyframes headUp {
  0% {
    transform: translateY(0);
    opacity: 1;
  }

  100% {
    transform: translateY(-100%);
    opacity: 0;
  }
}
</style>
