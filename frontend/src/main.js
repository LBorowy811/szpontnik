import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js';
import { useTheme } from './assets/theme.js'

const { detectSystemTheme } = useTheme();
detectSystemTheme();

createApp(App).use(router).mount('#app')
