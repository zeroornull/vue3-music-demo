// @vitest-environment happy-dom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import BannerCarousel from '@/components/discover/BannerCarousel.vue'
import type { Banner } from '@/models/banner'

const SwiperStub = defineComponent({
  name: 'Swiper',
  template: '<div data-testid="swiper"><slot /></div>',
})
const SwiperSlideStub = defineComponent({
  name: 'SwiperSlide',
  template: '<div data-testid="swiper-slide"><slot /></div>',
})

const banners: Banner[] = [
  {
    bannerId: 1,
    pic: 'https://images.example.com/first.jpg',
    targetId: 101,
    targetType: 1,
    typeTitle: '新歌首发',
  },
  {
    bannerId: 2,
    pic: 'https://images.example.com/second.jpg',
    targetId: 202,
    targetType: 10,
    typeTitle: '新专辑',
  },
]

function mountCarousel(
  props: Partial<{
    banners: Banner[]
    error: string | null
    loading: boolean
  }> = {},
) {
  return mount(BannerCarousel, {
    props: {
      banners: [],
      error: null,
      loading: false,
      ...props,
    },
    global: {
      stubs: {
        Swiper: SwiperStub,
        SwiperSlide: SwiperSlideStub,
      },
    },
  })
}

describe('BannerCarousel', () => {
  it('renders accessible loading placeholders', () => {
    const wrapper = mountCarousel({ loading: true })

    expect(wrapper.get('[data-testid="banner-loading"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('[data-testid="banner-skeleton"]')).toHaveLength(3)
  })

  it('renders an error and emits retry', async () => {
    const wrapper = mountCarousel({ error: 'offline' })

    expect(wrapper.get('[role="alert"]').text()).toContain('offline')
    await wrapper.get('[data-testid="banner-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders an explicit empty state', () => {
    const wrapper = mountCarousel()
    expect(wrapper.get('[data-testid="banner-empty"]').text()).toContain('暂无推荐内容')
  })

  it('styles the empty card with theme well tokens', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/discover/BannerCarousel.vue'), 'utf8')
    expect(source).toMatch(/\.state-card[\s\S]*?background:\s*var\(--color-well\)/)
    expect(source).toMatch(/\.state-card[\s\S]*?border:\s*1px dashed var\(--color-border\)/)
    expect(source).toMatch(/\.error-state[\s\S]*?background:\s*var\(--color-danger-bg\)/)
    expect(source).toMatch(/\.state-card button[\s\S]*?background:\s*var\(--color-danger\)/)
    expect(source).toMatch(
      /linear-gradient\(100deg, var\(--color-line\) 20%, var\(--color-border\) 45%, var\(--color-line\) 70%\)/,
    )
    expect(source).not.toContain('#f8fafc')
    expect(source).not.toContain('#9b3838')
  })

  it('renders banner images and emits the selected banner', async () => {
    const wrapper = mountCarousel({ banners })

    expect(wrapper.get('[data-testid="swiper"]').attributes('data-testid')).toBe('swiper')
    expect(wrapper.findAll('[data-testid="banner-slide"]')).toHaveLength(2)
    expect(wrapper.findAll('img').map((image) => image.attributes('alt'))).toEqual([
      '新歌首发',
      '新专辑',
    ])

    await wrapper.findAll('[data-testid="banner-slide"]')[0]?.trigger('click')
    expect(wrapper.emitted<Banner[]>('select')?.[0]?.[0]).toEqual(banners[0])
  })
})
