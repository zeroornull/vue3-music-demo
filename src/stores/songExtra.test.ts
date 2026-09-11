import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getSheetPreview,
  getSongMlogs,
  getSongSheets,
  getSongWiki,
} from '@/api/songExtra'
import { useSongExtraStore } from '@/stores/songExtra'

vi.mock('@/api/songExtra', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/songExtra')>()
  return {
    ...actual,
    getSheetPreview: vi.fn(),
    getSongMlogs: vi.fn(),
    getSongSheets: vi.fn(),
    getSongWiki: vi.fn(),
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const wiki = { text: '林间夜谈。', title: '歌曲简介' }
const sheet = { coverUrl: '', id: 21, name: '夜航谱', userName: '林间电台' }
const preview = { id: 21, imageUrl: 'https://images.example.com/p.jpg', text: '简谱' }
const mlog = { coverUrl: '', id: 'ml-9', name: '林间现场', videoId: 'VID001' }

describe('song extra store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSongWiki).mockReset()
    vi.mocked(getSongSheets).mockReset()
    vi.mocked(getSheetPreview).mockReset()
    vi.mocked(getSongMlogs).mockReset()
  })

  it('loads wiki, sheets, first preview and mlogs for a song', async () => {
    vi.mocked(getSongWiki).mockResolvedValue([wiki])
    vi.mocked(getSongSheets).mockResolvedValue([sheet])
    vi.mocked(getSheetPreview).mockResolvedValue(preview)
    vi.mocked(getSongMlogs).mockResolvedValue([mlog])
    const store = useSongExtraStore()
    await store.load(301)
    await store.load(301)

    expect(store.songId).toBe(301)
    expect(store.wiki).toEqual([wiki])
    expect(store.sheets).toEqual([sheet])
    expect(store.sheetId).toBe(21)
    expect(store.preview).toEqual(preview)
    expect(store.mlogs).toEqual([mlog])
    expect(getSongWiki).toHaveBeenCalledTimes(1)
    expect(getSongSheets).toHaveBeenCalledTimes(1)
    expect(getSheetPreview).toHaveBeenCalledTimes(1)
    expect(getSongMlogs).toHaveBeenCalledTimes(1)
  })

  it('keeps sheets when wiki fails and loads preview without waiting on wiki', async () => {
    const pending = deferred<typeof wiki[]>()
    vi.mocked(getSongWiki).mockReturnValueOnce(pending.promise)
    vi.mocked(getSongSheets).mockResolvedValue([sheet])
    vi.mocked(getSheetPreview).mockResolvedValue(preview)
    vi.mocked(getSongMlogs).mockResolvedValue([])
    const store = useSongExtraStore()
    const loading = store.load(301)
    await vi.waitFor(() => {
      expect(getSheetPreview).toHaveBeenCalledWith(21)
    })
    expect(store.sheets).toEqual([sheet])
    expect(store.preview).toEqual(preview)
    expect(store.wiki).toEqual([])
    pending.resolve([wiki])
    await loading
    expect(store.wiki).toEqual([wiki])
  })

  it('drops in-flight extras after a song change', async () => {
    const pending = deferred<typeof wiki[]>()
    vi.mocked(getSongWiki)
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce([{ title: '新简介', text: '浩室。' }])
    vi.mocked(getSongSheets).mockResolvedValue([])
    vi.mocked(getSongMlogs).mockResolvedValue([])
    const store = useSongExtraStore()
    const first = store.load(301)
    await Promise.resolve()
    const second = store.load(302)
    pending.resolve([wiki])
    await first
    await second
    expect(store.songId).toBe(302)
    expect(store.wiki).toEqual([{ title: '新简介', text: '浩室。' }])
    expect(getSongWiki).toHaveBeenNthCalledWith(2, 302)
  })

  it('clears stale preview when a later sheet fails', async () => {
    vi.mocked(getSongWiki).mockResolvedValue([])
    vi.mocked(getSongMlogs).mockResolvedValue([])
    vi.mocked(getSongSheets).mockResolvedValue([
      sheet,
      { ...sheet, id: 22, name: '浩室谱' },
    ])
    vi.mocked(getSheetPreview)
      .mockResolvedValueOnce(preview)
      .mockRejectedValueOnce(new Error('preview offline'))
    const store = useSongExtraStore()
    await store.load(301)
    expect(store.preview).toEqual(preview)
    await store.setSheet(22)
    expect(store.sheetId).toBe(22)
    expect(store.preview).toBeNull()
    expect(store.previewError).toBe('preview offline')
  })

  it('auto-previews after a sheet-list retry', async () => {
    vi.mocked(getSongWiki).mockResolvedValue([])
    vi.mocked(getSongMlogs).mockResolvedValue([])
    vi.mocked(getSongSheets)
      .mockRejectedValueOnce(new Error('sheets offline'))
      .mockResolvedValueOnce([sheet])
    vi.mocked(getSheetPreview).mockResolvedValue(preview)
    const store = useSongExtraStore()
    await store.load(301)
    expect(store.sheetsError).toBe('sheets offline')
    expect(store.preview).toBeNull()
    await store.loadSheets(true)
    expect(store.sheets).toEqual([sheet])
    expect(store.preview).toEqual(preview)
  })

  it('drops in-flight extras after reset', async () => {
    const pending = deferred<typeof wiki[]>()
    vi.mocked(getSongWiki).mockReturnValueOnce(pending.promise)
    vi.mocked(getSongSheets).mockResolvedValue([])
    vi.mocked(getSongMlogs).mockResolvedValue([])
    const store = useSongExtraStore()
    const loading = store.load(301)
    store.reset()
    pending.resolve([wiki])
    await loading
    expect(store.wiki).toEqual([])
    expect(store.songId).toBe(0)
  })
})
