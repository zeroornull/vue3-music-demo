import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/api/http'
import { API_HOST_STORAGE_KEY } from '@/config/apiHost'
import { useHostStore } from '@/stores/host'

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

describe('host store', () => {
  let storage: MemoryStorage

  beforeEach(() => {
    storage = new MemoryStorage()
    vi.stubGlobal('localStorage', storage)
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    http.raw.defaults.baseURL = undefined
  })

  it('reads the legacy BASE_URL key and exposes configuration state', () => {
    storage.setItem(API_HOST_STORAGE_KEY, 'https://music.example.com')
    const store = useHostStore()

    expect(store.apiHost).toBe('https://music.example.com')
    expect(store.isConfigured).toBe(true)
  })

  it('normalizes and applies a host without reloading the page', () => {
    const store = useHostStore()

    expect(store.setHost('https://music.example.com/api/')).toBe(
      'https://music.example.com/api',
    )
    expect(store.apiHost).toBe('https://music.example.com/api')
    expect(storage.getItem(API_HOST_STORAGE_KEY)).toBe('https://music.example.com/api')
    expect(http.raw.defaults.baseURL).toBe('https://music.example.com/api')
  })

  it('clears the persisted host and HTTP base URL', () => {
    const store = useHostStore()
    store.setHost('https://music.example.com')

    store.clearHost()

    expect(store.apiHost).toBe('')
    expect(store.isConfigured).toBe(false)
    expect(storage.getItem(API_HOST_STORAGE_KEY)).toBeNull()
    expect(http.raw.defaults.baseURL).toBeUndefined()
  })
})
