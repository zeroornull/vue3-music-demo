// @vitest-environment happy-dom

import { createMemoryHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import MusicPlaceholderView from '@/views/music/MusicPlaceholderView.vue'

describe('MusicPlaceholderView', () => {
  it('names the pending music-hall tab and points to the live toplist', async () => {
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.artist })
    const wrapper = mount(MusicPlaceholderView, {
      global: { plugins: [router] },
    })

    expect(wrapper.get('h2').text()).toContain('歌手')
    expect(wrapper.text()).toContain('后续轮次迁移')
    expect(wrapper.get('[data-testid="toplist-shortcut"]').text()).toContain(
      '排行榜',
    )
    expect(wrapper.text()).toContain('精选')
  })
})
