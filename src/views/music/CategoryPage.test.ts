// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CATEGORY_PAGE_SIZE,
  getHighqualityPlaylists,
  getHighqualityTags,
  getHotPlaylists,
  getHotPlaylistTags,
  getNewPlaylists,
  getPlaylistCatlist,
} from '@/api/category'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import CategoryPage from '@/views/music/CategoryPage.vue'

vi.mock('@/api/category', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/category')>()
  return {
    ...actual,
    getHighqualityPlaylists: vi.fn(),
    getHighqualityTags: vi.fn(),
    getHotPlaylists: vi.fn(),
    getHotPlaylistTags: vi.fn(),
    getNewPlaylists: vi.fn(),
    getPlaylistCatlist: vi.fn(),
  }
})

const CategoryViewStub = defineComponent({
  name: 'CategoryView',
  props: ['cat', 'error', 'loading', 'more', 'playlists', 'sort', 'tags'],
  emits: ['load-more', 'retry', 'select-cat', 'select-sort'],
  template: `
    <section>
      <span data-testid="cat-count">{{ playlists.length }}</span>
      <span v-if="error" data-testid="cat-error">{{ error }}</span>
      <button data-testid="page-retry" @click="$emit('retry')">retry</button>
      <button data-testid="page-cat" @click="$emit('select-cat', '华语')">cat</button>
      <button data-testid="page-more" @click="$emit('load-more')">more</button>
      <button data-testid="page-sort-hot" @click="$emit('select-sort', 'hot')">hot</button>
    </section>
  `,
})

describe('CategoryPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getHighqualityTags).mockReset()
    vi.mocked(getHighqualityPlaylists).mockReset()
    vi.mocked(getHighqualityTags).mockResolvedValue([{ id: 1, name: '华语' }])
    vi.mocked(getPlaylistCatlist).mockReset()
    vi.mocked(getHotPlaylistTags).mockReset()
    vi.mocked(getHotPlaylists).mockReset()
    vi.mocked(getNewPlaylists).mockReset()
    vi.mocked(getPlaylistCatlist).mockResolvedValue([])
    vi.mocked(getHotPlaylistTags).mockResolvedValue([])
    vi.mocked(getHotPlaylists).mockResolvedValue({
      lasttime: 0,
      more: false,
      playlists: [],
    })
    vi.mocked(getNewPlaylists).mockResolvedValue({
      lasttime: 0,
      more: false,
      playlists: [],
    })
    vi.mocked(getHighqualityPlaylists).mockResolvedValue({
      lasttime: 1,
      more: false,
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/cat.jpg',
          creator: { nickname: '林间电台' },
          id: 501,
          name: '深夜民谣',
          playCount: 1,
        },
      ],
    })
  })

  it('loads tags and playlists, retries and changes category', async () => {
    vi.mocked(getHighqualityPlaylists)
      .mockRejectedValueOnce(new Error('category offline'))
      .mockResolvedValueOnce({
        lasttime: 1,
        more: false,
        playlists: [
          {
            coverImgUrl: 'https://images.example.com/cat.jpg',
            creator: { nickname: '林间电台' },
            id: 501,
            name: '深夜民谣',
            playCount: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        lasttime: 2,
        more: false,
        playlists: [
          {
            coverImgUrl: 'https://images.example.com/cat.jpg',
            creator: { nickname: '电台' },
            id: 502,
            name: '华语精选',
            playCount: 2,
          },
        ],
      })

    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.category })
    const wrapper = mount(CategoryPage, {
      global: {
        plugins: [pinia, router],
        stubs: { CategoryView: CategoryViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="cat-error"]').text()).toBe(
      'category offline',
    )

    await wrapper.get('[data-testid="page-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="cat-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-cat"]').trigger('click')
    await flushPromises()
    expect(getHighqualityPlaylists).toHaveBeenLastCalledWith({
      before: 0,
      cat: '华语',
      limit: CATEGORY_PAGE_SIZE,
    })
  })

  it('keeps select-cat and load-more failures inside the page', async () => {
    vi.mocked(getHighqualityPlaylists)
      .mockResolvedValueOnce({
        lasttime: 1,
        more: true,
        playlists: [
          {
            coverImgUrl: 'https://images.example.com/cat.jpg',
            creator: { nickname: '林间电台' },
            id: 501,
            name: '深夜民谣',
            playCount: 1,
          },
        ],
      })
      .mockRejectedValueOnce(new Error('more failed'))
      .mockRejectedValueOnce(new Error('cat failed'))

    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.category })
    const wrapper = mount(CategoryPage, {
      global: {
        plugins: [pinia, router],
        stubs: { CategoryView: CategoryViewStub },
      },
    })
    await flushPromises()

    await wrapper.get('[data-testid="page-more"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="cat-error"]').text()).toBe('more failed')
    expect(wrapper.get('[data-testid="cat-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-cat"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="cat-error"]').text()).toBe('cat failed')
    expect(wrapper.get('[data-testid="cat-count"]').text()).toBe('0')
  })

  it('loads playlists for the cat query', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.category, query: { cat: '独立' } })
    mount(CategoryPage, {
      global: {
        plugins: [pinia, router],
        stubs: { CategoryView: CategoryViewStub },
      },
    })
    await flushPromises()

    expect(getHighqualityPlaylists).toHaveBeenCalledWith({
      before: 0,
      cat: '独立',
      limit: CATEGORY_PAGE_SIZE,
    })
  })

  it('loads hot net playlists from the sort query and keeps the cat', async () => {
    vi.mocked(getHotPlaylists).mockResolvedValue({
      lasttime: 0,
      more: false,
      playlists: [
        {
          coverImgUrl: 'https://images.example.com/cat.jpg',
          creator: { nickname: '林间电台' },
          id: 601,
          name: '热门民谣',
          playCount: 9,
        },
      ],
    })
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.category, query: { cat: '华语', sort: 'hot' } })
    const wrapper = mount(CategoryPage, {
      global: {
        plugins: [pinia, router],
        stubs: { CategoryView: CategoryViewStub },
      },
    })
    await flushPromises()
    expect(getHotPlaylists).toHaveBeenCalledWith({
      cat: '华语',
      limit: CATEGORY_PAGE_SIZE,
      offset: 0,
    })
    expect(getHighqualityPlaylists).not.toHaveBeenCalled()
    expect(wrapper.get('[data-testid="cat-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-sort-hot"]').trigger('click')
    await flushPromises()
    expect(getHotPlaylists).toHaveBeenCalledTimes(1)
  })
})
