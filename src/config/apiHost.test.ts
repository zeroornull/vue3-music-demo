import { describe, expect, it } from 'vitest'

import {
  API_HOST_STORAGE_KEY,
  clearStoredApiHost,
  normalizeApiHost,
  readApiHost,
  saveApiHost,
} from '@/config/apiHost'

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

describe('API host configuration', () => {
  it('normalizes supported hosts and removes trailing slashes', () => {
    expect(normalizeApiHost('  http://127.0.0.1:3000///  ')).toBe('http://127.0.0.1:3000')
    expect(normalizeApiHost('https://music.example.com/api/')).toBe(
      'https://music.example.com/api',
    )
  })

  it.each([
    '',
    'music.example.com',
    'ftp://music.example.com',
    'https://user:secret@music.example.com',
    'https://music.example.com?token=secret',
    'https://music.example.com/#section',
  ])('rejects an unsafe or incomplete host: %s', (value) => {
    expect(() => normalizeApiHost(value)).toThrow()
  })

  it('persists, reads and clears the normalized host', () => {
    const storage = new MemoryStorage()

    expect(saveApiHost('https://music.example.com/', storage)).toBe('https://music.example.com')
    expect(storage.getItem(API_HOST_STORAGE_KEY)).toBe('https://music.example.com')
    expect(readApiHost(storage)).toBe('https://music.example.com')

    clearStoredApiHost(storage)
    expect(readApiHost(storage)).toBe('')
  })

  it('falls back to the environment host when storage is empty or invalid', () => {
    const storage = new MemoryStorage()
    expect(readApiHost(storage, 'https://fallback.example.com/')).toBe(
      'https://fallback.example.com',
    )

    storage.setItem(API_HOST_STORAGE_KEY, 'not-a-url')
    expect(readApiHost(storage, 'https://fallback.example.com/')).toBe(
      'https://fallback.example.com',
    )
  })
})
