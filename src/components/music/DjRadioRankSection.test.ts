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
    emptyTitle: string
    error: string | null
    loading: boolean
    radios: typeof radio[]
    testid: string
    title: string
  }> = {},
) {
  return mount(DjRadioRankSection, {
    props: { error: null, loading: false, radios: [], ...props },
    global: { stubs: { DjRadioCard: CardStub } },
  })
}

describe('DjRadioRankSection', () => {
  it('namespaces ranking testids', () => {
    const wrapper = mountSection({
      emptyTitle: '暂无精选电台',
      testid: 'dj-recommend',
      title: '精选电台',
    })
    expect(wrapper.get('#dj-recommend-title').text()).toBe('精选电台')
    expect(wrapper.get('[data-testid="dj-recommend-empty"]').text()).toContain(
      '暂无精选电台',
    )
  })

  it('keeps loading and retry testids distinct when two ranks mount', async () => {
    const Dual = defineComponent({
      components: { DjRadioRankSection },
      template: `
        <div>
          <DjRadioRankSection
            empty-title="暂无精选电台"
            error-title="精选电台加载失败"
            testid="dj-recommend"
            title="精选电台"
            :error="recommendError"
            :loading="recommendLoading"
            :radios="[]"
          />
          <DjRadioRankSection :error="null" :loading="true" :radios="[]" />
        </div>
      `,
      data: () => ({ recommendError: null as string | null, recommendLoading: true }),
    })
    const wrapper = mount(Dual, {
      global: { stubs: { DjRadioCard: CardStub } },
    })
    expect(
      wrapper.get('[data-testid="dj-recommend-loading"]').attributes('aria-busy'),
    ).toBe('true')
    expect(
      wrapper.get('[data-testid="dj-radio-toplist-loading"]').attributes('aria-busy'),
    ).toBe('true')
    expect(wrapper.find('[data-testid="dj-recommend-retry"]').exists()).toBe(false)

    await wrapper.setData({ recommendLoading: false, recommendError: 'offline' })
    expect(wrapper.find('[data-testid="dj-recommend-loading"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="dj-recommend-retry"]').text()).toBe('重新加载')
    expect(
      wrapper.get('[data-testid="dj-radio-toplist-loading"]').attributes('aria-busy'),
    ).toBe('true')
    expect(wrapper.find('[data-testid="dj-radio-toplist-retry"]').exists()).toBe(false)
  })

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
