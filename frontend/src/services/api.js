import axios from 'axios'

const api = axios.create({
  baseURL: '/api', // http://localhost:3000/api
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message || 'Wystąpił błąd serwera'
      return Promise.reject(new Error(message))
    } else if (error.request) {
      return Promise.reject(new Error('Brak połączenia z serwerem'))
    } else {
      return Promise.reject(new Error('Wystąpił nieoczekiwany błąd'))
    }
  }
)

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
}

export default api

