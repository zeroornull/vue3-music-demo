import { describe, expect, it } from 'vitest'

import {
  THEME_STORAGE_KEY,
  readTheme,
  saveTheme,
} from '@/config/theme'

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

describe('theme config', () => {
  it('defaults to light and ignores unknown stored values', () => {
    const storage = new MemoryStorage()
    expect(readTheme(storage)).toBe('light')
    storage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readTheme(storage)).toBe('light')
  })

  it('persists light and dark', () => {
    const storage = new MemoryStorage()
    expect(saveTheme('dark', storage)).toBe('dark')
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(readTheme(storage)).toBe('dark')
    expect(saveTheme('light', storage)).toBe('light')
    expect(readTheme(storage)).toBe('light')
  })
})
