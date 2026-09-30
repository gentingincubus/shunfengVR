import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import VrPlayerView from '@/views/VrPlayerView.vue'

const routes = [
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
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} | 顺峰VR数字空间`
  }
  next()
})

export default router
