import request from './request'

/**
 * 访客端 - 获取已启用的轮播图列表 (公开免登)
 */
export function getPortalCarouselListApi() {
  return request({
    url: '/portal/carousel/list',
    method: 'get'
  })
}

export const carouselApi = {
  portalList: getPortalCarouselListApi
}

export default carouselApi
