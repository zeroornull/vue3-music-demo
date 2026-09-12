// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { Pages } from '@/router/pages'
import DigitalAlbumView from '@/views/DigitalAlbumView.vue'

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

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const WikiStub = defineComponent({
  name: 'SongWikiSection',
  props: ['blocks', 'error', 'loading', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section>
      <h3>{{ title }}</h3>
      <span data-testid="wiki-title">{{ title }}</span>
      <button data-testid="wiki-retry" @click="$emit('retry')" />
    </section>
  `,
})

describe('DigitalAlbumView', () => {
  it('renders product, mall SKUs and wiki without a purchase action', () => {
    const wrapper = mount(DigitalAlbumView, {
      props: {
        product,
        mall,
        wiki: [{ title: '专辑百科', text: '林间数字专辑百科。' }],
      },
      global: {
        stubs: { RouterLink: RouterLinkStub, SongWikiSection: WikiStub },
      },
    })
    expect(wrapper.get('#digital-album-title').text()).toBe('数字夜航')
    expect(wrapper.get('[data-testid="digital-product-price"]').text()).toContain('¥18.00')
    expect(wrapper.get('[data-testid="digital-product-original"]').text()).toContain('¥20.00')
    expect(wrapper.text()).toContain('数字专辑为展示价格，本应用不支持购买')
    expect(wrapper.text()).toContain('本应用不支持购买')
    expect(wrapper.find('[data-testid="digital-buy"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="digital-product-songs"]').text()).toContain('晚风来信')
    expect(wrapper.get('[data-testid="digital-mall-skus"]').text()).toContain('数字专辑')
    expect(wrapper.get('[data-testid="wiki-title"]').text()).toBe('专辑百科')
    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links[0]?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
    expect(links[1]?.props('to')).toEqual({
      name: Pages.album,
      query: { id: 501 },
    })
  })

  it('retries product, mall and wiki independently', async () => {
    const failed = mount(DigitalAlbumView, {
      props: {
        productError: 'offline',
        mallError: 'mall offline',
        wikiError: 'wiki offline',
      },
      global: {
        stubs: { RouterLink: RouterLinkStub, SongWikiSection: WikiStub },
      },
    })
    await failed.get('[data-testid="digital-product-retry"]').trigger('click')
    await failed.get('[data-testid="digital-mall-retry"]').trigger('click')
    await failed.get('[data-testid="wiki-retry"]').trigger('click')
    expect(failed.emitted('retry-product')).toHaveLength(1)
    expect(failed.emitted('retry-mall')).toHaveLength(1)
    expect(failed.emitted('retry-wiki')).toHaveLength(1)
  })
})
