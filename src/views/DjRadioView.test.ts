// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDjRadioCommentPage } from '@/api/comment'
import {
  getDjRadioDetail,
  getDjRadioPrograms,
  getDjRadioSubscriberPage,
  getHotDjRadios,
} from '@/api/dj'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import DjRadioView from '@/views/DjRadioView.vue'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getDjCommentPage: vi.fn(),
  getDjHotComments: vi.fn(),
  getDjRadioCommentPage: vi.fn(),
}))

vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjRadioDetail: vi.fn(),
    getDjRadioPrograms: vi.fn(),
    getDjRadioSubscriberPage: vi.fn(),
    getHotDjRadios: vi.fn(),
  }
})

const radio = {
  category: '音乐故事',
  categoryId: 2,
  desc: '夜航第一季。<img src=x>',
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
}

const programs = [
  {
    copywriter: '夜航电台',
    id: 901,
    name: '深夜民谣',
    picUrl: 'https://images.example.com/ep.jpg',
  },
]

async function mountView(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.djRadio, query })
  return mount(DjRadioView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        RouterLink: defineComponent({
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        }),
      },
    },
  })
}

describe('DjRadioView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getDjRadioDetail).mockReset()
    vi.mocked(getDjRadioPrograms).mockReset()
    vi.mocked(getHotDjRadios).mockReset()
    vi.mocked(getDjRadioDetail).mockResolvedValue(radio)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs })
    vi.mocked(getHotDjRadios).mockRejectedValue(new Error('no radios'))
    vi.mocked(getDjRadioCommentPage).mockReset()
    vi.mocked(getDjRadioCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getDjRadioSubscriberPage).mockReset()
    vi.mocked(getDjRadioSubscriberPage).mockRejectedValue(
      new Error('no subscribers'),
    )
  })

  it('shows a missing-id empty state', async () => {
    const wrapper = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="dj-radio-missing"]').text()).toContain('缺少电台 ID')
    expect(getDjRadioDetail).not.toHaveBeenCalled()
  })

  it('loads a radio and lists programs as text', async () => {
    const wrapper = await mountView({ id: '801' })
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('夜航电台')
    expect(wrapper.text()).toContain('夜航第一季。<img src=x>')
    expect(wrapper.find('img[src="x"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('深夜民谣')
    const programLink = wrapper
      .findAll('a')
      .find((link) => link.text().includes('深夜民谣'))
    expect(JSON.parse(programLink?.attributes('data-to') || '{}')).toMatchObject({
      name: Pages.dj,
      query: { id: 901 },
    })
  })

  it('renders more radio cards without blocking programs', async () => {
    vi.mocked(getHotDjRadios).mockResolvedValue({
      more: false,
      radios: [
        {
          djName: '海岸主播',
          id: 802,
          name: '潮汐电台',
          picUrl: 'https://images.example.com/radio2.jpg',
          playCount: 8_000,
          rcmdText: '潮汐故事',
        },
      ],
    })
    const wrapper = await mountView({ id: '801' })
    await flushPromises()

    expect(wrapper.text()).toContain('深夜民谣')
    const related = wrapper.get('[data-testid="related-radios"]')
    expect(related.get('[data-testid="dj-radio-card"]').text()).toContain('潮汐电台')
    expect(related.get('[aria-label="打开电台：潮汐电台"]').attributes('data-to')).toBe(
      JSON.stringify({ name: Pages.djRadio, query: { id: 802 } }),
    )
  })

  it('hides more radios when the list is empty', async () => {
    vi.mocked(getHotDjRadios).mockResolvedValue({ more: false, radios: [] })
    const wrapper = await mountView({ id: '801' })
    await flushPromises()

    expect(wrapper.find('[data-testid="related-radios"]').exists()).toBe(false)
  })

  it('renders radio comments without blocking programs or linking the author', async () => {
    vi.mocked(getDjRadioCommentPage).mockResolvedValue({
      comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
      more: false,
    })
    const wrapper = await mountView({ id: '801' })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('夜航电台')
    expect(wrapper.text()).toContain('深夜民谣')
    const comments = wrapper.get('[data-testid="dj-radio-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.get('strong').text()).toBe('林间电台')
    expect(comments.find('a').exists()).toBe(false)
  })

  it('shows an empty radio comments state when the list is empty', async () => {
    vi.mocked(getDjRadioCommentPage).mockResolvedValue({ comments: [], more: false })
    const wrapper = await mountView({ id: '801' })
    await flushPromises()
    expect(wrapper.get('[data-testid="dj-radio-comments"]').text()).toContain(
      '暂无评论',
    )
  })

  it('hides radio comments when the request fails', async () => {
    const wrapper = await mountView({ id: '801' })
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('夜航电台')
    expect(wrapper.find('[data-testid="dj-radio-comments"]').exists()).toBe(false)
  })

  it('loads more radio comments without dropping the first page', async () => {
    vi.mocked(getDjRadioCommentPage)
      .mockResolvedValueOnce({
        comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
        more: true,
      })
      .mockResolvedValueOnce({
        comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
        more: false,
      })
    const wrapper = await mountView({ id: '801' })
    await flushPromises()

    expect(wrapper.get('[data-testid="dj-radio-comments-more"]').text()).toBe(
      '加载更多评论',
    )
    await wrapper.get('[data-testid="dj-radio-comments-more"]').trigger('click')
    await flushPromises()

    expect(getDjRadioCommentPage).toHaveBeenNthCalledWith(2, 801, 20)
    const comments = wrapper.get('[data-testid="dj-radio-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.text()).toContain('第二页')
    expect(wrapper.find('[data-testid="dj-radio-comments-more"]').exists()).toBe(
      false,
    )
  })

  it('renders radio subscribers without blocking programs', async () => {
    vi.mocked(getDjRadioSubscriberPage).mockResolvedValue({
      more: true,
      subscribers: [
        {
          avatarUrl: 'https://images.example.com/user.jpg',
          nickname: '林间电台',
          userId: 8,
        },
      ],
      time: 77,
    })
    const wrapper = await mountView({ id: '801' })
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('夜航电台')
    expect(wrapper.text()).toContain('深夜民谣')
    const block = wrapper.get('[data-testid="dj-radio-subscribers"]')
    expect(block.text()).toContain('林间电台')
    expect(block.find('a').exists()).toBe(false)
    expect(wrapper.get('[data-testid="dj-radio-subscribers-more"]').text()).toBe(
      '加载更多订阅者',
    )
  })

  it('loads more radio subscribers without dropping the first page', async () => {
    vi.mocked(getDjRadioSubscriberPage)
      .mockResolvedValueOnce({
        more: true,
        subscribers: [{ nickname: '林间电台', userId: 8 }],
        time: 77,
      })
      .mockResolvedValueOnce({
        more: false,
        subscribers: [{ nickname: '夜航乐队', userId: 21 }],
        time: 88,
      })
    const wrapper = await mountView({ id: '801' })
    await flushPromises()
    await wrapper.get('[data-testid="dj-radio-subscribers-more"]').trigger('click')
    await flushPromises()
    const block = wrapper.get('[data-testid="dj-radio-subscribers"]')
    expect(block.text()).toContain('林间电台')
    expect(block.text()).toContain('夜航乐队')
    expect(wrapper.find('[data-testid="dj-radio-subscribers-more"]').exists()).toBe(
      false,
    )
  })

  it('hides radio subscribers when the request fails', async () => {
    const wrapper = await mountView({ id: '801' })
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('夜航电台')
    expect(wrapper.find('[data-testid="dj-radio-subscribers"]').exists()).toBe(false)
  })
})
