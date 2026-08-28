// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PersonalizedSection from '@/components/discover/PersonalizedSection.vue'

const playlist = {
  alg: 'featured',
  canDislike: false,
  copywriter: '根据你的音乐口味推荐',
  highQuality: true,
  id: 101,
  name: '凌晨听歌指南',
  picUrl: 'https://images.example.com/playlist.jpg',
  playCount: 128_000,
  trackCount: 50,
  trackNumberUpdateTime: 0,
  type: 0,
}

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

function mountSection(
  props: Partial<{
    error: string | null
    loading: boolean
    playlists: typeof playlist[]
  }> = {},
) {
  return mount(PersonalizedSection, {
    props: {
      error: null,
      loading: false,
      playlists: [],
      ...props,
    },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('PersonalizedSection', () => {
  it('renders five loading placeholders', () => {
    const wrapper = mountSection({ loading: true })
    expect(wrapper.get('[data-testid="personalized-loading"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('[data-testid="playlist-skeleton"]')).toHaveLength(5)
  })

  it('renders an error and emits retry', async () => {
    const wrapper = mountSection({ error: 'offline' })
    expect(wrapper.get('[role="alert"]').text()).toContain('offline')

    await wrapper.get('[data-testid="personalized-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders an explicit empty state', () => {
    const wrapper = mountSection()
    expect(wrapper.get('[data-testid="personalized-empty"]').text()).toContain('暂无专属歌单')
  })

  it('limits the visible grid to ten playlists', () => {
    const playlists = Array.from({ length: 12 }, (_, index) => ({
      ...playlist,
      id: index + 1,
      name: `歌单 ${index + 1}`,
    }))
    const wrapper = mountSection({ playlists })

    expect(wrapper.findAll('[data-testid="playlist-card"]')).toHaveLength(10)
  })
})
