// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjRadioRankSection from '@/components/music/DjRadioRankSection.vue'

const radio = {
  djName: '林间主播',
  id: 801,
  name: '夜航电台',
  picUrl: 'https://images.example.com/radio.jpg',
  playCount: 12_000,
  rcmdText: '睡前故事',
}

const CardStub = defineComponent({
  name: 'DjRadioCard',
  props: ['radio'],
  template: '<article data-testid="dj-radio-card">{{ radio.name }}</article>',
})

function mountSection(
  props: Partial<{
    error: string | null
    loading: boolean
    radios: typeof radio[]
  }> = {},
) {
  return mount(DjRadioRankSection, {
    props: { error: null, loading: false, radios: [], ...props },
    global: { stubs: { DjRadioCard: CardStub } },
  })
}

describe('DjRadioRankSection', () => {
  it('renders loading, error/retry, empty and cards', async () => {
    const loading = mountSection({ loading: true })
    expect(
      loading.get('[data-testid="dj-radio-toplist-loading"]').attributes('aria-busy'),
    ).toBe('true')

    const failed = mountSection({ error: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('电台榜加载失败')
    await failed.get('[data-testid="dj-radio-toplist-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)

    expect(mountSection().get('[data-testid="dj-radio-toplist-empty"]').text()).toContain(
      '暂无电台榜',
    )

    const data = mountSection({ radios: [radio] })
    expect(data.get('#dj-radio-toplist-title').text()).toBe('电台榜')
    expect(data.get('[data-testid="dj-radio-card"]').text()).toBe('夜航电台')
  })
})
