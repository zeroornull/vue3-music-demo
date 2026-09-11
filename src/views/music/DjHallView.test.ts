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
  computed: {
    hallId(): string {
      const map: Record<string, string> = {
        'dj-recommend': 'hall-recommend',
        'dj-radio-hours': 'hall-radio-hours',
        'dj-hot': 'hall-hot',
        'dj-type-recommend': 'hall-type-recommend',
        'dj-category-recommend': 'hall-category-recommend',
        'dj-paygift': 'hall-paygift',
        'dj-popular': 'hall-popular',
      }
      return map[String(this.testid || '')] || 'hall-radio-toplist'
    },
    retryId(): string {
      return this.testid ? `${this.testid}-retry` : 'dj-radio-toplist-retry'
    },
  },
  template: `
    <section :data-testid="hallId">
      <h2>{{ title || '电台榜' }}</h2>
      <span>{{ radios.length }}</span>
      <button :data-testid="retryId" @click="$emit('retry')">retry</button>
    </section>
  `,
})

const DjStub = defineComponent({
  name: 'DjProgramSection',
  props: ['error', 'loading', 'programs', 'testid', 'title'],
  emits: ['retry'],
  computed: {
    hallId(): string {
      const map: Record<string, string> = {
        'dj-toplist': 'hall-toplist',
        'dj-today': 'hall-today',
        'dj-program-hours': 'hall-program-hours',
        'dj-recommend-programs': 'hall-recommend-programs',
      }
      return map[String(this.testid || '')] || 'hall-programs'
    },
    retryId(): string {
      if (this.testid === 'dj-toplist') return 'dj-toplist-retry'
      if (this.testid === 'dj-today') return 'dj-today-retry'
      if (this.testid === 'dj-program-hours') return 'dj-program-hours-retry'
      if (this.testid === 'dj-recommend-programs') return 'dj-recommend-programs-retry'
      return 'dj-retry'
    },
  },
  template: `
    <section :data-testid="hallId">
      <h2>{{ title || '推荐电台' }}</h2>
      <span>{{ programs.length }}</span>
      <button :data-testid="retryId" @click="$emit('retry')">retry</button>
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
        recommendPrograms: [{ copywriter: '', id: 921, name: '推荐夜航', picUrl: '' }],
        hotRadios: [
          {
            djName: '',
            id: 831,
            name: '热门夜航',
            picUrl: '',
            playCount: 1,
            rcmdText: '',
          },
        ],
        typeRecommendRadios: [
          {
            djName: '',
            id: 841,
            name: '故事电台',
            picUrl: '',
            playCount: 1,
            rcmdText: '',
          },
        ],
        categoryRecommendRadios: [
          {
            djName: '',
            id: 851,
            name: '分类夜航',
            picUrl: '',
            playCount: 1,
            rcmdText: '',
          },
        ],
        extraCategories: [{ id: 9, name: '二次元' }],
        paygiftRadios: [
          {
            djName: '',
            id: 881,
            name: '精选夜航',
            picUrl: '',
            playCount: 1,
            rcmdText: '',
          },
        ],
        popularRadios: [
          {
            djName: '',
            id: 891,
            name: '热门夜航',
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
    expect(wrapper.get('[data-testid="hall-recommend-programs"] h2').text()).toBe('推荐节目')
    expect(wrapper.get('[data-testid="hall-hot"] h2').text()).toBe('热门电台')
    expect(wrapper.get('[data-testid="hall-type-recommend"] h2').text()).toBe('分类精选电台')
    expect(wrapper.get('[data-testid="hall-category-recommend"] h2').text()).toBe('分类推荐')
    expect(wrapper.get('#dj-extra-cats-title').text()).toBe('更多分类')
    expect(wrapper.get('[data-testid="hall-paygift"] h2').text()).toBe('付费精选')
    expect(wrapper.get('[data-testid="hall-popular"] h2').text()).toBe('热门电台榜')
    expect(wrapper.get('#radio-cat-title').text()).toBe('电台分类')
    await wrapper.get('[data-testid="banner-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-toplist-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-radio-toplist-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-recommend-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-today-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-program-hours-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-radio-hours-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-recommend-programs-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-hot-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-type-recommend-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-category-recommend-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-paygift-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-popular-retry"]').trigger('click')
    const extraChip = wrapper.findAll('.extra-cats button').find((button) => button.text() === '二次元')
    expect(extraChip).toBeTruthy()
    await extraChip!.trigger('click')
    expect(wrapper.emitted('retry-banners')).toHaveLength(1)
    expect(wrapper.emitted('retry-programs')).toHaveLength(1)
    expect(wrapper.emitted('retry-toplist')).toHaveLength(1)
    expect(wrapper.emitted('retry-radio-toplist')).toHaveLength(1)
    expect(wrapper.emitted('retry-recommend-radios')).toHaveLength(1)
    expect(wrapper.emitted('retry-today-programs')).toHaveLength(1)
    expect(wrapper.emitted('retry-program-hours')).toHaveLength(1)
    expect(wrapper.emitted('retry-radio-hours')).toHaveLength(1)
    expect(wrapper.emitted('retry-recommend-programs')).toHaveLength(1)
    expect(wrapper.emitted('retry-hot-radios')).toHaveLength(1)
    expect(wrapper.emitted('retry-type-recommend')).toHaveLength(1)
    expect(wrapper.emitted('retry-category-recommend')).toHaveLength(1)
    expect(wrapper.emitted('retry-paygift')).toHaveLength(1)
    expect(wrapper.emitted('retry-popular')).toHaveLength(1)
    expect(wrapper.emitted('select-cat')).toEqual([[9]])
  })

  it('retries extra categories after an error', async () => {
    const wrapper = mount(DjHallView, {
      props: {
        banners: [],
        extraCategoriesError: 'extra offline',
        programs: [],
      },
      global: {
        stubs: {
          BannerCarousel: BannerStub,
          DjProgramSection: DjStub,
          DjRadioRankSection: RankStub,
        },
      },
    })
    await wrapper.get('[data-testid="dj-extra-cats-retry"]').trigger('click')
    expect(wrapper.emitted('retry-extra-categories')).toHaveLength(1)
  })

  it('shows extra-category loading and empty states', () => {
    const loading = mount(DjHallView, {
      props: {
        banners: [],
        extraCategoriesLoading: true,
        programs: [],
      },
      global: {
        stubs: {
          BannerCarousel: BannerStub,
          DjProgramSection: DjStub,
          DjRadioRankSection: RankStub,
        },
      },
    })
    expect(loading.get('[data-testid="dj-extra-cats-loading"]').text()).toContain(
      '正在加载更多分类',
    )

    const empty = mount(DjHallView, {
      props: { banners: [], programs: [] },
      global: {
        stubs: {
          BannerCarousel: BannerStub,
          DjProgramSection: DjStub,
          DjRadioRankSection: RankStub,
        },
      },
    })
    expect(empty.get('[data-testid="dj-extra-cats-empty"]').text()).toContain(
      '暂无更多分类',
    )
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
