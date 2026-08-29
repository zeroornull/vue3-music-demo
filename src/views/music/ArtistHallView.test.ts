// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistHallView from '@/views/music/ArtistHallView.vue'

const artist = {
  id: 401,
  img1v1Url: 'https://images.example.com/a.jpg',
  name: '林间电台',
}

const AreaStub = defineComponent({
  name: 'ArtistAreaBar',
  props: ['selected'],
  emits: ['select'],
  template:
    '<button data-testid="area" @click="$emit(\'select\', 7)">area</button>',
})

const CardStub = defineComponent({
  name: 'ArtistHallCard',
  props: ['artist'],
  template: '<article data-testid="artist-card">{{ artist.name }}</article>',
})

function mountView(
  props: Partial<{
    area: number
    artists: typeof artist[]
    error: string | null
    loading: boolean
    more: boolean
  }> = {},
) {
  return mount(ArtistHallView, {
    props: {
      area: -1,
      artists: [],
      error: null,
      loading: false,
      more: false,
      ...props,
    },
    global: {
      stubs: {
        ArtistAreaBar: AreaStub,
        ArtistHallCard: CardStub,
      },
    },
  })
}

describe('ArtistHallView', () => {
  it('renders loading, error/retry, empty, cards and load more', async () => {
    const loading = mountView({ loading: true })
    expect(
      loading.get('[data-testid="artist-hall-loading"]').attributes('aria-busy'),
    ).toBe('true')

    const failed = mountView({ error: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    await failed.get('[data-testid="artist-hall-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)

    expect(mountView().get('[data-testid="artist-hall-empty"]').text()).toContain(
      '暂无歌手',
    )

    const data = mountView({ more: true, artists: [artist] })
    expect(data.get('h2').text()).toBe('全部歌手')
    expect(data.get('[data-testid="artist-card"]').text()).toBe('林间电台')
    await data.get('[data-testid="artist-hall-load-more"]').trigger('click')
    expect(data.emitted('load-more')).toHaveLength(1)

    await data.get('[data-testid="area"]').trigger('click')
    expect(data.emitted('select-area')?.[0]).toEqual([7])

    const moreFailed = mountView({
      artists: [artist],
      error: 'more failed',
      more: true,
    })
    expect(moreFailed.get('[role="alert"]').text()).toContain('加载更多失败')
    await moreFailed.get('[data-testid="artist-hall-more-retry"]').trigger('click')
    expect(moreFailed.emitted('load-more')).toHaveLength(1)
  })
})
