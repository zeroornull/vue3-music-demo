// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getTopLists } from '@/api/toplist'
import TopListPage from '@/views/music/TopListPage.vue'

vi.mock('@/api/toplist', () => ({
  getTopLists: vi.fn(),
}))

const TopListStub = defineComponent({
  name: 'TopListView',
  props: ['error', 'loading', 'topLists'],
  emits: ['retry'],
  template: `
    <section data-testid="toplist-page">
      <span data-testid="toplist-count">{{ topLists.length }}</span>
      <span v-if="error" data-testid="toplist-error">{{ error }}</span>
      <button data-testid="page-retry" @click="$emit('retry')">retry</button>
    </section>
  `,
})

const chart = {
  coverImgUrl: 'https://images.example.com/soar.jpg',
  id: 19723756,
  name: '飙升榜',
  playCount: 10,
  tracks: [],
  updateFrequency: '',
}

describe('TopListPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getTopLists).mockReset()
    vi.mocked(getTopLists).mockResolvedValue([chart])
  })

  it('loads charts and retries a failed request', async () => {
    vi.mocked(getTopLists)
      .mockRejectedValueOnce(new Error('toplist offline'))
      .mockResolvedValueOnce([chart])

    const wrapper = mount(TopListPage, {
      global: { stubs: { TopListView: TopListStub } },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="toplist-error"]').text()).toBe(
      'toplist offline',
    )

    await wrapper.get('[data-testid="page-retry"]').trigger('click')
    await flushPromises()

    expect(getTopLists).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="toplist-count"]').text()).toBe('1')
  })
})
