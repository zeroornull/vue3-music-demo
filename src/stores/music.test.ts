import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getPersonalizedPlaylists } from '@/api/personalized'
import { getPersonalizedNewSongs } from '@/api/newSong'
import { useMusicStore } from '@/stores/music'

vi.mock('@/api/personalized', () => ({
  getPersonalizedPlaylists: vi.fn(),
}))
vi.mock('@/api/newSong', () => ({
  getPersonalizedNewSongs: vi.fn(),
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

const newSong = {
  alg: 'featured',
  canDislike: false,
  id: 301,
  name: '晚风来信',
  picUrl: 'https://images.example.com/song.jpg',
  song: {
    album: { id: 501, name: '晚风来信', picUrl: 'https://images.example.com/album.jpg' },
    artists: [{ id: 401, name: '林间电台' }],
    id: 301,
    name: '晚风来信',
  },
  type: 4,
}

describe('music store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPersonalizedPlaylists).mockReset()
    vi.mocked(getPersonalizedNewSongs).mockReset()
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

  it('loads and caches personalized new songs independently', async () => {
    vi.mocked(getPersonalizedNewSongs).mockResolvedValue([newSong])
    const store = useMusicStore()

    await store.loadNewSongs()
    await store.loadNewSongs()

    expect(store.newSongs).toEqual([newSong])
    expect(getPersonalizedNewSongs).toHaveBeenCalledTimes(1)
    expect(store.newSongsError).toBeNull()
  })

  it('supports new-song forced refresh and error state', async () => {
    vi.mocked(getPersonalizedNewSongs)
      .mockResolvedValueOnce([newSong])
      .mockRejectedValueOnce(new Error('new-song offline'))
    const store = useMusicStore()

    await store.loadNewSongs()
    await expect(store.loadNewSongs(true)).rejects.toThrow('new-song offline')

    expect(getPersonalizedNewSongs).toHaveBeenCalledTimes(2)
    expect(store.newSongsError).toBe('new-song offline')
    expect(store.newSongsLoading).toBe(false)
  })
})
