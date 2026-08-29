// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSearchHotDetail, getSearchSuggestSongs } from '@/api/search'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import SearchView from '@/views/SearchView.vue'

vi.mock('@/api/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/search')>()
  return {
    ...actual,
    getSearchHotDetail: vi.fn(),
    getSearchSuggestSongs: vi.fn(),
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
        RouterLink: defineComponent({ template: '<a><slot /></a>' }),
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
    vi.mocked(getSearchSuggestSongs).mockReset()
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    vi.mocked(getSearchSuggestSongs).mockResolvedValue([song])
  })

  it('loads hot search and searches from a hot word or the form', async () => {
    const { router, wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('h2').text()).toBe('热门搜索')
    expect(getSearchSuggestSongs).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="search-hot-word"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('深夜民谣')
    expect(getSearchSuggestSongs).toHaveBeenCalledWith('深夜民谣')

    await wrapper.get('#search-keyword').setValue('晚风')
    await wrapper.get('[data-testid="search-submit"]').trigger('submit')
    await flushPromises()
    expect(router.currentRoute.value.query.q).toBe('晚风')
    expect(getSearchSuggestSongs).toHaveBeenLastCalledWith('晚风')
  })

  it('retries a failed song search and plays a result', async () => {
    vi.mocked(getSearchSuggestSongs)
      .mockRejectedValueOnce(new Error('search offline'))
      .mockResolvedValueOnce([song])

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
})
