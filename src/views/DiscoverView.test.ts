// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getBanners } from '@/api/banner'
import { getPersonalizedPlaylists } from '@/api/personalized'
import type { Banner } from '@/models/banner'
import DiscoverView from '@/views/DiscoverView.vue'

vi.mock('@/api/banner', () => ({
  getBanners: vi.fn(),
}))
vi.mock('@/api/personalized', () => ({
  getPersonalizedPlaylists: vi.fn(),
}))

const banner: Banner = {
  bannerId: 1,
  pic: 'https://images.example.com/banner.jpg',
  targetId: 1001,
  targetType: 1,
  typeTitle: '新歌首发',
}

const BannerCarouselStub = defineComponent({
  name: 'BannerCarousel',
  props: {
    banners: { type: Array, required: true },
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
  },
  emits: ['retry', 'select'],
  template: `
    <section data-testid="banner-stub">
      <span data-testid="banner-count">{{ banners.length }}</span>
      <span v-if="error" role="alert">{{ error }}</span>
      <button data-testid="retry" @click="$emit('retry')">retry</button>
    </section>
  `,
})

const PersonalizedSectionStub = defineComponent({
  name: 'PersonalizedSection',
  props: {
    error: { type: String, default: null },
    loading: { type: Boolean, required: true },
    playlists: { type: Array, required: true },
  },
  emits: ['retry'],
  template: `
    <section data-testid="personalized-stub">
      <span data-testid="personalized-count">{{ playlists.length }}</span>
      <span v-if="error" data-testid="personalized-error">{{ error }}</span>
      <button data-testid="personalized-retry" @click="$emit('retry')">retry</button>
    </section>
  `,
})

function mountView() {
  return mount(DiscoverView, {
    global: {
      plugins: [createPinia()],
      stubs: {
        BannerCarousel: BannerCarouselStub,
        PersonalizedSection: PersonalizedSectionStub,
        RouterLink: defineComponent({ template: '<a><slot /></a>' }),
      },
    },
  })
}

describe('DiscoverView', () => {
  beforeEach(() => {
    vi.mocked(getBanners).mockReset()
    vi.mocked(getPersonalizedPlaylists).mockReset()
    vi.mocked(getPersonalizedPlaylists).mockResolvedValue([])
  })

  it('loads banners when mounted', async () => {
    vi.mocked(getBanners).mockResolvedValue([banner])

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('推荐')
    expect(wrapper.get('[data-testid="banner-count"]').text()).toBe('1')
    expect(getBanners).toHaveBeenCalledTimes(1)
  })

  it('retries a failed banner request', async () => {
    vi.mocked(getBanners).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([banner])

    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('offline')

    await wrapper.get('[data-testid="retry"]').trigger('click')
    await flushPromises()

    expect(getBanners).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="banner-count"]').text()).toBe('1')
  })

  it('loads and retries personalized playlists independently', async () => {
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getPersonalizedPlaylists)
      .mockRejectedValueOnce(new Error('playlist offline'))
      .mockResolvedValueOnce([
        {
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
        },
      ])

    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="personalized-error"]').text()).toBe('playlist offline')

    await wrapper.get('[data-testid="personalized-retry"]').trigger('click')
    await flushPromises()

    expect(getPersonalizedPlaylists).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="personalized-count"]').text()).toBe('1')
  })
})
