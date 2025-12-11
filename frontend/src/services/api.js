import axios from 'axios'

const getApiBaseURL = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api';
  }
  return `http://${window.location.hostname}:3000/api`;
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => {
     if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
     }
     return response;
  },
  (error) => {
    if (error.response) {
      // token wygasł lub jest nieprawidłowy
      if (error.response.status === 401 || error.response.status === 403) {
        localStorage.removeItem('user');
        
        // przekierowanie do strony logowania jeśli nie jestesmy juz na niej
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        } 
        return Promise.reject(new Error('Sesja wygasła. Proszę zalogować się ponownie.'))
      }
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
  logout: () => api.post('/auth/logout'),
}

export default api;
