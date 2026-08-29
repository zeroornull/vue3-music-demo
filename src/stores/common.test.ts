import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getBanners } from '@/api/banner'
import { useCommonStore } from '@/stores/common'

vi.mock('@/api/banner', () => ({
  getBanners: vi.fn(),
}))

const banner = {
  bannerId: 1,
  pic: 'https://images.example.com/banner.jpg',
  targetId: 2,
  targetType: 1,
  typeTitle: '新歌首发',
}

describe('common store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getBanners).mockReset()
  })

  it('loads banners once and reuses the cached result', async () => {
    vi.mocked(getBanners).mockResolvedValue([banner])
    const store = useCommonStore()

    await store.loadBanners()
    await store.loadBanners()

    expect(store.banners).toEqual([banner])
    expect(getBanners).toHaveBeenCalledTimes(1)
    expect(store.error).toBeNull()
  })

  it('supports a forced refresh and records request errors', async () => {
    vi.mocked(getBanners).mockResolvedValueOnce([banner]).mockRejectedValueOnce(new Error('offline'))
    const store = useCommonStore()

    await store.loadBanners()
    await expect(store.loadBanners(true)).rejects.toThrow('offline')

    expect(getBanners).toHaveBeenCalledTimes(2)
    expect(store.error).toBe('offline')
    expect(store.loading).toBe(false)
  })

  it('drops in-flight banners after reset', async () => {
    let resolveBanners!: (value: typeof banner[]) => void
    vi.mocked(getBanners).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBanners = resolve
      }),
    )
    const store = useCommonStore()
    const pending = store.loadBanners()
    store.reset()
    resolveBanners([banner])
    await pending

    expect(store.banners).toEqual([])
    expect(store.loading).toBe(false)
  })
})
