import { ref } from 'vue';

const theme = ref('dark')

export function useTheme() {
  const media = window.matchMedia('(prefers-color-scheme: light)');

  function applyTheme(newTheme) {
    theme.value = newTheme;
    document.documentElement.classList.toggle('light', newTheme === 'light');
    localStorage.setItem('theme', newTheme);
  }

  function toggleTheme() {
    applyTheme(theme.value === 'light' ? 'dark' : 'light');
  }

  function detectSystemTheme() {
    const saved = localStorage.getItem('theme');

    if (saved) {
        applyTheme(saved);
    } else {
        applyTheme(media.matches ? 'light' : 'dark');
    }
  }

  media.addEventListener('change', e => {
    const saved = localStorage.getItem('theme');
    if (!saved) {
        applyTheme(e.matches ? 'light' : 'dark'); // fallback
    }
  });

  return { useTheme, applyTheme, toggleTheme, detectSystemTheme };
}
