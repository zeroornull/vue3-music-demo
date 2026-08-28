import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPersonalizedMvs } from '@/api/mv'
import { useVideoStore } from '@/stores/video'

vi.mock('@/api/mv', () => ({
  getPersonalizedMvs: vi.fn(),
}))

const mv = {
  alg: 'featured',
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  canDislike: false,
  copywriter: '热门推荐',
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/mv.jpg',
  playCount: 3_280_000,
  subed: false,
  type: 1,
}

describe('video store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPersonalizedMvs).mockReset()
  })

  it('loads and caches personalized MVs', async () => {
    vi.mocked(getPersonalizedMvs).mockResolvedValue([mv])
    const store = useVideoStore()

    await store.loadMvs()
    await store.loadMvs()

    expect(store.mvs).toEqual([mv])
    expect(getPersonalizedMvs).toHaveBeenCalledTimes(1)
    expect(store.mvsError).toBeNull()
  })

  it('supports forced refresh and error state', async () => {
    vi.mocked(getPersonalizedMvs)
      .mockResolvedValueOnce([mv])
      .mockRejectedValueOnce(new Error('mv offline'))
    const store = useVideoStore()

    await store.loadMvs()
    await expect(store.loadMvs(true)).rejects.toThrow('mv offline')

    expect(getPersonalizedMvs).toHaveBeenCalledTimes(2)
    expect(store.mvsError).toBe('mv offline')
    expect(store.mvsLoading).toBe(false)
  })
})
