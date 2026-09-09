// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import NewestAlbumSection from '@/components/discover/NewestAlbumSection.vue'

const album = {
  artist: { id: 401, name: '林间电台' },
  id: 501,
  name: '夜航',
  picUrl: 'https://images.example.com/album.jpg',
  publishTime: 1_609_459_200_000,
}

const NewestAlbumCardStub = defineComponent({
  name: 'NewestAlbumCard',
  props: ['album'],
  template: '<article data-testid="newest-album-card">{{ album.name }}</article>',
})

function mountSection(
  props: Partial<{
    albums: typeof album[]
    error: string | null
    loading: boolean
  }> = {},
) {
  return mount(NewestAlbumSection, {
    props: {
      albums: [],
      error: null,
      loading: false,
      ...props,
    },
    global: { stubs: { NewestAlbumCard: NewestAlbumCardStub } },
  })
}

describe('NewestAlbumSection', () => {
  it('renders four loading placeholders', () => {
    const wrapper = mountSection({ loading: true })
    expect(wrapper.get('[data-testid="newest-album-loading"]').attributes('aria-busy')).toBe(
      'true',
    )
    expect(wrapper.findAll('[data-testid="newest-album-skeleton"]')).toHaveLength(4)
  })

  it('renders an error and emits retry', async () => {
    const wrapper = mountSection({ error: 'offline' })
    expect(wrapper.get('[role="alert"]').text()).toContain('offline')
    await wrapper.get('[data-testid="newest-album-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders an explicit empty state', () => {
    const wrapper = mountSection()
    expect(wrapper.get('[data-testid="newest-album-empty"]').text()).toContain('暂无新碟')
  })

  it('limits the list to ten albums', () => {
    const albums = Array.from({ length: 12 }, (_, index) => ({
      ...album,
      id: index + 1,
      name: `新碟 ${index + 1}`,
    }))
    const wrapper = mountSection({ albums })
    expect(wrapper.findAll('[data-testid="newest-album-card"]')).toHaveLength(10)
    expect(wrapper.get('h2').text()).toBe('新碟上架')
  })
})
