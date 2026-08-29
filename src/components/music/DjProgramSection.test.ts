// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DjProgramSection from '@/components/music/DjProgramSection.vue'

const program = {
  copywriter: '睡前电台',
  id: 901,
  name: '深夜民谣',
  picUrl: 'https://images.example.com/dj.jpg',
}

const CardStub = defineComponent({
  name: 'DjProgramCard',
  props: ['program'],
  template: '<article data-testid="dj-card">{{ program.name }}</article>',
})

function mountSection(
  props: Partial<{
    error: string | null
    programs: typeof program[]
    loading: boolean
  }> = {},
) {
  return mount(DjProgramSection, {
    props: { error: null, programs: [], loading: false, ...props },
    global: { stubs: { DjProgramCard: CardStub } },
  })
}

describe('DjProgramSection', () => {
  it('renders loading, error/retry, empty and cards', async () => {
    const loading = mountSection({ loading: true })
    expect(
      loading.get('[data-testid="dj-loading"]').attributes('aria-busy'),
    ).toBe('true')

    const failed = mountSection({ error: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    await failed.get('[data-testid="dj-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)

    expect(mountSection().get('[data-testid="dj-empty"]').text()).toContain(
      '暂无推荐电台',
    )

    const data = mountSection({ programs: [program] })
    expect(data.get('h2').text()).toBe('推荐电台')
    expect(data.get('[data-testid="dj-card"]').text()).toBe('深夜民谣')
  })
})
