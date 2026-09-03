// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MvCard from '@/components/discover/MvCard.vue'
import { Pages } from '@/router/pages'

const mv = {
  alg: 'featured',
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  canDislike: false,
  copywriter: '热门推荐',
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/mv.jpg',
  playCount: 3_280_000,
  subed: false,
  type: 1,
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

describe('MvCard', () => {
  it('renders metadata and preserves the legacy mvDetail query route', () => {
    const wrapper = mount(MvCard, {
      props: { mv },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('img').attributes('alt')).toBe('晚风来信 · Live')
    expect(wrapper.text()).toContain('328 万')
    expect(wrapper.text()).toContain('03:58')
    expect(wrapper.text()).toContain('林间电台')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 701 },
    })
  })

  it('links positive artist ids without opening the MV', async () => {
    const wrapper = mount(MvCard, {
      props: {
        mv: {
          ...mv,
          artists: [
            { id: 401, name: '林间电台' },
            { id: 402, name: '海岸信号' },
          ],
        },
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    const artists = wrapper.findAll('[data-testid="song-artist"]')
    expect(artists).toHaveLength(2)
    expect(artists[0]?.text()).toBe('林间电台')
    expect(artists[0]?.attributes('aria-label')).toBe('打开歌手：林间电台')
    expect(wrapper.get('.mv-link').find('[data-testid="song-artist"]').exists()).toBe(false)
    const artistLinks = wrapper
      .findAllComponents(RouterLinkStub)
      .filter((link) => link.attributes('data-testid') === 'song-artist')
    expect(artistLinks[0]?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
    expect(artistLinks[1]?.props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 402 },
    })
    await artists[0]?.trigger('click')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 701 },
    })
  })

  it('shows artist names as text when artist id is missing', () => {
    const wrapper = mount(MvCard, {
      props: {
        mv: { ...mv, artistId: 0, artists: [{ id: 0, name: '未入驻歌手' }] },
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('[data-testid="song-artist"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('未入驻歌手')
  })
})
