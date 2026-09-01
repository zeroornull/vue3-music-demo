// @vitest-environment happy-dom

import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { THEME_STORAGE_KEY } from '@/config/theme'
import { useThemeStore } from '@/stores/theme'

class MemoryStorage implements Storage {
  readonly values = new Map<string, string>()
  get length() {
    return this.values.size
  }
  clear() {
    this.values.clear()
  }
  getItem(key: string) {
    return this.values.get(key) ?? null
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.values.delete(key)
  }
  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('theme store', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)
    document.documentElement.removeAttribute('data-theme')
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.documentElement.removeAttribute('data-theme')
  })

  it('applies a stored dark theme to the document', () => {
    storage.setItem(THEME_STORAGE_KEY, 'dark')
    const store = useThemeStore()
    expect(store.mode).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('toggles and persists the theme', () => {
    const store = useThemeStore()
    expect(store.mode).toBe('light')
    store.toggle()
    expect(store.mode).toBe('dark')
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    store.toggle()
    expect(store.mode).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
