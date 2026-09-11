// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDjCommentPage, getDjHotComments } from '@/api/comment'
import { getDjCommentFloor } from '@/api/commentFloor'
import { getDjProgramDetail, getDjRadioPrograms } from '@/api/dj'

vi.mock('@/views/music/DjHallPage.vue', () => ({
  default: { name: 'DjHallPage', template: '<div data-testid="dj-hall-stub" />' },
}))
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useDjStore } from '@/stores/dj'
import DjView from '@/views/DjView.vue'

vi.mock('@/api/comment', () => ({
  COMMENT_LIMIT: 20,
  getDjCommentPage: vi.fn(),
  getDjHotComments: vi.fn(),
}))
vi.mock('@/api/commentFloor', () => ({
  COMMENT_FLOOR_LIMIT: 10,
  COMMENT_FLOOR_TYPE: { dj: 4, mv: 1, playlist: 2, song: 0, video: 5 },
  getDjCommentFloor: vi.fn(),
  getMvCommentFloor: vi.fn(),
  getPlaylistCommentFloor: vi.fn(),
  getSongCommentFloor: vi.fn(),
  getVideoCommentFloor: vi.fn(),
}))

vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjProgramDetail: vi.fn(),
    getDjRadioPrograms: vi.fn(),
    getPersonalizedDjPrograms: vi.fn(),
  }
})

const playSong = vi.fn().mockResolvedValue(true)
vi.mock('@/stores/player', () => ({
  usePlayerStore: () => ({
    current: null,
    error: null,
    play: playSong,
  }),
}))

const detail = {
  coverUrl: 'https://images.example.com/dj-cover.jpg',
  description: '林间电台的深夜节目。',
  djName: '林间主播',
  duration: 180_000,
  id: 901,
  listenerCount: 1280,
  name: '深夜民谣',
  radioId: 801,
  radioName: '林间电台',
  song: {
    artists: [{ id: 401, name: '林间电台' }],
    duration: 180_000,
    id: 301,
    name: '晚风来信',
  },
}

const HeaderStub = defineComponent({
  name: 'DjProgramHeader',
  props: ['program', 'playable'],
  emits: ['play'],
  template: `
    <header>
      <h1>{{ program.name }}</h1>
      <button data-testid="play-program" @click="$emit('play')">play</button>
    </header>
  `,
})

async function mountView(query: Record<string, string> = { id: '901' }) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.dj, query })
  const wrapper = mount(DjView, {
    global: {
      plugins: [pinia, router],
      stubs: {
        DjProgramHeader: HeaderStub,
        RouterLink: defineComponent({
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        }),
      },
    },
  })
  return { router, wrapper }
}

describe('DjView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    playSong.mockClear()
    vi.mocked(getDjProgramDetail).mockReset()
    vi.mocked(getDjProgramDetail).mockResolvedValue(detail)
    vi.mocked(getDjRadioPrograms).mockReset()
    vi.mocked(getDjRadioPrograms).mockRejectedValue(new Error('no programs'))
    vi.mocked(getDjCommentPage).mockReset()
    vi.mocked(getDjCommentPage).mockRejectedValue(new Error('no comments'))
    vi.mocked(getDjHotComments).mockReset()
    vi.mocked(getDjHotComments).mockRejectedValue(new Error('no hot comments'))
    vi.mocked(getDjCommentFloor).mockReset()
    vi.mocked(getDjCommentFloor).mockRejectedValue(new Error('no floor'))
  })

  it('redirects a missing program id to the radio hall', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.dj })
    const replace = vi.spyOn(router, 'replace')
    mount(
      { template: '<RouterView />' },
      { global: { plugins: [pinia, router] } },
    )
    await flushPromises()

    expect(replace).toHaveBeenCalledWith({ name: Pages.djHall })
    await replace.mock.results.at(-1)?.value
    expect(router.currentRoute.value.name).toBe(Pages.djHall)
    expect(router.currentRoute.value.path).toBe('/music/dj')
    expect(getDjProgramDetail).not.toHaveBeenCalled()
  })

  it('does not wipe recommended programs when the detail id is missing', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useDjStore()
    store.programs = [
      {
        copywriter: '',
        id: 901,
        name: '深夜民谣',
        picUrl: 'https://images.example.com/dj.jpg',
      },
    ]
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.dj })
    mount(DjView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          DjProgramHeader: HeaderStub,
          RouterLink: defineComponent({
            props: ['to'],
            template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
          }),
        },
      },
    })
    await flushPromises()

    expect(store.programs).toHaveLength(1)
    expect(store.program).toBeNull()
  })

  it('loads the program, retries and plays the main song', async () => {
    vi.mocked(getDjProgramDetail).mockRejectedValueOnce(new Error('dj offline'))

    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('dj offline')

    await wrapper.get('[data-testid="dj-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('深夜民谣')

    await wrapper.get('[data-testid="play-program"]').trigger('click')
    await flushPromises()
    expect(playSong).toHaveBeenCalledWith(detail.song)
    expect(wrapper.get('[role="status"]').text()).toContain('正在播放“晚风来信”。')
  })

  it('does not play a paid program', async () => {
    vi.mocked(getDjProgramDetail).mockResolvedValue({ ...detail, paid: true })
    const { wrapper } = await mountView()
    await flushPromises()
    await wrapper.get('[data-testid="play-program"]').trigger('click')
    await flushPromises()
    expect(playSong).not.toHaveBeenCalled()
  })

  it('renders more program cards without blocking play', async () => {
    vi.mocked(getDjRadioPrograms).mockResolvedValue({
      more: false,
      programs: [
        {
          copywriter: '潮汐电台',
          id: 902,
          name: '潮汐夜话',
          picUrl: 'https://images.example.com/ep2.jpg',
        },
      ],
    })
    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('深夜民谣')
    const related = wrapper.get('[data-testid="related-programs"]')
    expect(related.get('[data-testid="dj-card"]').text()).toContain('潮汐夜话')
    expect(related.get('[aria-label="打开电台节目：潮汐夜话"]').attributes('data-to')).toBe(
      JSON.stringify({ name: Pages.dj, query: { id: 902 } }),
    )
  })

  it('hides more programs when the list is empty', async () => {
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs: [] })
    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.find('[data-testid="related-programs"]').exists()).toBe(false)
  })

  it('renders comments without blocking play or linking the author', async () => {
    vi.mocked(getDjCommentPage).mockResolvedValue({
      comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
      more: false,
    })
    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('深夜民谣')
    const comments = wrapper.get('[data-testid="dj-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.get('strong').text()).toBe('林间电台')
    expect(comments.find('a').exists()).toBe(false)
  })

  it('shows an empty comments state when the list is empty', async () => {
    vi.mocked(getDjCommentPage).mockResolvedValue({ comments: [], more: false })
    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="dj-comments"]').text()).toContain('暂无评论')
  })

  it('hides comments when the request fails', async () => {
    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.find('[data-testid="dj-comments"]').exists()).toBe(false)
  })

  it('loads more comments without dropping the first page', async () => {
    vi.mocked(getDjCommentPage)
      .mockResolvedValueOnce({
        comments: [{ commentId: 1, content: '走过林间。', nickname: '林间电台' }],
        more: true,
      })
      .mockResolvedValueOnce({
        comments: [{ commentId: 21, content: '第二页', nickname: '夜航乐队' }],
        more: false,
      })
    const { wrapper } = await mountView()
    await flushPromises()

    expect(wrapper.get('[data-testid="dj-comments-more"]').text()).toBe('加载更多评论')
    await wrapper.get('[data-testid="dj-comments-more"]').trigger('click')
    await flushPromises()

    expect(getDjCommentPage).toHaveBeenNthCalledWith(2, 901, 20)
    const comments = wrapper.get('[data-testid="dj-comments"]')
    expect(comments.text()).toContain('走过林间。')
    expect(comments.text()).toContain('第二页')
    expect(wrapper.find('[data-testid="dj-comments-more"]').exists()).toBe(false)
  })

  it('loads and retries DJ hot comments without blocking play', async () => {
    vi.mocked(getDjHotComments)
      .mockRejectedValueOnce(new Error('hot offline'))
      .mockResolvedValueOnce([
        { commentId: 9, content: '林间热评', nickname: '林间电台' },
      ])
    const { wrapper } = await mountView()
    await flushPromises()
    expect(wrapper.get('[data-testid="dj-hot-comments-error"]').text()).toContain(
      '电台节目热门评论加载失败',
    )
    expect(wrapper.get('h1').text()).toBe('深夜民谣')
    await wrapper.get('[data-testid="dj-hot-comments-retry"]').trigger('click')
    await flushPromises()
    expect(getDjHotComments).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="dj-hot-comments"]').text()).toContain('林间热评')
  })

  it('expands DJ comment floors', async () => {
    vi.mocked(getDjCommentPage).mockResolvedValue({
      comments: [
        {
          commentId: 11,
          content: '走过林间。',
          nickname: '林间电台',
          replyCount: 2,
        },
      ],
      more: false,
    })
    vi.mocked(getDjCommentFloor).mockResolvedValue([
      { commentId: 91, content: '楼中回复', nickname: '海岸信号' },
    ])
    const { wrapper } = await mountView()
    await flushPromises()
    await wrapper.get('[data-testid="dj-comments-floor"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="dj-comments"]').text()).toContain('楼中回复')
    expect(getDjCommentFloor).toHaveBeenCalledWith(901, 11)
  })
})
