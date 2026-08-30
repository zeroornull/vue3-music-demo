// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ARTIST_LIST_PAGE_SIZE, getArtistList } from '@/api/artist'
import ArtistHallPage from '@/views/music/ArtistHallPage.vue'

vi.mock('@/api/artist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/artist')>()
  return {
    ...actual,
    getArtistList: vi.fn(),
  }
})

const HallViewStub = defineComponent({
  name: 'ArtistHallView',
  props: ['area', 'artists', 'error', 'initial', 'loading', 'more', 'type'],
  emits: ['load-more', 'retry', 'select-area', 'select-initial', 'select-type'],
  template: `
    <section>
      <span data-testid="hall-count">{{ artists.length }}</span>
      <span v-if="error" data-testid="hall-error">{{ error }}</span>
      <button data-testid="page-retry" @click="$emit('retry')">retry</button>
      <button data-testid="page-area" @click="$emit('select-area', 7)">area</button>
      <button data-testid="page-type" @click="$emit('select-type', 1)">type</button>
      <button data-testid="page-initial" @click="$emit('select-initial', 'a')">initial</button>
      <button data-testid="page-more" @click="$emit('load-more')">more</button>
    </section>
  `,
})

describe('ArtistHallPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getArtistList).mockReset()
    vi.mocked(getArtistList).mockResolvedValue({
      more: false,
      artists: [
        {
          id: 401,
          img1v1Url: 'https://images.example.com/a.jpg',
          name: '林间电台',
        },
      ],
    })
  })

  it('loads artists, retries and changes area', async () => {
    vi.mocked(getArtistList)
      .mockRejectedValueOnce(new Error('hall offline'))
      .mockResolvedValueOnce({
        more: false,
        artists: [
          {
            id: 401,
            img1v1Url: 'https://images.example.com/a.jpg',
            name: '林间电台',
          },
        ],
      })
      .mockResolvedValueOnce({
        more: false,
        artists: [
          {
            id: 403,
            img1v1Url: 'https://images.example.com/h.jpg',
            name: '华语歌手',
          },
        ],
      })
      .mockResolvedValueOnce({
        more: false,
        artists: [
          {
            id: 404,
            img1v1Url: 'https://images.example.com/m.jpg',
            name: '男歌手',
          },
        ],
      })
      .mockResolvedValueOnce({
        more: false,
        artists: [
          {
            id: 405,
            img1v1Url: 'https://images.example.com/a.jpg',
            name: 'A 组',
          },
        ],
      })

    const wrapper = mount(ArtistHallPage, {
      global: { stubs: { ArtistHallView: HallViewStub } },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="hall-error"]').text()).toBe('hall offline')

    await wrapper.get('[data-testid="page-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="hall-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-area"]').trigger('click')
    await flushPromises()
    expect(getArtistList).toHaveBeenLastCalledWith({
      area: 7,
      initial: '-1',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 0,
      type: -1,
    })

    await wrapper.get('[data-testid="page-type"]').trigger('click')
    await flushPromises()
    expect(getArtistList).toHaveBeenLastCalledWith({
      area: 7,
      initial: '-1',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 0,
      type: 1,
    })

    await wrapper.get('[data-testid="page-initial"]').trigger('click')
    await flushPromises()
    expect(getArtistList).toHaveBeenLastCalledWith({
      area: 7,
      initial: 'a',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 0,
      type: 1,
    })
  })

  it('keeps setArea and load-more failures inside the page', async () => {
    vi.mocked(getArtistList)
      .mockResolvedValueOnce({
        more: true,
        artists: [
          {
            id: 401,
            img1v1Url: 'https://images.example.com/a.jpg',
            name: '林间电台',
          },
        ],
      })
      .mockRejectedValueOnce(new Error('more failed'))
      .mockRejectedValueOnce(new Error('area failed'))
      .mockRejectedValueOnce(new Error('type failed'))

    const wrapper = mount(ArtistHallPage, {
      global: { stubs: { ArtistHallView: HallViewStub } },
    })
    await flushPromises()

    await wrapper.get('[data-testid="page-more"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="hall-error"]').text()).toBe('more failed')
    expect(wrapper.get('[data-testid="hall-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-area"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="hall-error"]').text()).toBe('area failed')
    expect(wrapper.get('[data-testid="hall-count"]').text()).toBe('0')

    await wrapper.get('[data-testid="page-type"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="hall-error"]').text()).toBe('type failed')
  })
})
