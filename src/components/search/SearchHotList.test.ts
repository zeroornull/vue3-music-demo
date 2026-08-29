// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SearchHotList from '@/components/search/SearchHotList.vue'

const hots = [
  { content: '深夜写歌', score: 98000, searchWord: '深夜民谣' },
  { content: '', score: 1, searchWord: '秋日电台' },
]

function mountList(
  props: Partial<{
    error: string | null
    hots: typeof hots
    loading: boolean
  }> = {},
) {
  return mount(SearchHotList, {
    props: { error: null, hots: [], loading: false, ...props },
  })
}

describe('SearchHotList', () => {
  it('renders loading, error/retry, empty and hot words', async () => {
    const loading = mountList({ loading: true })
    expect(
      loading.get('[data-testid="search-hot-loading"]').attributes('aria-busy'),
    ).toBe('true')

    const failed = mountList({ error: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    await failed.get('[data-testid="search-hot-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)

    expect(mountList().get('[data-testid="search-hot-empty"]').text()).toContain(
      '暂无热门搜索',
    )

    const data = mountList({ hots })
    expect(data.get('h2').text()).toBe('热门搜索')
    await data.get('[data-testid="search-hot-word"]').trigger('click')
    expect(data.emitted('select')?.[0]).toEqual(['深夜民谣'])
  })
})
