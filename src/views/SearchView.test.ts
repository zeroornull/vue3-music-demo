// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSearchHotDetail, getSearchSuggest } from '@/api/search'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import SearchView from '@/views/SearchView.vue'

vi.mock('@/api/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search')>()
  return {
    ...actual,
    getSearchHotDetail: vi.fn(),
    getSearchSuggest: vi.fn(),
  }
})

const playSong = vi.fn().mockResolvedValue(true)
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({
    current: null,
    error: null,
    play: playSong,
  }),
}))

const hot = {
  content: '深夜写歌',
  score: 98000,
  searchWord: '深夜民谣',
}

const song = {
  artists: [{ id: 401, name: '林间电台' }],
  duration: 180_000,
  id: 301,
  name: '晚风来信',
}

const suggest = {
  artists: [
    {
      id: 401,
      img1v1Url: 'https://images.example.com/a.jpg',
      name: '林间电台',
    },
  ],
  playlists: [
    {
      coverImgUrl: 'https://images.example.com/p.jpg',
      id: 101,
      name: '深夜民谣',
    },
  ],
  songs: [song],
}

const SongListStub = defineComponent({
  name: 'PlaylistSongList',
  props: ['currentId', 'emptyDescription', 'paginate', 'songs'],
  emits: ['play'],
  template: `
    <section>
      <button
        v-if="songs[0]"
        data-testid="play-song"
        @click="$emit('play', songs[0])"
      >
        play
      </button>
    </section>
  `,
})

async function mountView(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.search, query })
  const wrapper = mount(SearchView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        PlaylistSongList: SongListStub,
      },
    },
  })
  return { router, wrapper }
}

describe('SearchView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockClear()
    vi.mocked(getSearchHotDetail).mockReset()
    vi.mocked(getSearchSuggest).mockReset()
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
  })

  it('loads hot search and searches from a hot word or the form', async () => {
    const { router, wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('h2').text()).toBe('热门搜索')
    expect(wrapper.find('nav[aria-label="页面导航"]').exists()).toBe(false)
    expect(getSearchSuggest).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="search-hot-word"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('深夜民谣')
    expect(getSearchSuggest).toHaveBeenCalledWith('深夜民谣')

    await wrapper.get('#search-keyword').setValue('晚风')
    await wrapper.get('[data-testid="search-submit"]').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('晚风')
    expect(getSearchSuggest).toHaveBeenLastCalledWith('晚风')
    expect(wrapper.get('[data-testid="search-playlists"]').text()).toContain(
      '深夜民谣',
    )
    expect(
      wrapper.get('[aria-label="打开歌单：深夜民谣"]').attributes('href'),
    ).toContain('playlist')
    expect(wrapper.get('[data-testid="search-artists"]').text()).toContain(
      '林间电台',
    )
    expect(
      wrapper.get('[aria-label="打开歌手：林间电台"]').attributes('href'),
    ).toContain('artistDetail')
    expect(wrapper.find('[aria-label^="打开专辑"]').exists()).toBe(false)
  })

  it('retries a failed song search and plays a result', async () => {
    vi.mocked(getSearchSuggest)
      .mockRejectedValueOnce(new Error('search offline'))
      .mockResolvedValueOnce(suggest)

    const { wrapper } = await mountView({ q: '深夜' })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('search offline')

    await wrapper.get('[data-testid="search-retry"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="play-song"]').trigger('click')
    await flushPromises()
    expect(playSong).toHaveBeenCalledWith(song)
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放“晚风来信”。')
  })

  it('shows an empty card when suggest has no songs, playlists or artists', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue({
      artists: [],
      playlists: [],
      songs: [],
    })
    const { wrapper } = await mountView({ q: '无结果' })
    await flushPromises()
    expect(wrapper.get('[data-testid="search-empty"]').text()).toContain(
      '没有找到结果',
    )
  })
})
