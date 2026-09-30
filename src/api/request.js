import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('myblog_access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (response.request.responseType === 'blob' || response.request.responseType === 'arraybuffer') {
      return res
    }

    if (res && res.status === false) {
      ElMessage.error(res.message || '操作失败')
      return Promise.reject(new Error(res.message || '操作失败'))
    }

    return res
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络请求错误'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default request
