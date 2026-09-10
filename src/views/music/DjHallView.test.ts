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

const RankStub = defineComponent({
  name: 'DjRadioRankSection',
  props: ['error', 'loading', 'radios', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section
      :data-testid="testid === 'dj-recommend' ? 'hall-recommend' : testid === 'dj-radio-hours' ? 'hall-radio-hours' : 'hall-radio-toplist'"
    >
      <h2>{{ title || '电台榜' }}</h2>
      <span>{{ radios.length }}</span>
      <button
        :data-testid="testid === 'dj-recommend' ? 'dj-recommend-retry' : testid === 'dj-radio-hours' ? 'dj-radio-hours-retry' : 'dj-radio-toplist-retry'"
        @click="$emit('retry')"
      >retry</button>
    </section>
  `,
})

const DjStub = defineComponent({
  name: 'DjProgramSection',
  props: ['error', 'loading', 'programs', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section
      :data-testid="testid === 'dj-toplist' ? 'hall-toplist' : testid === 'dj-today' ? 'hall-today' : testid === 'dj-program-hours' ? 'hall-program-hours' : 'hall-programs'"
    >
      <h2>{{ title || '推荐电台' }}</h2>
      <span>{{ programs.length }}</span>
      <button
        :data-testid="testid === 'dj-toplist' ? 'dj-toplist-retry' : testid === 'dj-today' ? 'dj-today-retry' : testid === 'dj-program-hours' ? 'dj-program-hours-retry' : 'dj-retry'"
        @click="$emit('retry')"
      >retry</button>
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
        recommendRadios: [
          {
            djName: '林间主播',
            id: 801,
            name: '夜航电台',
            picUrl: '',
            playCount: 1,
            rcmdText: '',
          },
        ],
        todayPrograms: [{ copywriter: '', id: 911, name: '今日夜航', picUrl: '' }],
        programHours: [{ copywriter: '', id: 921, name: '整点夜话', picUrl: '' }],
        radioHours: [
          {
            djName: '',
            id: 831,
            name: '整点电台',
            picUrl: '',
            playCount: 1,
            rcmdText: '',
          },
        ],
      },
      global: {
        stubs: {
          BannerCarousel: BannerStub,
          DjProgramSection: DjStub,
          DjRadioRankSection: RankStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="hall-banners"] h2').text()).toBe('电台推荐')
    expect(wrapper.get('[data-testid="hall-banners"]').text()).toContain('1')
    expect(wrapper.get('[data-testid="hall-programs"]').text()).toContain('1')
    expect(wrapper.get('[data-testid="hall-toplist"] h2').text()).toBe('节目榜')
    expect(wrapper.get('[data-testid="hall-radio-toplist"] h2').text()).toBe('电台榜')
    expect(wrapper.get('[data-testid="hall-recommend"] h2').text()).toBe('精选电台')
    expect(wrapper.get('[data-testid="hall-today"] h2').text()).toBe('今日优选')
    expect(wrapper.get('[data-testid="hall-program-hours"] h2').text()).toBe('24小时节目榜')
    expect(wrapper.get('[data-testid="hall-radio-hours"] h2').text()).toBe('24小时电台榜')
    expect(wrapper.get('#radio-cat-title').text()).toBe('电台分类')
    await wrapper.get('[data-testid="banner-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-toplist-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-radio-toplist-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-recommend-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-today-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-program-hours-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-radio-hours-retry"]').trigger('click')
    expect(wrapper.emitted('retry-banners')).toHaveLength(1)
    expect(wrapper.emitted('retry-programs')).toHaveLength(1)
    expect(wrapper.emitted('retry-toplist')).toHaveLength(1)
    expect(wrapper.emitted('retry-radio-toplist')).toHaveLength(1)
    expect(wrapper.emitted('retry-recommend-radios')).toHaveLength(1)
    expect(wrapper.emitted('retry-today-programs')).toHaveLength(1)
    expect(wrapper.emitted('retry-program-hours')).toHaveLength(1)
    expect(wrapper.emitted('retry-radio-hours')).toHaveLength(1)
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
          DjRadioRankSection: RankStub,
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
