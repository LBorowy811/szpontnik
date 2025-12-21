import axios from 'axios'

// funkcja do okreslenia baseURL w zaleznosci od srodowiska
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
  withCredentials: true, // ciasteczka z tokenami
})

// flaga refresh oznaczajaca trwajace odswiezanie tokenu
let isRefreshing = false;

// kolejka requestow oczekujacych na odswiezenie tokenu
let failedQueue = [];

// przetwarzanie kolejki po zakończeniu refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
}

api.interceptors.response.use(
  (response) => {

    // zapisanie danych do localStorage jezeli odpowiedz je zawiera
    if (response.data.user) {
     localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },
  async (error) => {
    
    // error.config => konfiguracja żądania, ktore się nie powiodło (URL, metoda, nagłówki, dane itd.)
    const originalRequest = error.config

    if (error.response) {

      // bledy logowania i rejestracj
      if (originalRequest.url.includes('/auth/login') || 
          originalRequest.url.includes('/auth/register')
      ) {
        const message = error.response.data?.message || 'Wystąpił błąd';
        return Promise.reject(new Error(message));
      }

      // access token wygasl lub jest nieprawidlowy
      if ((error.response.status === 401 || error.response.status === 403) && !originalRequest._retry) {

        // wylogowanie po nieudanym refreshu
        if (originalRequest.url.includes('/auth/refresh')) {
          localStorage.removeItem('user'); // usuniecie danych z localStorage

          // przekierowanie
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Sesja wygasła. Proszę zalogować się ponownie.'));
        }

        // dodawanie requestu do kolejki jezeli refresh juz trwa
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then(() => {
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            })
        }

        // oznaczenie requestu jako retry
        originalRequest._retry = true
        isRefreshing = true

        try {
          // odswiezanie access tokenu
          await api.post('/auth/refresh');

          isRefreshing = false
          processQueue(null)

          // ponow oryginalny request
          return api(originalRequest);
          
        } catch (refreshError) {

          isRefreshing = false;
          processQueue(refreshError, null);

          // wylogowanie po nieudanym refreshu
          localStorage.removeItem('user');

          // przekierowanie
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
          return Promise.reject(new Error('Sesja wygasła. Proszę zalogować się ponownie.'))
        }
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
  updateAccount: (userData) => api.put('/auth/update-account', userData),
}

export default api;
