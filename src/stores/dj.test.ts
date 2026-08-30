import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDjBanners, getDjProgramDetail, getPersonalizedDjPrograms } from '@/api/dj'
import { useDjStore } from '@/stores/dj'

vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjBanners: vi.fn(),
    getDjProgramDetail: vi.fn(),
    getPersonalizedDjPrograms: vi.fn(),
  }
})

const banner = {
  bannerId: 1,
  pic: 'https://images.example.com/dj-banner.jpg',
  targetId: 301,
  targetType: 1,
  typeTitle: '深夜首播',
}

const program = {
  copywriter: '睡前电台',
  id: 901,
  name: '深夜民谣',
  picUrl: 'https://images.example.com/dj.jpg',
}

const detail = {
  coverUrl: 'https://images.example.com/dj-cover.jpg',
  description: '林间电台的深夜节目。',
  djName: '林间主播',
  duration: 180_000,
  id: 901,
  listenerCount: 1280,
  name: '深夜民谣',
  radioName: '林间电台',
  song: {
    artists: [{ id: 401, name: '林间电台' }],
    duration: 180_000,
    id: 301,
    name: '晚风来信',
  },
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('dj store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getDjBanners).mockReset()
    vi.mocked(getDjProgramDetail).mockReset()
    vi.mocked(getPersonalizedDjPrograms).mockReset()
  })

  it('loads hall banners once and treats a failed page as a cache miss', async () => {
    vi.mocked(getDjBanners)
      .mockRejectedValueOnce(new Error('banner offline'))
      .mockResolvedValueOnce([banner])
    const store = useDjStore()

    await expect(store.loadBanners()).rejects.toThrow('banner offline')
    await store.loadBanners()
    await store.loadBanners()

    expect(store.banners).toEqual([banner])
    expect(store.bannersError).toBeNull()
    expect(getDjBanners).toHaveBeenCalledTimes(2)
  })

  it('loads recommended programs once and treats a failed page as a cache miss', async () => {
    vi.mocked(getPersonalizedDjPrograms)
      .mockRejectedValueOnce(new Error('dj offline'))
      .mockResolvedValueOnce([program])
    const store = useDjStore()

    await expect(store.loadPrograms()).rejects.toThrow('dj offline')
    await store.loadPrograms()
    await store.loadPrograms()

    expect(store.programs).toEqual([program])
    expect(store.programsError).toBeNull()
    expect(getPersonalizedDjPrograms).toHaveBeenCalledTimes(2)
  })

  it('loads program detail and caches by id', async () => {
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    const store = useDjStore()

    await store.load(901)
    await store.load(901)

    expect(store.program).toEqual(detail)
    expect(getDjProgramDetail).toHaveBeenCalledTimes(1)
    expect(store.error).toBeNull()
  })

  it('rejects an invalid program id without wiping recommended programs', async () => {
    vi.mocked(getPersonalizedDjPrograms).mockResolvedValue([program])
    const store = useDjStore()
    await store.loadPrograms()

    await expect(store.load(0)).rejects.toThrow('缺少有效的电台节目 ID')
    expect(getDjProgramDetail).not.toHaveBeenCalled()
    expect(store.programs).toEqual([program])
    expect(store.program).toBeNull()
    expect(store.error).toBe('缺少有效的电台节目 ID')
  })

  it('treats a failed detail load as a cache miss', async () => {
    vi.mocked(getDjProgramDetail)
      .mockRejectedValueOnce(new Error('dj offline'))
      .mockResolvedValueOnce(detail)
    const store = useDjStore()

    await expect(store.load(901)).rejects.toThrow('dj offline')
    await store.load(901)

    expect(store.program).toEqual(detail)
    expect(store.error).toBeNull()
    expect(getDjProgramDetail).toHaveBeenCalledTimes(2)
  })

  it('drops in-flight program detail after reset', async () => {
    const pendingDetail = deferred<typeof detail>()
    vi.mocked(getDjProgramDetail).mockReturnValueOnce(pendingDetail.promise)
    const store = useDjStore()
    const pending = store.load(901)
    store.reset()
    pendingDetail.resolve(detail)
    await pending

    expect(store.program).toBeNull()
    expect(store.loadedId).toBeNull()
    expect(store.loading).toBe(false)
  })

  it('drops in-flight recommended programs after reset', async () => {
    const pendingPrograms = deferred<typeof program[]>()
    vi.mocked(getPersonalizedDjPrograms).mockReturnValueOnce(
      pendingPrograms.promise,
    )
    const store = useDjStore()
    const pending = store.loadPrograms()
    store.reset()
    pendingPrograms.resolve([program])
    await pending

    expect(store.programs).toEqual([])
    expect(store.programsLoading).toBe(false)
  })

  it('drops in-flight hall banners after reset', async () => {
    const pendingBanners = deferred<typeof banner[]>()
    vi.mocked(getDjBanners).mockReturnValueOnce(pendingBanners.promise)
    const store = useDjStore()
    const pending = store.loadBanners()
    store.reset()
    pendingBanners.resolve([banner])
    await pending

    expect(store.banners).toEqual([])
    expect(store.bannersLoading).toBe(false)
  })

  it('does not wipe hall banners when resetting program detail', async () => {
    vi.mocked(getDjBanners).mockResolvedValue([banner])
    const store = useDjStore()
    await store.loadBanners()
    store.resetDetail()
    expect(store.banners).toEqual([banner])
  })
})
