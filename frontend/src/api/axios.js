import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Show a "waking up server" toast if any request takes > 5 seconds
// (Render free tier cold-starts can take 50+ seconds)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  config._slowToastId = null
  config._slowTimer = setTimeout(() => {
    config._slowToastId = toast.loading(
      '⏳ Server is waking up — this may take up to 30 seconds on first load...',
      { duration: Infinity, id: 'server-wakeup' }
    )
  }, 5000)

  return config
})

api.interceptors.response.use(
  (response) => {
    clearTimeout(response.config._slowTimer)
    if (response.config._slowToastId !== null) {
      toast.dismiss('server-wakeup')
    }
    return response
  },
  (error) => {
    if (error.config) {
      clearTimeout(error.config._slowTimer)
      toast.dismiss('server-wakeup')
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
