// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getDigitalAlbumDetail,
  getDigitalAlbumMall,
  getDigitalAlbumWiki,
} from '@/api/digital'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import DigitalAlbumPage from '@/views/DigitalAlbumPage.vue'

vi.mock('@/api/digital', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/digital')>()
  return {
    ...actual,
    getDigitalAlbumDetail: vi.fn(),
    getDigitalAlbumMall: vi.fn(),
    getDigitalAlbumWiki: vi.fn(),
  }
})

const product = {
  albumId: 501,
  artist: { id: 401, name: '林间电台' },
  coverUrl: '',
  description: '数字专辑介绍',
  id: 511,
  name: '数字夜航',
  originalPrice: 2000,
  price: 1800,
  publishTime: 0,
  saleNum: 128,
  songs: [{ id: 301, name: '晚风来信' }],
}
const mall = {
  albumId: 501,
  id: 511,
  name: '数字夜航',
  originalPrice: 2000,
  price: 1800,
  saleNum: 128,
  skus: [{ id: 71, name: '数字专辑', price: 1800 }],
}
const wiki = { title: '专辑百科', text: '林间数字专辑百科。' }

const DigitalAlbumViewStub = defineComponent({
  name: 'DigitalAlbumView',
  props: ['mall', 'mallError', 'product', 'productError', 'wiki', 'wikiError'],
  emits: ['retry-mall', 'retry-product', 'retry-wiki'],
  template: `
    <section>
      <span data-testid="product-name">{{ product && product.name }}</span>
      <span v-if="productError" data-testid="product-error">{{ productError }}</span>
      <span data-testid="mall-name">{{ mall && mall.name }}</span>
      <span data-testid="wiki-count">{{ wiki.length }}</span>
      <button data-testid="page-retry-product" @click="$emit('retry-product')">retry</button>
    </section>
  `,
})

describe('DigitalAlbumPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getDigitalAlbumDetail).mockReset()
    vi.mocked(getDigitalAlbumMall).mockReset()
    vi.mocked(getDigitalAlbumWiki).mockReset()
    vi.mocked(getDigitalAlbumDetail).mockResolvedValue(product)
    vi.mocked(getDigitalAlbumMall).mockResolvedValue(mall)
    vi.mocked(getDigitalAlbumWiki).mockResolvedValue([wiki])
  })

  it('loads the id query and retries product independently', async () => {
    vi.mocked(getDigitalAlbumDetail)
      .mockRejectedValueOnce(new Error('product offline'))
      .mockResolvedValueOnce(product)
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.digitalAlbum, query: { id: '511' } })
    const wrapper = mount(DigitalAlbumPage, {
      global: {
        plugins: [pinia, router],
        stubs: { DigitalAlbumView: DigitalAlbumViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="product-error"]').text()).toBe('product offline')
    expect(wrapper.get('[data-testid="mall-name"]').text()).toBe('数字夜航')
    expect(wrapper.get('[data-testid="wiki-count"]').text()).toBe('1')
    expect(getDigitalAlbumDetail).toHaveBeenCalledWith(511)
    expect(getDigitalAlbumMall).toHaveBeenCalledWith(511)
    expect(getDigitalAlbumWiki).toHaveBeenCalledWith(501)

    await wrapper.get('[data-testid="page-retry-product"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="product-name"]').text()).toBe('数字夜航')
    expect(getDigitalAlbumWiki).toHaveBeenCalledWith(501)
  })

  it('shows a missing-id state without calling detail APIs', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.digitalAlbum })
    const wrapper = mount(DigitalAlbumPage, {
      global: {
        plugins: [pinia, router],
        stubs: { DigitalAlbumView: DigitalAlbumViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="digital-album-missing"]').text()).toContain(
      '缺少数字专辑 ID',
    )
    expect(getDigitalAlbumDetail).not.toHaveBeenCalled()
  })

  it('reloads when the id query changes', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.digitalAlbum, query: { id: '511' } })
    mount(DigitalAlbumPage, {
      global: {
        plugins: [pinia, router],
        stubs: { DigitalAlbumView: DigitalAlbumViewStub },
      },
    })
    await flushPromises()
    vi.mocked(getDigitalAlbumDetail).mockResolvedValue({ ...product, id: 512, name: '下一张' })
    await router.push({ name: Pages.digitalAlbum, query: { id: '512' } })
    await flushPromises()
    expect(getDigitalAlbumDetail).toHaveBeenCalledWith(512)
  })
})
