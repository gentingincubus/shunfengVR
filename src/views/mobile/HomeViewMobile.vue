<template>
  <div ref="containerRef" class="m-home-container" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <!-- 顶部移动端导航栏 -->
    <transition name="slide-down">
      <header v-show="isShowHeader" class="m-header" :class="{ 'm-header-solid': currentSection > 0 }">
        <div class="m-header-left">
          <span class="m-brand-text">顺峰山VR</span>
        </div>

        <nav class="m-nav-group">
          <button
            v-for="(item, idx) in navList"
            :key="idx"
            class="m-nav-item"
            :class="{ active: currentSection === idx }"
            @click="scrollToSection(idx)"
          >
            {{ item.name }}
          </button>
        </nav>

        <button class="m-vr-entry-btn" @click="enterVrDirectly" title="进入 720° VR 全景漫游">
          <el-icon :size="13"><Compass /></el-icon>
          <span>漫游</span>
        </button>
      </header>
    </transition>

    <!-- 主视口翻页容器 -->
    <div class="m-sections-wrapper" :style="{ transform: `translate3d(0, -${currentSection * 100}%, 0)` }">
      <!-- 区域 1：首屏巨幕宣传 -->
      <section class="m-section m-area-1">
        <div class="m-hero-content">
          <div class="m-hero-badge">720° SPATIAL PANORAMA</div>
          <h1 class="m-hero-title">顺峰山公园</h1>
          <h2 class="m-hero-subtitle">顺峰揽胜 · 岭南名园</h2>

          <div class="m-hero-actions">
            <button class="m-hero-btn primary" @click="enterVrDirectly">
              <el-icon :size="16"><Compass /></el-icon>
              <span>立即进入全景</span>
            </button>
            <button class="m-hero-btn secondary" @click="scrollToSection(1)">
              <span>精选视界</span>
              <el-icon :size="14"><ArrowDown /></el-icon>
            </button>
          </div>
        </div>

        <!-- 底部上滑提示箭头 -->
        <div class="m-scroll-hint" @click="scrollToSection(1)">
          <span class="hint-text">上滑探索更多</span>
          <el-icon class="bounce-icon"><ArrowDown /></el-icon>
        </div>
      </section>

      <!-- 区域 2：顺峰揽胜 · 移动端精选图文视界 (可点击翻转卡片查看富文本) -->
      <section class="m-section m-area-2">
        <div class="m-carousel-container">
          <div class="m-section-header">
            <span class="m-sec-tag">SPATIAL HIGHLIGHTS</span>
            <h2 class="m-sec-title">顺峰揽胜 · 全景视界精选</h2>
            <p class="m-sec-sub">轻触卡片可翻转查看胜景详解</p>
          </div>

          <!-- 移动端自适应卡片展示 -->
          <div v-if="carouselList.length > 0" class="m-card-stage">
            <div
              class="m-card-flipper"
              :class="{ 'is-flipped': isCardFlipped }"
              @click="toggleFlipCard"
            >
              <!-- 正面：封面海报 -->
              <div class="m-card-face m-card-front">
                <img
                  :src="currentCard.coverUrl"
                  class="m-card-img"
                  draggable="false"
                />
                <div class="m-card-overlay">
                  <div class="m-card-badge">
                    <span class="pulse-dot"></span>
                    <span>顺峰名胜</span>
                  </div>
                  <div class="m-card-info">
                    <h3 class="m-card-title">{{ currentCard.title }}</h3>
                    <p v-if="currentCard.subtitle" class="m-card-subtitle">{{ currentCard.subtitle }}</p>
                  </div>
                  <div class="m-flip-hint">
                    <el-icon><Refresh /></el-icon>
                    <span>点击翻转查看图文</span>
                  </div>
                </div>
              </div>

              <!-- 背面：富文本介绍 -->
              <div class="m-card-face m-card-back" @click.stop>
                <div class="m-back-header">
                  <span class="m-back-title">{{ currentCard.title }}</span>
                  <button class="m-back-close" @click.stop="isCardFlipped = false">
                    <el-icon><Refresh /></el-icon>
                    <span>正面</span>
                  </button>
                </div>
                <div class="m-back-content custom-scrollbar">
                  <ParseText :text="currentCard.content" theme="dark" />
                </div>
              </div>
            </div>

            <!-- 卡片左右切换箭头与指示器 -->
            <div v-if="carouselList.length > 1" class="m-carousel-ctrls">
              <button class="m-ctrl-arrow prev" @click.stop="prevCard">
                <el-icon><ArrowLeft /></el-icon>
              </button>
              <div class="m-ctrl-dots">
                <span
                  v-for="(item, idx) in carouselList"
                  :key="item.id"
                  class="m-dot"
                  :class="{ active: idx === currentCardIndex }"
                  @click.stop="switchCard(idx)"
                />
              </div>
              <button class="m-ctrl-arrow next" @click.stop="nextCard">
                <el-icon><ArrowRight /></el-icon>
              </button>
            </div>
          </div>

          <div v-else class="m-card-empty">
            <el-icon :size="32"><PictureFilled /></el-icon>
            <p>暂无精选视界数据</p>
          </div>
        </div>
      </section>

      <!-- 区域 3：顺峰山地图选择 (移动端纵向双卡片排版，无错位) -->
      <section class="m-section m-area-3">
        <div class="m-map-section-content">
          <div class="m-section-header">
            <span class="m-sec-tag">PARK MAPS</span>
            <h2 class="m-sec-title">顺峰山全域 · 导览地图</h2>
            <p class="m-sec-sub">点击下方景区地图，直接进入对应 720° VR 空间</p>
          </div>

          <div class="m-map-cards-group">
            <!-- 青云湖园区 -->
            <div class="m-map-card" @click="goToVrWithMap('west_park')">
              <div class="m-map-card-img-wrap">
                <img src="@/assets/img/thirdArea/leftMap.jpg" alt="青云湖地图" class="m-map-thumb" />
                <div class="m-map-tag">青云湖景区</div>
              </div>
              <div class="m-map-card-body">
                <div class="m-map-title-row">
                  <h3 class="m-map-card-title">青云湖景区</h3>
                  <span class="m-map-enter-text">进入全景 &gt;</span>
                </div>
                <p class="m-map-card-desc">包含五行牌坊、青云塔、大桥等核心胜景</p>
              </div>
            </div>

            <!-- 桂畔湖园区 -->
            <div class="m-map-card" @click="goToVrWithMap('east_park')">
              <div class="m-map-card-img-wrap">
                <img src="@/assets/img/thirdArea/rightMap.jpg" alt="桂畔湖地图" class="m-map-thumb" />
                <div class="m-map-tag">桂畔湖景区</div>
              </div>
              <div class="m-map-card-body">
                <div class="m-map-title-row">
                  <h3 class="m-map-card-title">桂畔湖景区</h3>
                  <span class="m-map-enter-text">进入全景 &gt;</span>
                </div>
                <p class="m-map-card-desc">包含伏波桥、桂畔湖湿地及顺峰花海胜景</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 底部固定浮动快速进入 VR 悬浮胶囊 (仅在首屏显示，避免在卡片屏遮挡内容) -->
    <transition name="fade">
      <div v-show="currentSection === 0" class="m-floating-vr-fab" @click="enterVrDirectly" title="即刻漫游">
        <el-icon :size="18"><Compass /></el-icon>
        <span>720° VR</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Compass, ArrowDown, ArrowLeft, ArrowRight, Refresh, PictureFilled } from '@element-plus/icons-vue'
import { carouselApi } from '@/api/carousel'
import ParseText from '@/components/md-editor-v3/parseText.vue'

const router = useRouter()
const containerRef = ref(null)

// 导航与分屏滚动控制
const currentSection = ref(0)
const totalSections = 3
const isShowHeader = ref(true)
const navList = [
  { name: '首页' },
  { name: '精选' },
  { name: '地图' }
]

// 触控滑动手势判定
let touchStartY = 0
let touchStartX = 0
let isScrolling = false

function handleTouchStart(e) {
  if (e.touches && e.touches.length > 0) {
    touchStartY = e.touches[0].pageY
    touchStartX = e.touches[0].pageX
  }
}

function handleTouchEnd(e) {
  if (isScrolling) return
  if (!e.changedTouches || e.changedTouches.length === 0) return

  const deltaY = touchStartY - e.changedTouches[0].pageY
  const deltaX = touchStartX - e.changedTouches[0].pageX

  // 垂直滑动距离 > 60px 且垂直位移明显大于水平位移时判定为切屏
  if (Math.abs(deltaY) > 60 && Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
    if (deltaY > 0) {
      // 向上滑动 -> 下一屏
      if (currentSection.value < totalSections - 1) {
        scrollToSection(currentSection.value + 1)
      }
    } else {
      // 向下滑动 -> 上一屏
      if (currentSection.value > 0) {
        scrollToSection(currentSection.value - 1)
      }
    }
  }
}

function scrollToSection(idx) {
  if (idx < 0 || idx >= totalSections) return
  isScrolling = true
  currentSection.value = idx
  isCardFlipped.value = false
  setTimeout(() => {
    isScrolling = false
  }, 500)
}

// ==========================================
// 轮播卡片数据驱动与翻转
// ==========================================
const carouselList = ref([])
const currentCardIndex = ref(0)
const isCardFlipped = ref(false)

const currentCard = computed(() => {
  return carouselList.value[currentCardIndex.value] || {}
})

async function loadCarousel() {
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

function toggleFlipCard() {
  isCardFlipped.value = !isCardFlipped.value
}

function prevCard() {
  if (carouselList.value.length <= 1) return
  isCardFlipped.value = false
  currentCardIndex.value = (currentCardIndex.value - 1 + carouselList.value.length) % carouselList.value.length
}

function nextCard() {
  if (carouselList.value.length <= 1) return
  isCardFlipped.value = false
  currentCardIndex.value = (currentCardIndex.value + 1) % carouselList.value.length
}

function switchCard(idx) {
  isCardFlipped.value = false
  currentCardIndex.value = idx
}

// ==========================================
// 页面与全景跳转 (移动端专属路由 /m/vr)
// ==========================================
function enterVrDirectly() {
  router.push('/m/vr')
}

function goToVrWithMap(code) {
  router.push({ path: '/m/vr', query: { code } })
}

function handleTouchMove(e) {
  // 如果用户正在卡片背面的富文本长内容区滚动，允许局部内部滚动；其余全屏手势一律阻止默认行为，防止浏览器下拉刷新
  const isBackScroll = e.target && e.target.closest && e.target.closest('.m-back-content')
  if (!isBackScroll && e.cancelable) {
    e.preventDefault()
  }
}

onMounted(() => {
  loadCarousel()
  if (containerRef.value) {
    containerRef.value.addEventListener('touchmove', handleTouchMove, { passive: false })
  }
})

onBeforeUnmount(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('touchmove', handleTouchMove)
  }
})
</script>

<style scoped>
.m-home-container {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
  overscroll-behavior-y: none;
  touch-action: pan-x;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  user-select: none;
}

/* 顶部轻量级导航栏 */
.m-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.m-header-solid {
  background: rgba(15, 23, 42, 0.85);
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.m-header-left {
  display: flex;
  align-items: center;
}

.m-brand-text {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: #f8fafc;
}

.m-nav-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.m-nav-item {
  background: transparent;
  border: none;
  outline: none;
  color: #94a3b8;
  font-size: 13px;
  padding: 4px 6px;
  cursor: pointer;
  transition: color 0.2s;
}

.m-nav-item.active {
  color: #38bdf8;
  font-weight: 600;
}

.m-vr-entry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
}

/* 整屏滚动动画包装层 */
.m-sections-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: transform 0.55s cubic-bezier(0.25, 1, 0.5, 1);
  will-change: transform;
}

.m-section {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  box-sizing: border-box;
}

/* 区域 1：首屏宣传 */
.m-area-1 {
  background-color: #0b0f19;
  background-image: url('@/assets/img/firstArea/background.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 56px 20px calc(env(safe-area-inset-bottom, 0px) + 20px);
}

.m-hero-content {
  text-align: center;
  width: 100%;
  max-width: 96%;
}

.m-hero-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.m-hero-title {
  font-size: clamp(40px, 13.5vw, 62px);
  font-weight: 900;
  letter-spacing: 2px;
  margin: 0 0 14px 0;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.9);
  font-family: 'FZZJ-HYJTJF', sans-serif;
  line-height: 1.15;
  white-space: nowrap;
}

.m-hero-subtitle {
  font-size: clamp(22px, 7vw, 32px);
  font-weight: 700;
  letter-spacing: 2px;
  color: #f1f5f9;
  margin: 0 0 36px 0;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.85);
}

.m-hero-actions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 260px;
  margin: 0 auto;
}

.m-hero-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  border-radius: 26px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
}

.m-hero-btn.primary {
  background: linear-gradient(90deg, #0284c7, #38bdf8);
  border: none;
  color: #fff;
  box-shadow: 0 4px 20px rgba(2, 132, 199, 0.5);
}

.m-hero-btn.primary:active {
  transform: scale(0.98);
}

.m-hero-btn.secondary {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f8fafc;
}

.m-scroll-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
}

.hint-text {
  font-size: 11px;
  letter-spacing: 1px;
}

.bounce-icon {
  animation: bounceDown 1.6s infinite;
}

@keyframes bounceDown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}

/* 区域 2：精选视界 */
.m-area-2 {
  background: radial-gradient(circle at 50% 30%, #1e1b4b 0%, #0f172a 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 56px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
  box-sizing: border-box;
}

.m-carousel-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
}

.m-section-header {
  text-align: center;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.m-sec-tag {
  font-size: 10px;
  letter-spacing: 2px;
  color: #38bdf8;
  font-weight: 700;
}

.m-sec-title {
  font-size: 19px;
  font-weight: 800;
  margin: 3px 0;
  color: #f8fafc;
}

.m-sec-sub {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
}

.m-card-stage {
  perspective: 1000px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}

.m-card-flipper {
  position: relative;
  width: 90vw;
  max-width: 360px;
  height: calc(100dvh - 240px);
  max-height: 420px;
  min-height: 250px;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.m-card-flipper.is-flipped {
  transform: rotateY(180deg);
}

.m-card-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.m-card-front {
  background: #0f172a;
}

.m-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.m-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.85) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  box-sizing: border-box;
}

.m-card-badge {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 11px;
  color: #f1f5f9;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}

.m-card-info {
  margin-top: auto;
  margin-bottom: 12px;
}

.m-card-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px 0;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

.m-card-subtitle {
  font-size: 12px;
  color: #cbd5e1;
  margin: 0;
  line-height: 1.4;
}

.m-flip-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: #38bdf8;
  background: rgba(2, 132, 199, 0.25);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 6px 12px;
  border-radius: 20px;
}

.m-card-back {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(20px);
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
}

.m-back-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 10px;
}

.m-back-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.m-back-close {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #38bdf8;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 11px;
  cursor: pointer;
}

.m-back-content {
  flex: 1;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  color: #cbd5e1;
}

.m-carousel-ctrls {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
  margin-bottom: 2px;
}

.m-ctrl-arrow {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.m-ctrl-dots {
  display: flex;
  gap: 6px;
}

.m-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  transition: all 0.2s;
}

.m-dot.active {
  background: #38bdf8;
  width: 18px;
  border-radius: 4px;
}

.m-card-empty {
  text-align: center;
  padding: 40px 0;
  color: #64748b;
}

/* 区域 3：地图导览 */
.m-area-3 {
  background: linear-gradient(160deg, #1e1b4b 0%, #0f172a 60%, #020617 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px 16px calc(env(safe-area-inset-bottom, 0px) + 24px);
  box-sizing: border-box;
}

.m-map-section-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.m-map-cards-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 360px;
}

.m-map-card {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s;
}

.m-map-card:active {
  transform: scale(0.98);
}

.m-map-card-img-wrap {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  background: #020617;
}

.m-map-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.m-map-card:hover .m-map-thumb {
  transform: scale(1.05);
}

.m-map-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(2, 132, 199, 0.85);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.m-map-card-body {
  padding: 12px 14px;
}

.m-map-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.m-map-card-title {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
  color: #f8fafc;
}

.m-map-enter-text {
  font-size: 11px;
  color: #38bdf8;
  font-weight: 600;
}

.m-map-card-desc {
  font-size: 11px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.4;
}

/* 浮动 FAB 进入全景按纽 */
.m-floating-vr-fab {
  position: fixed;
  right: 18px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 22px);
  z-index: 90;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 10px 16px;
  border-radius: 30px;
  box-shadow: 0 8px 24px rgba(2, 132, 199, 0.5);
  cursor: pointer;
  animation: pulseFab 2.5s infinite;
}

@keyframes pulseFab {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 动画定义 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
</style>
