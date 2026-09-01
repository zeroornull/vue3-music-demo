// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDjProgramDetail } from '@/api/dj'

vi.mock('@/views/music/DjHallPage.vue', () => ({
  default: { name: 'DjHallPage', template: '<div data-testid="dj-hall-stub" />' },
}))
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import { useDjStore } from '@/stores/dj'
import DjView from '@/views/DjView.vue'

vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjProgramDetail: vi.fn(),
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
        RouterLink: defineComponent({ template: '<a><slot /></a>' }),
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
          RouterLink: defineComponent({ template: '<a><slot /></a>' }),
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
})
