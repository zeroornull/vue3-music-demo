// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ARTIST_LIST_PAGE_SIZE, getArtistList } from '@/api/artist'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
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
      <span data-testid="hall-area">{{ area }}</span>
      <span data-testid="hall-type">{{ type }}</span>
      <span data-testid="hall-initial">{{ initial }}</span>
      <span v-if="error" data-testid="hall-error">{{ error }}</span>
      <button data-testid="page-retry" @click="$emit('retry')">retry</button>
      <button data-testid="page-area" @click="$emit('select-area', 7)">area</button>
      <button data-testid="page-area-all" @click="$emit('select-area', -1)">area-all</button>
      <button data-testid="page-area-other" @click="$emit('select-area', 0)">area-other</button>
      <button data-testid="page-type" @click="$emit('select-type', 1)">type</button>
      <button data-testid="page-initial" @click="$emit('select-initial', 'a')">initial</button>
      <button data-testid="page-more" @click="$emit('load-more')">more</button>
    </section>
  `,
})

async function mountPage(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.artist, query })
  const wrapper = mount(ArtistHallPage, {
    global: {
      plugins: [pinia, router],
      stubs: { ArtistHallView: HallViewStub },
    },
  })
  return { router, wrapper }
}

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

    const { wrapper } = await mountPage()
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

    const { wrapper } = await mountPage()
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

  it('loads artists for the filter query in one request', async () => {
    vi.mocked(getArtistList).mockImplementation(async (query = {}) => {
      if (query.area === 7 && query.type === 1 && query.initial === 'a') {
        return {
          more: false,
          artists: [
            {
              id: 405,
              img1v1Url: 'https://images.example.com/a.jpg',
              name: 'A 组',
            },
          ],
        }
      }
      return {
        more: false,
        artists: [
          {
            id: 401,
            img1v1Url: 'https://images.example.com/a.jpg',
            name: '林间电台',
          },
        ],
      }
    })

    const { wrapper } = await mountPage({ area: '7', type: '1', initial: 'a' })
    await flushPromises()

    expect(wrapper.get('[data-testid="hall-area"]').text()).toBe('7')
    expect(wrapper.get('[data-testid="hall-type"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="hall-initial"]').text()).toBe('a')
    expect(getArtistList).toHaveBeenCalledTimes(1)
    expect(getArtistList).toHaveBeenCalledWith({
      area: 7,
      initial: 'a',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 0,
      type: 1,
    })
    expect(getArtistList).not.toHaveBeenCalledWith(
      expect.objectContaining({ area: -1, type: -1, initial: '-1' }),
    )
  })

  it('writes and preserves filter query params', async () => {
    const { router, wrapper } = await mountPage()
    await flushPromises()

    await wrapper.get('[data-testid="page-area"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ area: '7' })
    expect(wrapper.get('[data-testid="hall-area"]').text()).toBe('7')

    await wrapper.get('[data-testid="page-type"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ area: '7', type: '1' })

    await wrapper.get('[data-testid="page-initial"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({
      area: '7',
      initial: 'a',
      type: '1',
    })
  })

  it('clears the area query when all areas are selected', async () => {
    const { router, wrapper } = await mountPage({ area: '7', type: '1' })
    await flushPromises()
    expect(wrapper.get('[data-testid="hall-area"]').text()).toBe('7')

    await wrapper.get('[data-testid="page-area-all"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ type: '1' })
    expect(wrapper.get('[data-testid="hall-area"]').text()).toBe('-1')
  })

  it('keeps area 0 as other, not all-areas', async () => {
    const { router, wrapper } = await mountPage({ area: '0' })
    await flushPromises()
    expect(wrapper.get('[data-testid="hall-area"]').text()).toBe('0')
    expect(getArtistList).toHaveBeenCalledWith({
      area: 0,
      initial: '-1',
      limit: ARTIST_LIST_PAGE_SIZE,
      offset: 0,
      type: -1,
    })

    await wrapper.get('[data-testid="page-area-all"]').trigger('click')
    await flushPromises()
    await wrapper.get('[data-testid="page-area-other"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ area: '0' })
    expect(wrapper.get('[data-testid="hall-area"]').text()).toBe('0')
  })

  it.each(['99', 'abc', '1.5', '-3', ''])(
    'treats invalid area %s as all areas',
    async (area) => {
      const { wrapper } = await mountPage({ area })
      await flushPromises()
      expect(wrapper.get('[data-testid="hall-area"]').text()).toBe('-1')
      expect(getArtistList).toHaveBeenCalledWith({
        area: -1,
        initial: '-1',
        limit: ARTIST_LIST_PAGE_SIZE,
        offset: 0,
        type: -1,
      })
    },
  )

  it('does not reset hall filters when artistDetail is opened', async () => {
    const { router, wrapper } = await mountPage({ area: '7' })
    await flushPromises()
    vi.mocked(getArtistList).mockClear()

    await router.push({ name: Pages.artistDetail, query: { id: '401' } })
    await flushPromises()

    expect(wrapper.get('[data-testid="hall-area"]').text()).toBe('7')
    expect(getArtistList).not.toHaveBeenCalled()
  })
})
