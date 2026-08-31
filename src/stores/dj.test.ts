import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DJ_RADIO_PAGE_SIZE,
  DJ_RADIO_PROGRAM_PAGE_SIZE,
  getDjBanners,
  getDjCategories,
  getDjProgramDetail,
  getDjRadioDetail,
  getDjRadioPrograms,
  getHotDjRadios,
  getPersonalizedDjPrograms,
} from '@/api/dj'
import { useDjStore } from '@/stores/dj'

vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjBanners: vi.fn(),
    getDjCategories: vi.fn(),
    getDjProgramDetail: vi.fn(),
    getDjRadioDetail: vi.fn(),
    getDjRadioPrograms: vi.fn(),
    getHotDjRadios: vi.fn(),
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

const category = { id: 2, name: '音乐故事' }
const radio = {
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
  playCount: 12_000,
  rcmdText: '睡前故事',
}
const radioDetail = {
  category: '音乐故事',
  desc: '夜航第一季。<img src=x>',
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
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
    vi.mocked(getDjCategories).mockReset()
    vi.mocked(getDjProgramDetail).mockReset()
    vi.mocked(getDjRadioDetail).mockReset()
    vi.mocked(getDjRadioPrograms).mockReset()
    vi.mocked(getHotDjRadios).mockReset()
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

  it('loads categories once and radios for the selected category', async () => {
    vi.mocked(getDjCategories).mockResolvedValue([category])
    vi.mocked(getHotDjRadios).mockResolvedValue({ more: true, radios: [radio] })
    const store = useDjStore()

    await store.loadCategories()
    await store.loadCategories()
    await store.setCate(2)
    await store.setCate(2)

    expect(store.categories).toEqual([category])
    expect(store.radios).toEqual([radio])
    expect(store.cateId).toBe(2)
    expect(store.radiosMore).toBe(true)
    expect(getDjCategories).toHaveBeenCalledTimes(1)
    expect(getHotDjRadios).toHaveBeenCalledTimes(1)
    expect(getHotDjRadios).toHaveBeenCalledWith({
      cateId: 2,
      limit: DJ_RADIO_PAGE_SIZE,
      offset: 0,
    })
  })

  it('appends the next radio page and drops a stale load-more after category change', async () => {
    const next = { ...radio, id: 802, name: '下一页电台' }
    const pending = deferred<{ more: boolean; radios: typeof radio[] }>()
    vi.mocked(getHotDjRadios)
      .mockResolvedValueOnce({ more: true, radios: [radio] })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({
        more: false,
        radios: [{ ...radio, id: 803, name: '创作电台' }],
      })
    const store = useDjStore()
    await store.setCate(2)
    const more = store.loadMoreRadios()
    await store.setCate(6)
    pending.resolve({ more: false, radios: [next] })
    await more

    expect(store.cateId).toBe(6)
    expect(store.radios).toEqual([{ ...radio, id: 803, name: '创作电台' }])
    expect(getHotDjRadios).toHaveBeenNthCalledWith(2, {
      cateId: 2,
      limit: DJ_RADIO_PAGE_SIZE,
      offset: 1,
    })
    expect(getHotDjRadios).toHaveBeenNthCalledWith(3, {
      cateId: 6,
      limit: DJ_RADIO_PAGE_SIZE,
      offset: 0,
    })
  })

  it('loads radio detail and programs, and clears them on reset', async () => {
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms)
      .mockResolvedValueOnce({ more: true, programs: [program] })
      .mockResolvedValueOnce({
        more: false,
        programs: [{ ...program, id: 902, name: '下一期' }],
      })
    const store = useDjStore()
    await store.loadRadio(801)
    await store.loadRadio(801)
    await store.loadMoreRadioPrograms()

    expect(store.radio).toEqual(radioDetail)
    expect(store.radioPrograms.map((item) => item.id)).toEqual([901, 902])
    expect(getDjRadioDetail).toHaveBeenCalledTimes(1)
    expect(getDjRadioPrograms).toHaveBeenNthCalledWith(2, {
      limit: DJ_RADIO_PROGRAM_PAGE_SIZE,
      offset: 1,
      rid: 801,
    })

    store.reset()
    expect(store.radio).toBeNull()
    expect(store.radioPrograms).toEqual([])
    expect(store.categories).toEqual([])
    expect(store.radios).toEqual([])
    expect(store.cateId).toBe(0)
  })
})
