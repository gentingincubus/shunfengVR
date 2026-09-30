import request from './request'

// 访客门户端 - VR 全景漫游 API (公开免登)
export function getPortalVrCategoryListApi(params) {
  return request({
    url: '/portal/vr/category/list',
    method: 'get',
    params
  })
}

export function getPortalVrCategoryDetailApi(id) {
  return request({
    url: `/portal/vr/category/detail/${id}`,
    method: 'get'
  })
}

export function getPortalVrSceneListApi(params) {
  return request({
    url: '/portal/vr/scene/list',
    method: 'get',
    params
  })
}

export function getPortalVrSceneDetailApi(id) {
  return request({
    url: `/portal/vr/scene/detail/${id}`,
    method: 'get'
  })
}

export const vrApi = {
  portalCategoryList: getPortalVrCategoryListApi,
  portalCategoryDetail: getPortalVrCategoryDetailApi,
  portalSceneList: getPortalVrSceneListApi,
  portalSceneDetail: getPortalVrSceneDetailApi
}

export default vrApi
