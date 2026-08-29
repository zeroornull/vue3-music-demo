// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createMemoryHistory } from 'vue-router'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import MusicView from '@/views/music/MusicView.vue'

const RouterViewStub = defineComponent({
  name: 'RouterView',
  template: '<div data-testid="music-outlet" />',
})

async function mountMusic(name: string = Pages.toplist) {
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name })
  return mount(MusicView, {
    global: {
      plugins: [router],
      stubs: { RouterView: RouterViewStub },
    },
  })
}

describe('MusicView', () => {
  it('renders music-hall navigation and marks the current tab', async () => {
    const wrapper = await mountMusic(Pages.toplist)

    expect(wrapper.get('h1').text()).toBe('音乐馆')
    const links = wrapper.findAll('.hall-nav a')
    expect(links.map((link) => link.text())).toEqual([
      '精选',
      '排行',
      '歌手',
      '分类歌单',
    ])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('排行')
    expect(wrapper.get('.summary').text()).toBe(
      '精选、排行榜、分类歌单和歌手详情已接入；歌手馆仍是明确边界。',
    )
  })
})
