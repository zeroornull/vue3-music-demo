import { describe, expect, it } from 'vitest'

import {
  PLAYER_VOLUME_STORAGE_KEY,
  readPlayerVolume,
  savePlayerVolume,
} from '@/config/playerVolume'

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

describe('player volume config', () => {
  it('defaults to 1 and ignores invalid stored values', () => {
    const storage = new MemoryStorage()
    expect(readPlayerVolume(storage)).toBe(1)
    storage.setItem(PLAYER_VOLUME_STORAGE_KEY, 'sepia')
    expect(readPlayerVolume(storage)).toBe(1)
    storage.setItem(PLAYER_VOLUME_STORAGE_KEY, '150')
    expect(readPlayerVolume(storage)).toBe(1)
    storage.setItem(PLAYER_VOLUME_STORAGE_KEY, '-1')
    expect(readPlayerVolume(storage)).toBe(1)
    storage.setItem(PLAYER_VOLUME_STORAGE_KEY, '40.5')
    expect(readPlayerVolume(storage)).toBe(1)
  })

  it('reads a 0-100 integer as a 0-1 volume', () => {
    const storage = new MemoryStorage()
    storage.setItem(PLAYER_VOLUME_STORAGE_KEY, '0')
    expect(readPlayerVolume(storage)).toBe(0)
    storage.setItem(PLAYER_VOLUME_STORAGE_KEY, '40')
    expect(readPlayerVolume(storage)).toBe(0.4)
    storage.setItem(PLAYER_VOLUME_STORAGE_KEY, '100')
    expect(readPlayerVolume(storage)).toBe(1)
  })

  it('persists a clamped 0-1 volume as a 0-100 integer', () => {
    const storage = new MemoryStorage()
    expect(savePlayerVolume(0.4, storage)).toBe(0.4)
    expect(storage.getItem(PLAYER_VOLUME_STORAGE_KEY)).toBe('40')
    expect(readPlayerVolume(storage)).toBe(0.4)
    expect(savePlayerVolume(4, storage)).toBe(1)
    expect(storage.getItem(PLAYER_VOLUME_STORAGE_KEY)).toBe('100')
    expect(savePlayerVolume(-1, storage)).toBe(0)
    expect(storage.getItem(PLAYER_VOLUME_STORAGE_KEY)).toBe('0')
    expect(savePlayerVolume(Number.NaN, storage)).toBe(0)
    expect(storage.getItem(PLAYER_VOLUME_STORAGE_KEY)).toBe('0')
    expect(savePlayerVolume(Number.POSITIVE_INFINITY, storage)).toBe(0)
    expect(storage.getItem(PLAYER_VOLUME_STORAGE_KEY)).toBe('0')
  })
})
