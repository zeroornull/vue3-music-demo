// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistMvSection from '@/components/artist/ArtistMvSection.vue'
import { Pages } from '@/router/pages'

const CardStub = defineComponent({
  name: 'MvCard',
  props: ['mv'],
  template: '<article>{{ mv.name }}</article>',
})

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const mv = {
  artistId: 401,
  artistName: '林间电台',
  artists: [{ id: 401, name: '林间电台' }],
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/wide.jpg',
  playCount: 1,
}

describe('ArtistMvSection', () => {
  it('renders mv cards and can load more', async () => {
    const wrapper = mount(ArtistMvSection, {
      props: { more: true, mvs: [mv] },
      global: { stubs: { MvCard: CardStub } },
    })
    expect(wrapper.text()).toContain('晚风来信 · Live')
    await wrapper.get('[data-testid="artist-mvs-more"]').trigger('click')
    expect(wrapper.emitted('load-more')).toHaveLength(1)
  })

  it('opens mv detail from a card', () => {
    const wrapper = mount(ArtistMvSection, {
      props: { mvs: [mv] },
      global: {
        stubs: {
          RouterLink: defineComponent({
            name: 'RouterLink',
            props: ['to'],
            template: '<a :href="JSON.stringify(to)"><slot /></a>',
          }),
        },
      },
    })
    expect(wrapper.get('a').attributes('href')).toContain('"name":"mvDetail"')
    expect(wrapper.get('a').attributes('href')).toContain('"id":701')
  })

  it('links positive artist ids without opening the MV', async () => {
    const wrapper = mount(ArtistMvSection, {
      props: { mvs: [mv] },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    const artist = wrapper.get('[data-testid="song-artist"]')
    expect(artist.text()).toBe('林间电台')
    expect(artist.attributes('aria-label')).toBe('打开歌手：林间电台')
    expect(wrapper.get('.mv-link').find('[data-testid="song-artist"]').exists()).toBe(
      false,
    )
    expect(
      wrapper
        .findAllComponents(RouterLinkStub)
        .find((link) => link.attributes('data-testid') === 'song-artist')
        ?.props('to'),
    ).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
    await artist.trigger('click')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 701 },
    })
  })

  it('shows artist names as text when artist id is missing', () => {
    const wrapper = mount(ArtistMvSection, {
      props: {
        mvs: [
          {
            ...mv,
            artistId: 0,
            artists: [{ id: 0, name: '未入驻歌手' }],
          },
        ],
      },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.find('[data-testid="song-artist"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('未入驻歌手')
  })

  it('retries after an empty error state', async () => {
    const wrapper = mount(ArtistMvSection, {
      props: { error: 'mv offline', mvs: [] },
      global: { stubs: { MvCard: CardStub } },
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('mv offline')
    await wrapper.get('[data-testid="artist-mvs-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
