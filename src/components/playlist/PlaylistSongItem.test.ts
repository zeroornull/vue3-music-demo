// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PlaylistSongItem from '@/components/playlist/PlaylistSongItem.vue'
import { Pages } from '@/router/pages'

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a data-testid="artist-link"><slot /></a>',
})

const song = {
  album: { id: 501, name: '晚风来信' },
  artists: [
    { id: 401, name: '林间电台' },
    { id: 402, name: '城市电台' },
  ],
  duration: 238_000,
  id: 301,
  name: '晚风来信',
}

describe('PlaylistSongItem', () => {
  it('renders song metadata, duration and an accessible play control', async () => {
    const wrapper = mount(PlaylistSongItem, {
      props: { current: false, song },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.text()).toContain('晚风来信')
    expect(wrapper.text()).toContain('林间电台 / 城市电台')
    expect(wrapper.text()).toContain('晚风来信')
    expect(wrapper.text()).toContain('03:58')
    expect(wrapper.get('button').attributes('aria-label')).toBe(
      '播放：晚风来信，林间电台 / 城市电台',
    )
    expect(wrapper.get('button').attributes('aria-current')).toBeUndefined()

    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('play')?.[0]?.[0]).toEqual(song)
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.artistDetail,
      query: { id: 401 },
    })
  })

  it('marks the current song', () => {
    const wrapper = mount(PlaylistSongItem, {
      props: { current: true, song },
      global: { stubs: { RouterLink: RouterLinkStub } },
    })

    expect(wrapper.get('button').attributes('aria-current')).toBe('true')
    expect(wrapper.get('[data-testid="playlist-song-item"]').classes()).toContain(
      'is-current',
    )
  })
})
