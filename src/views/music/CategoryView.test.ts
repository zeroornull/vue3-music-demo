// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CategoryView from '@/views/music/CategoryView.vue'

const playlist = {
  coverImgUrl: 'https://images.example.com/cat.jpg',
  creator: { nickname: '林间电台' },
  id: 501,
  name: '深夜民谣',
  playCount: 88_000,
}

const TagStub = defineComponent({
  name: 'CategoryTagBar',
  props: ['selected', 'tags'],
  emits: ['select'],
  template:
    '<button data-testid="tag" @click="$emit(\'select\', \'华语\')">tag</button>',
})

const CardStub = defineComponent({
  name: 'CategoryPlaylistCard',
  props: ['playlist'],
  template: '<article data-testid="category-card">{{ playlist.name }}</article>',
})

function mountView(
  props: Partial<{
    cat: string
    error: string | null
    loading: boolean
    more: boolean
    playlists: typeof playlist[]
    tags: { id: number; name: string }[]
  }> = {},
) {
  return mount(CategoryView, {
    props: {
      cat: '全部',
      error: null,
      loading: false,
      more: false,
      playlists: [],
      tags: [],
      ...props,
    },
    global: {
      stubs: {
        CategoryPlaylistCard: CardStub,
        CategoryTagBar: TagStub,
      },
    },
  })
}

describe('CategoryView', () => {
  it('renders loading, error/retry, empty, cards and load more', async () => {
    const loading = mountView({ loading: true })
    expect(
      loading.get('[data-testid="category-loading"]').attributes('aria-busy'),
    ).toBe('true')

    const failed = mountView({ error: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    await failed.get('[data-testid="category-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)

    expect(mountView().get('[data-testid="category-empty"]').text()).toContain(
      '暂无该分类歌单',
    )

    const data = mountView({ more: true, playlists: [playlist] })
    expect(data.get('[data-testid="category-card"]').text()).toBe('深夜民谣')
    expect(data.text()).toContain('全部歌单')
    await data.get('[data-testid="category-load-more"]').trigger('click')
    expect(data.emitted('load-more')).toHaveLength(1)

    const moreFailed = mountView({
      error: 'more failed',
      more: true,
      playlists: [playlist],
    })
    expect(moreFailed.get('[role="alert"]').text()).toContain('more failed')
    expect(moreFailed.get('[data-testid="category-card"]').text()).toBe(
      '深夜民谣',
    )
    await moreFailed.get('[data-testid="category-more-retry"]').trigger('click')
    expect(moreFailed.emitted('load-more')).toHaveLength(1)

    await data.get('[data-testid="tag"]').trigger('click')
    expect(data.emitted('select-cat')?.[0]).toEqual(['华语'])
  })
})
