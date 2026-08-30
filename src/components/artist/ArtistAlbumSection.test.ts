// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistAlbumSection from '@/components/artist/ArtistAlbumSection.vue'
import { Pages } from '@/router/pages'

const album = {
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
  publishTime: 1_609_459_200_000,
  size: 8,
}

describe('ArtistAlbumSection', () => {
  it('links albums to the album page and can load more', async () => {
    const wrapper = mount(ArtistAlbumSection, {
      props: { albums: [album], more: true },
      global: {
        stubs: {
          RouterLink: defineComponent({
            props: ['to'],
            template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
          }),
        },
      },
    })
    expect(JSON.parse(wrapper.get('a').attributes('data-to') || '{}')).toEqual({
      name: Pages.album,
      query: { id: 501 },
    })
    expect(wrapper.get('a').attributes('aria-label')).toBe('打开专辑：夜航')
    expect(wrapper.text()).toContain('夜航')
    expect(wrapper.text()).toContain('2021/01/01')
    await wrapper.get('[data-testid="artist-albums-more"]').trigger('click')
    expect(wrapper.emitted('load-more')).toHaveLength(1)
  })

  it('retries after an empty error state', async () => {
    const wrapper = mount(ArtistAlbumSection, {
      props: { albums: [], error: 'album offline' },
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('album offline')
    await wrapper.get('[data-testid="artist-albums-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
