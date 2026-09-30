import { createRouter, createWebHistory } from 'vue-router'
import { checkIsMobile } from '@/utils/device'

// PC 端专属页面
import HomeView from '@/views/HomeView.vue'
import VrPlayerView from '@/views/VrPlayerView.vue'

// 移动端专属页面
import HomeViewMobile from '@/views/mobile/HomeViewMobile.vue'
import VrPlayerViewMobile from '@/views/mobile/VrPlayerViewMobile.vue'

const routes = [
  // 1. PC 桌面端页面
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '顺峰山公园 720° VR 全景导览' }
  },
  {
    path: '/vr',
    name: 'vr-player',
    component: VrPlayerView,
    meta: { title: '顺峰山 720° VR 全景漫游' }
  },

  // 2. 移动端专属页面
  {
    path: '/m',
    name: 'home-mobile',
    component: HomeViewMobile,
    meta: { title: '顺峰山公园 720° VR 全景导览' }
  },
  {
    path: '/m/vr',
    name: 'vr-player-mobile',
    component: VrPlayerViewMobile,
    meta: { title: '顺峰山 720° VR 全景漫游' }
  },

  // 3. 历史或快捷路由兼容
  {
    path: '/vrMobile',
    redirect: to => ({ path: '/m/vr', query: to.query })
  },
  {
    path: '/leftMapMobile',
    redirect: () => ({ path: '/m/vr', query: { code: 'west_park' } })
  },
  {
    path: '/rightMapMobile',
    redirect: () => ({ path: '/m/vr', query: { code: 'east_park' } })
  },

  // 4. 未匹配通配回退
  {
    path: '/:pathMatch(.*)*',
    redirect: () => (checkIsMobile() ? '/m' : '/')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局路由守卫：标题设置 + PC/移动端智能感知路由分流
router.beforeEach((to, from, next) => {
  // 设置网页标题
  if (to.meta?.title) {
    document.title = `${to.meta.title} | 顺峰VR数字空间`
  }

  const isMobile = checkIsMobile()

  // 移动端访问桌面端路由 -> 自动平滑重定向至移动端路由 (保留全部 query 参数)
  if (isMobile) {
    if (to.path === '/') {
      return next({ path: '/m', query: to.query })
    }
    if (to.path === '/vr') {
      return next({ path: '/m/vr', query: to.query })
    }
  } else {
    // PC 桌面端访问移动端路由 -> 自动平滑重定向至桌面端路由 (保留全部 query 参数)
    if (to.path === '/m') {
      return next({ path: '/', query: to.query })
    }
    if (to.path === '/m/vr') {
      return next({ path: '/vr', query: to.query })
    }
  }

  next()
})

export default router
