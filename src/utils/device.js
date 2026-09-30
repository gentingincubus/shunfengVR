/**
 * 顺峰 VR 设备环境检测工具
 * 深度兼容：
 * - 华为鸿蒙系统 (HarmonyOS / OpenHarmony / ArkWeb / HuaweiBrowser)
 * - iOS (iPhone / iPad / iPod)
 * - Android 全系列
 * - 触控设备与移动端视口宽度
 */

/**
 * 判定当前环境是否为移动端设备
 * @returns {boolean} true: 移动端设备; false: PC桌面端设备
 */
export function checkIsMobile() {
  if (typeof window === 'undefined') return false

  const ua = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase()

  // 1. 深度覆盖主流移动操作系统及华为鸿蒙全生态 (HarmonyOS / OpenHarmony / 华为浏览器 / ArkWeb)
  const isMobileUa = /(harmonyos|openharmony|arkweb|huaweibrowser|iphone|ipad|ipod|ios|android|mobile|phone|blackberry|iemobile|opera mini|micromessenger)/i.test(ua)

  // 2. 视口宽度断点 (宽度 <= 768px 通常为手机或移动竖屏设备)
  const isSmallScreen = window.innerWidth <= 768

  // 3. 触控支持特征 (触控屏手机、平板等)
  const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)

  // 综合判定：只要 UA 命中移动特征，或者视口为小屏且支持触控，均判定为移动端
  return isMobileUa || (isSmallScreen && hasTouch)
}

/**
 * 判定是否具体为华为鸿蒙设备
 * @returns {boolean}
 */
export function isHarmonyOS() {
  if (typeof window === 'undefined') return false
  const ua = (navigator.userAgent || '').toLowerCase()
  return /(harmonyos|openharmony|arkweb|huaweibrowser)/i.test(ua)
}

/**
 * 判定是否为 iOS 设备
 * @returns {boolean}
 */
export function isIOS() {
  if (typeof window === 'undefined') return false
  const ua = (navigator.userAgent || '').toLowerCase()
  return /(iphone|ipad|ipod|ios)/i.test(ua)
}

/**
 * 判定是否为 Android 设备
 * @returns {boolean}
 */
export function isAndroid() {
  if (typeof window === 'undefined') return false
  const ua = (navigator.userAgent || '').toLowerCase()
  return /android/i.test(ua) && !isHarmonyOS()
}

export default {
  checkIsMobile,
  isHarmonyOS,
  isIOS,
  isAndroid
}
