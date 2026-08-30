// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjHallView from '@/views/music/DjHallView.vue'

const BannerStub = defineComponent({
  name: 'BannerCarousel',
  props: ['banners', 'description', 'error', 'eyebrow', 'heading', 'loading'],
  emits: ['retry', 'select'],
  template: `
    <section data-testid="hall-banners">
      <h2>{{ heading }}</h2>
      <span>{{ banners.length }}</span>
      <button data-testid="banner-retry" @click="$emit('retry')">retry</button>
    </section>
  `,
})

const DjStub = defineComponent({
  name: 'DjProgramSection',
  props: ['error', 'loading', 'programs'],
  emits: ['retry'],
  template: `
    <section data-testid="hall-programs">
      <span>{{ programs.length }}</span>
      <button data-testid="dj-retry" @click="$emit('retry')">retry</button>
    </section>
  `,
})

describe('DjHallView', () => {
  it('composes radio banners and recommended programs', async () => {
    const wrapper = mount(DjHallView, {
      props: {
        banners: [
          {
            bannerId: 1,
            pic: 'https://images.example.com/dj-banner.jpg',
            targetId: 301,
            targetType: 1,
            typeTitle: '深夜首播',
          },
        ],
        programs: [
          {
            copywriter: '睡前电台',
            id: 901,
            name: '深夜民谣',
            picUrl: 'https://images.example.com/dj.jpg',
          },
        ],
      },
      global: {
        stubs: {
          BannerCarousel: BannerStub,
          DjProgramSection: DjStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="hall-banners"] h2').text()).toBe('电台推荐')
    expect(wrapper.get('[data-testid="hall-banners"]').text()).toContain('1')
    expect(wrapper.get('[data-testid="hall-programs"]').text()).toContain('1')
    await wrapper.get('[data-testid="banner-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-retry"]').trigger('click')
    expect(wrapper.emitted('retry-banners')).toHaveLength(1)
    expect(wrapper.emitted('retry-programs')).toHaveLength(1)
  })

  it('forwards banner select to the hall page', async () => {
    const banner = {
      bannerId: 1,
      pic: 'https://images.example.com/dj-banner.jpg',
      targetId: 301,
      targetType: 1,
      typeTitle: '深夜首播',
    }
    const wrapper = mount(DjHallView, {
      props: { banners: [banner], programs: [] },
      global: {
        stubs: {
          BannerCarousel: defineComponent({
            name: 'BannerCarousel',
            emits: ['select'],
            template:
              '<button data-testid="select-banner" @click="$emit(\'select\', { bannerId: 1, pic: \'x\', targetId: 301, targetType: 1, typeTitle: \'深夜首播\' })">go</button>',
          }),
          DjProgramSection: DjStub,
        },
      },
    })
    await wrapper.get('[data-testid="select-banner"]').trigger('click')
    expect(wrapper.emitted('select-banner')?.[0]?.[0]).toMatchObject({
      targetId: 301,
      targetType: 1,
    })
  })
})
