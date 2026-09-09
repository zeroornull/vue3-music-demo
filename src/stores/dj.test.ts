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
  getDjProgramToplist,
  getDjRadioToplist,
  getHotDjRadios,
  getPersonalizedDjPrograms,
} from '@/api/dj'
import { COMMENT_LIMIT, getDjCommentPage, getDjRadioComments } from '@/api/comment'
import { useDjStore } from '@/stores/dj'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getDjCommentPage: vi.fn(),
  getDjRadioComments: vi.fn(),
}))

vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjBanners: vi.fn(),
    getDjCategories: vi.fn(),
    getDjProgramDetail: vi.fn(),
    getDjRadioDetail: vi.fn(),
    getDjRadioPrograms: vi.fn(),
    getDjProgramToplist: vi.fn(),
    getDjRadioToplist: vi.fn(),
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
  categoryId: 2,
  desc: '夜航第一季。<img src=x>',
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
}

const relatedRadio = {
  djName: '海岸主播',
  id: 802,
  name: '潮汐电台',
  picUrl: 'https://images.example.com/radio2.jpg',
  playCount: 8_000,
  rcmdText: '潮汐故事',
}

async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

const detail = {
  coverUrl: 'https://images.example.com/dj-cover.jpg',
  description: '林间电台的深夜节目。',
  djName: '林间主播',
  duration: 180_000,
  id: 901,
  listenerCount: 1280,
  name: '深夜民谣',
  radioId: 801,
  radioName: '林间电台',
  song: {
    artists: [{ id: 401, name: '林间电台' }],
    duration: 180_000,
    id: 301,
    name: '晚风来信',
  },
}

const relatedProgram = {
  copywriter: '潮汐电台',
  id: 902,
  name: '潮汐夜话',
  picUrl: 'https://images.example.com/ep2.jpg',
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
    vi.mocked(getDjRadioPrograms).mockRejectedValue(new Error('no programs'))
    vi.mocked(getHotDjRadios).mockReset()
    vi.mocked(getHotDjRadios).mockRejectedValue(new Error('no radios'))
    vi.mocked(getPersonalizedDjPrograms).mockReset()
    vi.mocked(getDjProgramToplist).mockReset()
    vi.mocked(getDjRadioToplist).mockReset()
    vi.mocked(getDjCommentPage).mockReset()
    vi.mocked(getDjCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getDjRadioComments).mockReset()
    vi.mocked(getDjRadioComments).mockRejectedValue(new Error('no radio comments'))
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

  it('loads program toplist independently of recommended programs', async () => {
    const ranked = { ...program, copywriter: '夜航电台', picUrl: 'https://images.example.com/top.jpg' }
    vi.mocked(getDjProgramToplist).mockResolvedValue([ranked])
    vi.mocked(getPersonalizedDjPrograms).mockResolvedValue([program])
    const store = useDjStore()

    await store.loadToplist()
    await store.loadToplist()
    await store.loadPrograms()

    expect(store.toplistPrograms).toEqual([ranked])
    expect(getDjProgramToplist).toHaveBeenCalledTimes(1)
    expect(store.toplistError).toBeNull()
    expect(store.programs).toEqual([program])
  })

  it('keeps recommended programs when the toplist fails', async () => {
    vi.mocked(getPersonalizedDjPrograms).mockResolvedValue([program])
    vi.mocked(getDjProgramToplist).mockRejectedValue(new Error('toplist offline'))
    const store = useDjStore()

    await store.loadPrograms()
    await expect(store.loadToplist()).rejects.toThrow('toplist offline')

    expect(store.programs).toEqual([program])
    expect(store.toplistPrograms).toEqual([])
    expect(store.toplistError).toBe('toplist offline')
    expect(store.toplistLoading).toBe(false)
  })

  it('does not drop in-flight toplist when recommended programs load', async () => {
    const ranked = { ...program, copywriter: '夜航电台' }
    const pendingToplist = deferred<typeof program[]>()
    vi.mocked(getDjProgramToplist).mockReturnValueOnce(pendingToplist.promise)
    vi.mocked(getPersonalizedDjPrograms).mockResolvedValue([program])
    const store = useDjStore()
    const pending = store.loadToplist()
    await store.loadPrograms()
    pendingToplist.resolve([ranked])
    await pending

    expect(store.programs).toEqual([program])
    expect(store.toplistPrograms).toEqual([ranked])
    expect(store.toplistError).toBeNull()
  })

  it('drops in-flight toplist after reset', async () => {
    const pendingToplist = deferred<typeof program[]>()
    vi.mocked(getDjProgramToplist).mockReturnValueOnce(pendingToplist.promise)
    const store = useDjStore()
    const pending = store.loadToplist()
    store.reset()
    pendingToplist.resolve([program])
    await pending

    expect(store.toplistPrograms).toEqual([])
    expect(store.toplistLoading).toBe(false)
  })

  it('loads radio ranking independently of category radios', async () => {
    vi.mocked(getDjRadioToplist).mockResolvedValue([radio])
    vi.mocked(getDjCategories).mockResolvedValue([category])
    vi.mocked(getHotDjRadios).mockResolvedValue({ more: false, radios: [relatedRadio] })
    const store = useDjStore()

    await store.loadRadioToplist()
    await store.loadRadioToplist()
    await store.setCate(2)

    expect(store.radioToplist).toEqual([radio])
    expect(getDjRadioToplist).toHaveBeenCalledTimes(1)
    expect(store.radioToplistError).toBeNull()
    expect(store.radios).toEqual([relatedRadio])
  })

  it('keeps category radios when ranking fails', async () => {
    vi.mocked(getDjCategories).mockResolvedValue([category])
    vi.mocked(getHotDjRadios).mockResolvedValue({ more: false, radios: [radio] })
    vi.mocked(getDjRadioToplist).mockRejectedValue(new Error('rank offline'))
    const store = useDjStore()

    await store.setCate(2)
    await expect(store.loadRadioToplist()).rejects.toThrow('rank offline')

    expect(store.radios).toEqual([radio])
    expect(store.radioToplist).toEqual([])
    expect(store.radioToplistError).toBe('rank offline')
    expect(store.radioToplistLoading).toBe(false)
  })

  it('does not drop in-flight radio ranking when category radios load', async () => {
    const pendingRank = deferred<typeof radio[]>()
    vi.mocked(getDjRadioToplist).mockReturnValueOnce(pendingRank.promise)
    vi.mocked(getDjCategories).mockResolvedValue([category])
    vi.mocked(getHotDjRadios).mockResolvedValue({ more: false, radios: [relatedRadio] })
    const store = useDjStore()
    const pending = store.loadRadioToplist()
    await store.setCate(2)
    pendingRank.resolve([radio])
    await pending

    expect(store.radios).toEqual([relatedRadio])
    expect(store.radioToplist).toEqual([radio])
    expect(store.radioToplistError).toBeNull()
  })

  it('drops in-flight radio ranking after reset', async () => {
    const pendingRank = deferred<typeof radio[]>()
    vi.mocked(getDjRadioToplist).mockReturnValueOnce(pendingRank.promise)
    const store = useDjStore()
    const pending = store.loadRadioToplist()
    store.reset()
    pendingRank.resolve([radio])
    await pending

    expect(store.radioToplist).toEqual([])
    expect(store.radioToplistLoading).toBe(false)
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
    expect(store.relatedRadios).toBeNull()
    expect(store.radioComments).toBeNull()
    expect(store.relatedPrograms).toBeNull()
    expect(store.categories).toEqual([])
    expect(store.radios).toEqual([])
    expect(store.cateId).toBe(0)
  })

  it('loads more radios with the detail and ignores a related failure', async () => {
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getHotDjRadios).mockResolvedValue({
      more: false,
      radios: [
        { ...radio, id: 801, name: '自己' },
        { ...relatedRadio, id: 0, name: '无效' },
        relatedRadio,
      ],
    })
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()
    await store.loadRadio(801)

    expect(store.relatedRadios).toEqual([relatedRadio])
    expect(store.radios).toEqual([])
    expect(getDjRadioDetail).toHaveBeenCalledTimes(1)
    expect(getHotDjRadios).toHaveBeenCalledTimes(1)
    expect(getHotDjRadios).toHaveBeenCalledWith({ cateId: 2 })
  })

  it('keeps the radio when more radios fail', async () => {
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getHotDjRadios).mockRejectedValue(new Error('radios offline'))
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()

    expect(store.radio).toEqual(radioDetail)
    expect(store.radioPrograms).toEqual([program])
    expect(store.relatedRadios).toBeNull()
    expect(store.radioError).toBeNull()
  })

  it('retries more radios on a cached radio when the first related request failed', async () => {
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getHotDjRadios)
      .mockRejectedValueOnce(new Error('radios offline'))
      .mockResolvedValueOnce({ more: false, radios: [relatedRadio] })
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()
    expect(store.relatedRadios).toBeNull()

    await store.loadRadio(801)
    await settle()

    expect(getDjRadioDetail).toHaveBeenCalledTimes(1)
    expect(getHotDjRadios).toHaveBeenCalledTimes(2)
    expect(store.relatedRadios).toEqual([relatedRadio])
  })

  it('does not keep stale more radios after the radio id changes', async () => {
    const first = deferred<{ more: boolean; radios: typeof relatedRadio[] }>()
    const nextRadio = { ...radioDetail, id: 802, name: '潮汐电台', categoryId: 6 }
    const nextRelated = { ...relatedRadio, id: 803, name: '下一台' }
    vi.mocked(getDjRadioDetail)
      .mockResolvedValueOnce(radioDetail)
      .mockResolvedValueOnce(nextRadio)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getHotDjRadios)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ more: false, radios: [nextRelated] })
    const store = useDjStore()

    await store.loadRadio(801)
    await store.loadRadio(802)
    await settle()
    first.resolve({ more: false, radios: [relatedRadio] })
    await settle()

    expect(store.radio?.id).toBe(802)
    expect(store.relatedRadios).toEqual([nextRelated])
    expect(getHotDjRadios).toHaveBeenLastCalledWith({ cateId: 6 })
  })

  it('skips more radios when the category id is missing', async () => {
    vi.mocked(getDjRadioDetail).mockResolvedValue({ ...radioDetail, categoryId: 0 })
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()

    expect(getHotDjRadios).not.toHaveBeenCalled()
    expect(store.relatedRadios).toEqual([])
  })

  it('does not drop in-flight more radios when loading more programs', async () => {
    const first = deferred<{ more: boolean; radios: typeof relatedRadio[] }>()
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms)
      .mockResolvedValueOnce({ more: true, programs: [program] })
      .mockResolvedValueOnce({
        more: false,
        programs: [{ ...program, id: 902, name: '下一期' }],
      })
    vi.mocked(getHotDjRadios).mockReturnValueOnce(first.promise)
    const store = useDjStore()

    await store.loadRadio(801)
    await store.loadMoreRadioPrograms()
    first.resolve({ more: false, radios: [relatedRadio] })
    await settle()

    expect(store.relatedRadios).toEqual([relatedRadio])
    expect(store.radioPrograms.map((item) => item.id)).toEqual([901, 902])
  })

  it('loads more programs with the detail and ignores a related failure', async () => {
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({
      more: false,
      programs: [
        { ...program, id: 901, name: '自己' },
        { ...program, id: 0, name: '无效' },
        relatedProgram,
      ],
    })
    const store = useDjStore()

    await store.load(901)
    await settle()
    await store.load(901)

    expect(store.relatedPrograms).toEqual([relatedProgram])
    expect(store.radioPrograms).toEqual([])
    expect(store.programs).toEqual([])
    expect(getDjProgramDetail).toHaveBeenCalledTimes(1)
    expect(getDjRadioPrograms).toHaveBeenCalledTimes(1)
    expect(getDjRadioPrograms).toHaveBeenCalledWith({ rid: 801 })
  })

  it('keeps the program when more programs fail', async () => {
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjRadioPrograms).mockRejectedValue(new Error('programs offline'))
    const store = useDjStore()

    await store.load(901)
    await settle()

    expect(store.program).toEqual(detail)
    expect(store.relatedPrograms).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries more programs on a cached program when the first related request failed', async () => {
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjRadioPrograms)
      .mockRejectedValueOnce(new Error('programs offline'))
      .mockResolvedValueOnce({ more: false, programs: [relatedProgram] })
    const store = useDjStore()

    await store.load(901)
    await settle()
    expect(store.relatedPrograms).toBeNull()

    await store.load(901)
    await settle()

    expect(getDjProgramDetail).toHaveBeenCalledTimes(1)
    expect(getDjRadioPrograms).toHaveBeenCalledTimes(2)
    expect(store.relatedPrograms).toEqual([relatedProgram])
  })

  it('does not keep stale more programs after the program id changes', async () => {
    const first = deferred<{ more: boolean; programs: typeof relatedProgram[] }>()
    const nextDetail = { ...detail, id: 902, name: '潮汐夜话', radioId: 802 }
    const nextRelated = { ...relatedProgram, id: 903, name: '下一期' }
    vi.mocked(getDjProgramDetail)
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce(nextDetail)
    vi.mocked(getDjRadioPrograms)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ more: false, programs: [nextRelated] })
    const store = useDjStore()

    await store.load(901)
    await store.load(902)
    await settle()
    first.resolve({ more: false, programs: [relatedProgram] })
    await settle()

    expect(store.program?.id).toBe(902)
    expect(store.relatedPrograms).toEqual([nextRelated])
    expect(getDjRadioPrograms).toHaveBeenLastCalledWith({ rid: 802 })
  })

  it('skips more programs when the radio id is missing', async () => {
    vi.mocked(getDjProgramDetail).mockResolvedValue({ ...detail, radioId: 0 })
    const store = useDjStore()

    await store.load(901)
    await settle()

    expect(getDjRadioPrograms).not.toHaveBeenCalled()
    expect(store.relatedPrograms).toEqual([])
  })

  it('does not drop in-flight more programs when loading more radio programs', async () => {
    const first = deferred<{ more: boolean; programs: typeof relatedProgram[] }>()
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms)
      .mockResolvedValueOnce({ more: true, programs: [program] })
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({
        more: false,
        programs: [{ ...program, id: 903, name: '下一期' }],
      })
    const store = useDjStore()

    await store.loadRadio(801)
    await store.load(901)
    await store.loadMoreRadioPrograms()
    first.resolve({
      more: false,
      programs: [
        { ...program, id: 901, name: '自己' },
        { ...program, id: 0, name: '无效' },
        relatedProgram,
      ],
    })
    await settle()

    expect(store.relatedPrograms).toEqual([relatedProgram])
    expect(store.radioPrograms.map((item) => item.id)).toEqual([901, 903])
  })

  it('loads comments with the program and ignores a comment failure', async () => {
    const comment = {
      commentId: 1,
      content: '走过林间。',
      nickname: '林间电台',
    }
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjCommentPage).mockResolvedValue({ comments: [comment], more: true })
    const store = useDjStore()

    await store.load(901)
    await settle()
    await store.load(901)

    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(true)
    expect(store.commentOffset).toBe(COMMENT_LIMIT)
    expect(getDjProgramDetail).toHaveBeenCalledTimes(1)
    expect(getDjCommentPage).toHaveBeenCalledTimes(1)
    expect(getDjCommentPage).toHaveBeenCalledWith(901, 0)
  })

  it('keeps the program when comments fail', async () => {
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjCommentPage).mockRejectedValue(new Error('comments offline'))
    const store = useDjStore()

    await store.load(901)
    await settle()

    expect(store.program).toEqual(detail)
    expect(store.comments).toBeNull()
    expect(store.error).toBeNull()
  })

  it('retries comments on a cached program when the first comment request failed', async () => {
    const comment = {
      commentId: 1,
      content: '走过林间。',
      nickname: '林间电台',
    }
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjCommentPage)
      .mockRejectedValueOnce(new Error('comments offline'))
      .mockResolvedValueOnce({ comments: [comment], more: false })
    const store = useDjStore()

    await store.load(901)
    await settle()
    expect(store.comments).toBeNull()

    await store.load(901)
    await settle()

    expect(getDjProgramDetail).toHaveBeenCalledTimes(1)
    expect(getDjCommentPage).toHaveBeenCalledTimes(2)
    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(false)
  })

  it('does not keep stale comments after the program id changes', async () => {
    const first = deferred<{
      comments: { commentId: number; content: string; nickname: string }[]
      more: boolean
    }>()
    const nextDetail = { ...detail, id: 902, name: '潮汐夜话', radioId: 802 }
    const nextComment = {
      commentId: 9,
      content: '下一期留言',
      nickname: '海岸信号',
    }
    vi.mocked(getDjProgramDetail)
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce(nextDetail)
    vi.mocked(getDjCommentPage)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = useDjStore()

    await store.load(901)
    await store.load(902)
    await settle()
    first.resolve({
      comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
      more: true,
    })
    await settle()

    expect(store.program?.id).toBe(902)
    expect(store.comments).toEqual([nextComment])
    expect(store.commentsMore).toBe(false)
    expect(getDjCommentPage).toHaveBeenLastCalledWith(902, 0)
  })

  it('clears comments immediately when the program id changes', async () => {
    const comment = {
      commentId: 1,
      content: '走过林间。',
      nickname: '林间电台',
    }
    const nextComment = {
      commentId: 9,
      content: '下一期留言',
      nickname: '海岸信号',
    }
    vi.mocked(getDjProgramDetail)
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce({ ...detail, id: 902, name: '潮汐夜话' })
    vi.mocked(getDjCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: false })
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = useDjStore()

    await store.load(901)
    await settle()
    expect(store.comments).toEqual([comment])

    const pending = store.load(902)
    expect(store.comments).toBeNull()
    await pending
    await settle()
    expect(store.comments).toEqual([nextComment])
  })

  it('treats an empty comment list as loaded and does not retry', async () => {
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjCommentPage).mockResolvedValue({ comments: [], more: false })
    const store = useDjStore()

    await store.load(901)
    await settle()
    await store.load(901)

    expect(store.comments).toEqual([])
    expect(getDjCommentPage).toHaveBeenCalledTimes(1)
  })

  it('appends more comments without dropping the first page', async () => {
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjCommentPage)
      .mockResolvedValueOnce({ comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }], more: true })
      .mockResolvedValueOnce({ comments: [extra, { commentId: 1, content: '走过林间。', nickname: '林间电台' }], more: false })
    const store = useDjStore()
    await store.load(901)
    await settle()
    await store.loadMoreComments()
    await settle()

    expect(getDjCommentPage).toHaveBeenNthCalledWith(1, 901, 0)
    expect(getDjCommentPage).toHaveBeenNthCalledWith(2, 901, COMMENT_LIMIT)
    expect(store.comments).toEqual([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
      extra,
    ])
    expect(store.commentsMore).toBe(false)
    expect(store.commentOffset).toBe(COMMENT_LIMIT * 2)
  })

  it('keeps loaded comments when load more fails', async () => {
    const comment = { commentId: 1, content: '走过林间。', nickname: '林间电台' }
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockRejectedValueOnce(new Error('more offline'))
    const store = useDjStore()
    await store.load(901)
    await settle()
    await expect(store.loadMoreComments()).rejects.toThrow('more offline')

    expect(store.comments).toEqual([comment])
    expect(store.commentsMore).toBe(true)
    expect(store.commentsMoreError).toBe('more offline')
    expect(store.commentsMoreLoading).toBe(false)
  })

  it('does not request another page when more is false', async () => {
    const comment = { commentId: 1, content: '走过林间。', nickname: '林间电台' }
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjCommentPage).mockResolvedValue({ comments: [comment], more: false })
    const store = useDjStore()
    await store.load(901)
    await settle()
    await store.loadMoreComments()

    expect(getDjCommentPage).toHaveBeenCalledTimes(1)
  })

  it('does not let a late first page overwrite appended comments', async () => {
    const firstA = deferred<{
      comments: { commentId: number; content: string; nickname: string }[]
      more: boolean
    }>()
    const firstB = deferred<{
      comments: { commentId: number; content: string; nickname: string }[]
      more: boolean
    }>()
    const comment = { commentId: 1, content: '走过林间。', nickname: '林间电台' }
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjCommentPage)
      .mockReturnValueOnce(firstA.promise)
      .mockReturnValueOnce(firstB.promise)
      .mockResolvedValueOnce({ comments: [extra], more: false })
    const store = useDjStore()
    await store.load(901)
    await store.load(901)
    firstA.resolve({ comments: [comment], more: true })
    await settle()
    await store.loadMoreComments()
    firstB.resolve({ comments: [comment], more: true })
    await settle()

    expect(store.comments).toEqual([comment, extra])
    expect(store.commentsMore).toBe(false)
    expect(getDjCommentPage).toHaveBeenCalledTimes(3)
  })

  it('drops in-flight more comments after the program id changes', async () => {
    const pending = deferred<{ comments: { commentId: number; content: string; nickname: string }[]; more: boolean }>()
    const extra = { commentId: 21, content: '第二页', nickname: '夜航乐队' }
    const comment = { commentId: 1, content: '走过林间。', nickname: '林间电台' }
    const nextComment = { commentId: 9, content: '下一期留言', nickname: '海岸信号' }
    vi.mocked(getDjProgramDetail)
      .mockResolvedValueOnce(detail)
      .mockResolvedValueOnce({ ...detail, id: 902, name: '潮汐夜话' })
    vi.mocked(getDjCommentPage)
      .mockResolvedValueOnce({ comments: [comment], more: true })
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({ comments: [nextComment], more: false })
    const store = useDjStore()
    await store.load(901)
    await settle()
    const more = store.loadMoreComments()
    await store.load(902)
    pending.resolve({ comments: [extra], more: false })
    await more
    await settle()

    expect(store.program?.id).toBe(902)
    expect(store.comments).toEqual([nextComment])
    expect(store.commentsMore).toBe(false)
  })

  it('loads radio comments with the detail and ignores a comment failure', async () => {
    const comment = {
      commentId: 1,
      content: '走过林间。',
      nickname: '林间电台',
    }
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getDjRadioComments).mockResolvedValue([comment])
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()
    await store.loadRadio(801)

    expect(store.radioComments).toEqual([comment])
    expect(getDjRadioDetail).toHaveBeenCalledTimes(1)
    expect(getDjRadioComments).toHaveBeenCalledTimes(1)
    expect(getDjRadioComments).toHaveBeenCalledWith(801)
  })

  it('keeps the radio and programs when radio comments fail', async () => {
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getDjRadioComments).mockRejectedValue(new Error('comments offline'))
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()

    expect(store.radio).toEqual(radioDetail)
    expect(store.radioPrograms).toEqual([program])
    expect(store.radioComments).toBeNull()
    expect(store.radioError).toBeNull()
  })

  it('retries radio comments on a cached radio when the first comment request failed', async () => {
    const comment = {
      commentId: 1,
      content: '走过林间。',
      nickname: '林间电台',
    }
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getDjRadioComments)
      .mockRejectedValueOnce(new Error('comments offline'))
      .mockResolvedValueOnce([comment])
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()
    expect(store.radioComments).toBeNull()

    await store.loadRadio(801)
    await settle()

    expect(getDjRadioDetail).toHaveBeenCalledTimes(1)
    expect(getDjRadioComments).toHaveBeenCalledTimes(2)
    expect(store.radioComments).toEqual([comment])
  })

  it('does not keep stale radio comments after the radio id changes', async () => {
    const first = deferred<
      { commentId: number; content: string; nickname: string }[]
    >()
    const nextRadio = { ...radioDetail, id: 802, name: '潮汐电台' }
    const nextComment = {
      commentId: 9,
      content: '下一台留言',
      nickname: '海岸信号',
    }
    vi.mocked(getDjRadioDetail)
      .mockResolvedValueOnce(radioDetail)
      .mockResolvedValueOnce(nextRadio)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getDjRadioComments)
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce([nextComment])
    const store = useDjStore()

    await store.loadRadio(801)
    await store.loadRadio(802)
    await settle()
    first.resolve([
      { commentId: 1, content: '走过林间。', nickname: '林间电台' },
    ])
    await settle()

    expect(store.radio?.id).toBe(802)
    expect(store.radioComments).toEqual([nextComment])
    expect(getDjRadioComments).toHaveBeenLastCalledWith(802)
  })

  it('clears radio comments immediately when the radio id changes', async () => {
    const comment = {
      commentId: 1,
      content: '走过林间。',
      nickname: '林间电台',
    }
    const nextComment = {
      commentId: 9,
      content: '下一台留言',
      nickname: '海岸信号',
    }
    vi.mocked(getDjRadioDetail)
      .mockResolvedValueOnce(radioDetail)
      .mockResolvedValueOnce({ ...radioDetail, id: 802, name: '潮汐电台' })
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getDjRadioComments)
      .mockResolvedValueOnce([comment])
      .mockResolvedValueOnce([nextComment])
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()
    expect(store.radioComments).toEqual([comment])

    const pending = store.loadRadio(802)
    expect(store.radioComments).toBeNull()
    await pending
    await settle()
    expect(store.radioComments).toEqual([nextComment])
  })

  it('treats an empty radio comment list as loaded and does not retry', async () => {
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [program] })
    vi.mocked(getDjRadioComments).mockResolvedValue([])
    const store = useDjStore()

    await store.loadRadio(801)
    await settle()
    await store.loadRadio(801)

    expect(store.radioComments).toEqual([])
    expect(getDjRadioComments).toHaveBeenCalledTimes(1)
  })

  it('does not drop in-flight radio comments when loading more programs', async () => {
    const first = deferred<
      { commentId: number; content: string; nickname: string }[]
    >()
    const comment = {
      commentId: 1,
      content: '走过林间。',
      nickname: '林间电台',
    }
    vi.mocked(getDjRadioDetail).mockResolvedValue(radioDetail)
    vi.mocked(getDjRadioPrograms)
      .mockResolvedValueOnce({ more: true, programs: [program] })
      .mockResolvedValueOnce({
        more: false,
        programs: [{ ...program, id: 902, name: '下一期' }],
      })
    vi.mocked(getDjRadioComments).mockReturnValueOnce(first.promise)
    const store = useDjStore()

    await store.loadRadio(801)
    await store.loadMoreRadioPrograms()
    first.resolve([comment])
    await settle()

    expect(store.radioComments).toEqual([comment])
    expect(store.radioPrograms.map((item) => item.id)).toEqual([901, 902])
  })
})
