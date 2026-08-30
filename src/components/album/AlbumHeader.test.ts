// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AlbumHeader from '@/components/album/AlbumHeader.vue'

const album = {
  artist: { id: 401, name: '林间电台' },
  description: '夜航第一张专辑',
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
  publishTime: 1_609_459_200_000,
  size: 8,
}

describe('AlbumHeader', () => {
  it('renders name, artist link, date and play-all', async () => {
    const wrapper = mount(AlbumHeader, {
      props: { album, playable: true, songCount: 1 },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="JSON.stringify(to)"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.get('h1').text()).toBe('夜航')
    expect(wrapper.get('a').text()).toBe('林间电台')
    expect(wrapper.get('a').attributes('href')).toContain('artistDetail')
    expect(wrapper.get('a').attributes('href')).toContain('"id":401')
    expect(wrapper.text()).toContain('2021/01/01')
    expect(wrapper.text()).toContain('1 首')
    await wrapper.get('[data-testid="play-all"]').trigger('click')
    expect(wrapper.emitted('play-all')).toHaveLength(1)
  })
})
