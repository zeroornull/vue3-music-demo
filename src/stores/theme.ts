import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { readTheme, saveTheme, type ThemeMode } from '@/config/theme'

function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', mode)
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readTheme())
  const isDark = computed(() => mode.value === 'dark')

  applyTheme(mode.value)

  function setMode(next: ThemeMode) {
    mode.value = saveTheme(next)
    applyTheme(mode.value)
  }

  function toggle() {
    setMode(mode.value === 'dark' ? 'light' : 'dark')
  }

  return { isDark, mode, setMode, toggle }
})
