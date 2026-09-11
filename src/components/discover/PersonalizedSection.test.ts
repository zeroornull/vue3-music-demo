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
    emptyTitle: string
    error: string | null
    hint: string
    loading: boolean
    playlists: typeof playlist[]
    testid: string
    title: string
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
    expect(wrapper.get('#personalized-title').text()).toBe('你的专属歌单')
    expect(wrapper.get('[data-testid="personalized-empty"]').text()).toContain('暂无专属歌单')
    expect(wrapper.text()).toContain('依据当前 API 返回的个性化推荐')
  })

  it('uses a hall-specific title and testid', () => {
    const wrapper = mountSection({
      emptyTitle: '暂无曲风歌单',
      hint: '点击封面即可打开歌单',
      testid: 'style-playlists',
      title: '曲风歌单',
    })
    expect(wrapper.get('#style-playlists-title').text()).toBe('曲风歌单')
    expect(wrapper.get('[data-testid="style-playlists-empty"]').text()).toContain(
      '暂无曲风歌单',
    )
    expect(wrapper.get('[data-testid="style-playlists-empty"]').text()).toContain(
      '曲风歌单',
    )
    expect(wrapper.text()).toContain('点击封面即可打开歌单')
    expect(wrapper.text()).not.toContain('依据当前 API 返回的个性化推荐')
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
