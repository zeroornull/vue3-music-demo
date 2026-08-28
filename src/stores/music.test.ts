import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPersonalizedPlaylists } from '@/api/personalized'
import { useMusicStore } from '@/stores/music'

vi.mock('@/api/personalized', () => ({
  getPersonalizedPlaylists: vi.fn(),
}))

const playlist = {
  alg: 'featured',
  canDislike: false,
  copywriter: '根据你的音乐口味推荐',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  picUrl: 'https://images.example.com/playlist.jpg',
  playCount: 128_000,
  trackCount: 50,
  trackNumberUpdateTime: 0,
  type: 0,
}

describe('music store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPersonalizedPlaylists).mockReset()
  })

  it('loads personalized playlists once and caches the result', async () => {
    vi.mocked(getPersonalizedPlaylists).mockResolvedValue([playlist])
    const store = useMusicStore()

    await store.loadPersonalized()
    await store.loadPersonalized()

    expect(store.personalized).toEqual([playlist])
    expect(getPersonalizedPlaylists).toHaveBeenCalledTimes(1)
    expect(store.personalizedError).toBeNull()
  })

  it('supports forced refresh and records errors', async () => {
    vi.mocked(getPersonalizedPlaylists)
      .mockResolvedValueOnce([playlist])
      .mockRejectedValueOnce(new Error('offline'))
    const store = useMusicStore()

    await store.loadPersonalized()
    await expect(store.loadPersonalized(true)).rejects.toThrow('offline')

    expect(getPersonalizedPlaylists).toHaveBeenCalledTimes(2)
    expect(store.personalizedError).toBe('offline')
    expect(store.personalizedLoading).toBe(false)
  })
})
