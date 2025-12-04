import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 60_000,
})

http.interceptors.request.use((config) => {
  return config
})
