// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CATEGORY_PAGE_SIZE,
  getHighqualityPlaylists,
  getHighqualityTags,
} from '@/api/category'
import CategoryPage from '@/views/music/CategoryPage.vue'

vi.mock('@/api/category', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/category')>()
  return {
    ...actual,
    getHighqualityPlaylists: vi.fn(),
    getHighqualityTags: vi.fn(),
  }
})

const CategoryViewStub = defineComponent({
  name: 'CategoryView',
  props: ['cat', 'error', 'loading', 'more', 'playlists', 'tags'],
  emits: ['load-more', 'retry', 'select-cat'],
  template: `
    <section>
      <span data-testid="cat-count">{{ playlists.length }}</span>
      <span v-if="error" data-testid="cat-error">{{ error }}</span>
      <button data-testid="page-retry" @click="$emit('retry')">retry</button>
      <button data-testid="page-cat" @click="$emit('select-cat', '华语')">cat</button>
      <button data-testid="page-more" @click="$emit('load-more')">more</button>
    </section>
  `,
})

describe('CategoryPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getHighqualityTags).mockReset()
    vi.mocked(getHighqualityPlaylists).mockReset()
    vi.mocked(getHighqualityTags).mockResolvedValue([{ id: 1, name: '华语' }])
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

    const wrapper = mount(CategoryPage, {
      global: { stubs: { CategoryView: CategoryViewStub } },
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

    const wrapper = mount(CategoryPage, {
      global: { stubs: { CategoryView: CategoryViewStub } },
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
})
