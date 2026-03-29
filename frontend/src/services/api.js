import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const shouldUseMockApi =
  import.meta.env.VITE_USE_MOCK_API === 'true' ||
  (!import.meta.env.VITE_API_URL && import.meta.env.VITE_USE_MOCK_API !== 'false')

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/signin'
    }
    return Promise.reject(error)
  },
)

export async function withApiFallback(apiCall, mockCall) {
  if (shouldUseMockApi) return mockCall()

  try {
    return await apiCall()
  } catch (error) {
    return mockCall(error)
  }
}
