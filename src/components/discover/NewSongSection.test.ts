// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import NewSongSection from '@/components/discover/NewSongSection.vue'

const newSong = {
  alg: 'featured',
  canDislike: false,
  id: 301,
  name: '晚风来信',
  picUrl: 'https://images.example.com/song.jpg',
  song: {
    album: { id: 501, name: '晚风来信', picUrl: 'https://images.example.com/album.jpg' },
    artists: [{ id: 401, name: '林间电台' }],
    id: 301,
    name: '晚风来信',
  },
  type: 4,
}

const NewSongCardStub = defineComponent({
  name: 'NewSongCard',
  props: ['item'],
  emits: ['select'],
  template: '<button data-testid="new-song-card" @click="$emit(\'select\', item)">{{ item.name }}</button>',
})

function mountSection(
  props: Partial<{
    error: string | null
    items: typeof newSong[]
    loading: boolean
  }> = {},
) {
  return mount(NewSongSection, {
    props: {
      error: null,
      items: [],
      loading: false,
      ...props,
    },
    global: { stubs: { NewSongCard: NewSongCardStub } },
  })
}

describe('NewSongSection', () => {
  it('renders six loading placeholders', () => {
    const wrapper = mountSection({ loading: true })
    expect(wrapper.get('[data-testid="new-song-loading"]').attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('[data-testid="new-song-skeleton"]')).toHaveLength(6)
  })

  it('renders an error and emits retry', async () => {
    const wrapper = mountSection({ error: 'offline' })
    expect(wrapper.get('[role="alert"]').text()).toContain('offline')

    await wrapper.get('[data-testid="new-song-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders an explicit empty state', () => {
    const wrapper = mountSection()
    expect(wrapper.get('[data-testid="new-song-empty"]').text()).toContain('暂无推荐新歌')
  })

  it('limits the list to ten songs and forwards selection', async () => {
    const items = Array.from({ length: 12 }, (_, index) => ({
      ...newSong,
      id: index + 1,
      name: `新歌 ${index + 1}`,
      song: { ...newSong.song, id: index + 1, name: `新歌 ${index + 1}` },
    }))
    const wrapper = mountSection({ items })

    const cards = wrapper.findAll('[data-testid="new-song-card"]')
    expect(cards).toHaveLength(10)
    await cards[0]?.trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[0]).toEqual(items[0])
  })
})
