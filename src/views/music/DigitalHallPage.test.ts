// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getDigitalAlbumBoard,
  getDigitalAlbumSales,
  getDigitalAlbums,
  getDigitalAlbumsByStyle,
  getDigitalSingleBoard,
} from '@/api/digital'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import DigitalHallPage from '@/views/music/DigitalHallPage.vue'

vi.mock('@/api/digital', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/digital')>()
  return {
    ...actual,
    getDigitalAlbumBoard: vi.fn(),
    getDigitalAlbumSales: vi.fn(),
    getDigitalAlbums: vi.fn(),
    getDigitalAlbumsByStyle: vi.fn(),
    getDigitalSingleBoard: vi.fn(),
  }
})

const album = {
  artist: { id: 401, name: '林间电台' },
  id: 511,
  name: '数字夜航',
  picUrl: '',
  publishTime: 0,
}
const styled = { ...album, id: 512, name: '华语数字' }
const japan = { ...album, id: 515, name: '日本数字' }
const ranked = { ...album, id: 513, name: '周榜专辑' }
const single = { ...album, id: 514, name: '周榜单曲' }
const sale = { id: 511, name: '数字夜航', saleNum: 128 }

const DigitalHallViewStub = defineComponent({
  name: 'DigitalHallView',
  props: [
    'albumBoard',
    'albums',
    'albumsError',
    'area',
    'sales',
    'salesError',
    'singleBoard',
    'styleAlbums',
    'styleError',
  ],
  emits: [
    'retry-album-board',
    'retry-albums',
    'retry-sales',
    'retry-singles',
    'retry-style',
    'select-area',
  ],
  template: `
    <section>
      <span data-testid="area">{{ area }}</span>
      <span data-testid="album-count">{{ albums.length }}</span>
      <span v-if="albumsError" data-testid="albums-error">{{ albumsError }}</span>
      <span data-testid="style-count">{{ styleAlbums.length }}</span>
      <span data-testid="board-count">{{ albumBoard.length }}</span>
      <span data-testid="single-count">{{ singleBoard.length }}</span>
      <span data-testid="sale-count">{{ sales.length }}</span>
      <span v-if="salesError" data-testid="sales-error">{{ salesError }}</span>
      <button data-testid="page-retry-albums" @click="$emit('retry-albums')">retry</button>
      <button data-testid="page-area" @click="$emit('select-area', 'JP')">area</button>
    </section>
  `,
})

describe('DigitalHallPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getDigitalAlbums).mockReset()
    vi.mocked(getDigitalAlbumsByStyle).mockReset()
    vi.mocked(getDigitalAlbumBoard).mockReset()
    vi.mocked(getDigitalSingleBoard).mockReset()
    vi.mocked(getDigitalAlbumSales).mockReset()
    vi.mocked(getDigitalAlbums).mockResolvedValue([album])
    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([styled])
    vi.mocked(getDigitalAlbumBoard).mockResolvedValue([ranked])
    vi.mocked(getDigitalSingleBoard).mockResolvedValue([single])
    vi.mocked(getDigitalAlbumSales).mockResolvedValue([sale])
  })

  it('loads lists and sales, then retries albums independently', async () => {
    vi.mocked(getDigitalAlbums)
      .mockRejectedValueOnce(new Error('albums offline'))
      .mockResolvedValueOnce([album])
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.digital })
    const wrapper = mount(DigitalHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { DigitalHallView: DigitalHallViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="albums-error"]').text()).toBe('albums offline')
    expect(wrapper.get('[data-testid="style-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="board-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="single-count"]').text()).toBe('1')
    expect(getDigitalAlbumSales).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="page-retry-albums"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="album-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="sale-count"]').text()).toBe('1')
    expect(getDigitalAlbumSales).toHaveBeenCalledWith([511])

    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([japan])
    await wrapper.get('[data-testid="page-area"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.area).toBe('JP')
    expect(getDigitalAlbumsByStyle).toHaveBeenCalledWith('JP')
  })

  it('strips a default or invalid area query', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.digital, query: { area: 'Z_H' } })
    mount(DigitalHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { DigitalHallView: DigitalHallViewStub },
      },
    })
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})

    await router.replace({ name: Pages.digital, query: { area: 'foo' } })
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('loads the area query and pushes a selected area', async () => {
    vi.mocked(getDigitalAlbumsByStyle).mockResolvedValue([japan])
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.digital, query: { area: 'JP' } })
    const wrapper = mount(DigitalHallPage, {
      global: {
        plugins: [pinia, router],
        stubs: { DigitalHallView: DigitalHallViewStub },
      },
    })
    await flushPromises()
    expect(getDigitalAlbumsByStyle).toHaveBeenCalledWith('JP')
    expect(wrapper.get('[data-testid="area"]').text()).toBe('JP')
    expect(wrapper.get('[data-testid="style-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-area"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query.area).toBe('JP')
  })
})
