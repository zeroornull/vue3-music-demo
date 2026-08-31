// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getDjRadioDetail, getDjRadioPrograms } from '@/api/dj'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import DjRadioView from '@/views/DjRadioView.vue'

vi.mock('@/api/dj', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/dj')>()
  return {
    ...actual,
    getDjRadioDetail: vi.fn(),
    getDjRadioPrograms: vi.fn(),
  }
})

const radio = {
  category: '音乐故事',
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
    vi.mocked(getDjRadioDetail).mockResolvedValue(radio)
    vi.mocked(getDjRadioPrograms).mockResolvedValue({ more: false, programs })
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
})
