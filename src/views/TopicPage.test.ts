// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getHotwallComments, getTopicDetail, getTopicHotEvents } from '@/api/topic'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import TopicPage from '@/views/TopicPage.vue'

vi.mock('@/api/topic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/topic')>()
  return {
    ...actual,
    getHotwallComments: vi.fn(),
    getTopicDetail: vi.fn(),
    getTopicHotEvents: vi.fn(),
  }
})

const detail = {
  coverUrl: '',
  desc: '林间夜谈',
  id: 21,
  name: '林间话题',
  participateCount: 12,
}
const event = { content: '走过林间。', id: 31, picUrl: '', userName: '林间电台' }
const wall = { content: '云村热评', id: 41, likedCount: 8, nickname: '海岸信号' }

const TopicViewStub = defineComponent({
  name: 'TopicView',
  props: ['detail', 'detailError', 'events', 'eventsError', 'wall', 'wallError'],
  emits: ['retry-detail', 'retry-events', 'retry-wall'],
  template: `
    <section>
      <span data-testid="detail-name">{{ detail && detail.name }}</span>
      <span v-if="detailError" data-testid="detail-error">{{ detailError }}</span>
      <span data-testid="event-count">{{ events.length }}</span>
      <span data-testid="wall-count">{{ wall.length }}</span>
      <button data-testid="page-retry-detail" @click="$emit('retry-detail')">retry</button>
    </section>
  `,
})

describe('TopicPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getTopicDetail).mockReset()
    vi.mocked(getTopicHotEvents).mockReset()
    vi.mocked(getHotwallComments).mockReset()
    vi.mocked(getTopicDetail).mockResolvedValue(detail)
    vi.mocked(getTopicHotEvents).mockResolvedValue([event])
    vi.mocked(getHotwallComments).mockResolvedValue([wall])
  })

  it('loads the actId query and retries detail independently', async () => {
    vi.mocked(getTopicDetail)
      .mockRejectedValueOnce(new Error('detail offline'))
      .mockResolvedValueOnce(detail)
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.topic, query: { actId: '21' } })
    const wrapper = mount(TopicPage, {
      global: {
        plugins: [pinia, router],
        stubs: { TopicView: TopicViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="detail-error"]').text()).toBe('detail offline')
    expect(wrapper.get('[data-testid="event-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="wall-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-retry-detail"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="detail-name"]').text()).toBe('林间话题')
  })

  it('rewrites a dragon-ball id query onto canonical actId', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.topic, query: { id: '21' } })
    mount(TopicPage, {
      global: {
        plugins: [pinia, router],
        stubs: { TopicView: TopicViewStub },
      },
    })
    await flushPromises()
    expect(getTopicDetail).toHaveBeenCalledWith(21)
    expect(router.currentRoute.value.query).toEqual({ actId: '21' })
  })

  it('rewrites id onto actId when the query changes on the same page', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.topic, query: { actId: '21' } })
    mount(TopicPage, {
      global: {
        plugins: [pinia, router],
        stubs: { TopicView: TopicViewStub },
      },
    })
    await flushPromises()
    await router.push({ name: Pages.topic, query: { id: '22' } })
    await flushPromises()
    expect(getTopicDetail).toHaveBeenCalledWith(22)
    expect(router.currentRoute.value.query).toEqual({ actId: '22' })
  })
})
