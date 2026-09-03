// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSearchHotDetail, getSearchSuggest } from '@/api/search'
import HeaderSearchPop from '@/components/layout/HeaderSearchPop.vue'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'

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
  name: '晚风来信.<img src=x>',
}

const suggest = {
  albums: [{ id: 501, name: '夜航', picUrl: 'https://images.example.com/a.jpg' }],
  artists: [
    { id: 401, img1v1Url: 'https://images.example.com/a.jpg', name: '林间电台' },
  ],
  playlists: [
    { coverImgUrl: 'https://images.example.com/p.jpg', id: 101, name: '深夜民谣' },
  ],
  songs: [song],
}

async function mountPop() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.discover })
  const wrapper = mount(HeaderSearchPop, {
    attachTo: document.body,
    global: {
      plugins: [pinia, router],
      stubs: {
        RouterLink: defineComponent({
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        }),
      },
    },
  })
  return { router, wrapper }
}

describe('HeaderSearchPop', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockClear()
    vi.mocked(getSearchHotDetail).mockReset()
    vi.mocked(getSearchSuggest).mockReset()
    vi.mocked(getSearchHotDetail).mockResolvedValue([hot])
    vi.mocked(getSearchSuggest).mockResolvedValue(suggest)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens hot words on focus and searches from a typed keyword', async () => {
    const { wrapper } = await mountPop()
    const input = wrapper.get('[data-testid="header-search-input"]')
    await input.trigger('focus')
    await flushPromises()
    expect(wrapper.get('[data-testid="header-search-pop"]').text()).toContain(
      '深夜民谣',
    )
    expect(getSearchHotDetail).toHaveBeenCalledTimes(1)

    await input.setValue('夜航')
    await input.trigger('input')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    const panel = wrapper.get('[data-testid="header-search-pop"]')
    expect(getSearchSuggest).toHaveBeenCalledWith('夜航')
    expect(panel.text()).toContain('晚风来信.<img src=x>')
    expect(panel.find('img[src="x"]').exists()).toBe(false)
    expect(panel.text()).toContain('夜航')
    wrapper.unmount()
  })

  it('plays a suggested song and closes', async () => {
    const { wrapper } = await mountPop()
    const input = wrapper.get('[data-testid="header-search-input"]')
    await input.trigger('focus')
    await input.setValue('夜航')
    await input.trigger('input')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    await wrapper.get('[data-testid="header-search-play"]').trigger('click')
    await flushPromises()
    expect(playSong).toHaveBeenCalledWith(song)
    expect(wrapper.find('[data-testid="header-search-pop"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes from escape', async () => {
    const { wrapper } = await mountPop()
    await wrapper.get('[data-testid="header-search-input"]').trigger('focus')
    await flushPromises()
    expect(wrapper.find('[data-testid="header-search-pop"]').exists()).toBe(true)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="header-search-pop"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not search before the debounce and opens again on input', async () => {
    const { wrapper } = await mountPop()
    const input = wrapper.get('[data-testid="header-search-input"]')
    await input.trigger('focus')
    await flushPromises()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    await input.setValue('夜航')
    await input.trigger('input')
    await vi.advanceTimersByTimeAsync(399)
    await flushPromises()
    expect(getSearchSuggest).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="header-search-pop"]').exists()).toBe(true)
    await vi.advanceTimersByTimeAsync(1)
    await flushPromises()
    expect(getSearchSuggest).toHaveBeenCalledWith('夜航')
    wrapper.unmount()
  })

  it('links a suggested song mv without playing and closes', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue({
      ...suggest,
      songs: [{ ...song, mv: 701 }],
    })
    const { wrapper } = await mountPop()
    const input = wrapper.get('[data-testid="header-search-input"]')
    await input.trigger('focus')
    await input.setValue('夜航')
    await input.trigger('input')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()

    const mv = wrapper.get('[data-testid="song-mv"]')
    expect(mv.text()).toBe('MV')
    expect(mv.attributes('aria-label')).toBe('打开 MV：晚风来信.<img src=x>')
    expect(mv.attributes('data-to')).toBe(
      JSON.stringify({ name: Pages.mvDetail, query: { id: 701 } }),
    )
    await mv.trigger('click')
    await flushPromises()
    expect(playSong).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="header-search-pop"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('hides the MV link when the suggested song has no mv', async () => {
    const { wrapper } = await mountPop()
    const input = wrapper.get('[data-testid="header-search-input"]')
    await input.trigger('focus')
    await input.setValue('夜航')
    await input.trigger('input')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    expect(wrapper.find('[data-testid="song-mv"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('links suggested song artists without playing and closes', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue({
      ...suggest,
      songs: [
        {
          ...song,
          artists: [
            { id: 401, name: '林间电台' },
            { id: 402, name: '海岸信号' },
          ],
        },
      ],
    })
    const { wrapper } = await mountPop()
    const input = wrapper.get('[data-testid="header-search-input"]')
    await input.trigger('focus')
    await input.setValue('夜航')
    await input.trigger('input')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()

    const artists = wrapper.findAll('[data-testid="song-artist"]')
    expect(artists).toHaveLength(2)
    expect(artists[0]?.text()).toBe('林间电台')
    expect(artists[0]?.attributes('aria-label')).toBe('打开歌手：林间电台')
    expect(
      wrapper.get('[data-testid="header-search-play"]').find('[data-testid="song-artist"]').exists(),
    ).toBe(false)
    expect(artists[0]?.attributes('data-to')).toBe(
      JSON.stringify({ name: Pages.artistDetail, query: { id: 401 } }),
    )
    expect(artists[1]?.attributes('data-to')).toBe(
      JSON.stringify({ name: Pages.artistDetail, query: { id: 402 } }),
    )
    await artists[0]?.trigger('click')
    await flushPromises()
    expect(playSong).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="header-search-pop"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows artist names as text when artist id is missing', async () => {
    vi.mocked(getSearchSuggest).mockResolvedValue({
      ...suggest,
      songs: [{ ...song, artists: [{ id: 0, name: '未入驻歌手' }] }],
    })
    const { wrapper } = await mountPop()
    const input = wrapper.get('[data-testid="header-search-input"]')
    await input.trigger('focus')
    await input.setValue('夜航')
    await input.trigger('input')
    await vi.advanceTimersByTimeAsync(400)
    await flushPromises()
    expect(wrapper.find('[data-testid="song-artist"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="header-search-pop"]').text()).toContain('未入驻歌手')
    wrapper.unmount()
  })
})
