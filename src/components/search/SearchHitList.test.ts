// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SearchHitList from '@/components/search/SearchHitList.vue'
import { Pages } from '@/router/pages'

const LinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="JSON.stringify(to)"><slot /></a>',
})

describe('SearchHitList', () => {
  it('renders titled hits that open the existing detail route', () => {
    const wrapper = mount(SearchHitList, {
      props: {
        hits: [
          {
            cover: 'https://images.example.com/p.jpg',
            id: 101,
            name: '深夜民谣',
          },
        ],
        kind: '歌单',
        title: '歌单',
        toName: Pages.playlist,
      },
      global: { stubs: { RouterLink: LinkStub } },
    })

    expect(wrapper.get('h2').text()).toBe('歌单')
    expect(wrapper.get('h2').attributes('id')).toBe('歌单-title')
    const link = wrapper.get('a')
    expect(link.attributes('aria-label')).toBe('打开歌单：深夜民谣')
    expect(link.attributes('href')).toContain('"name":"playlist"')
    expect(link.attributes('href')).toContain('"id":101')
    expect(link.text()).toContain('深夜民谣')
  })

  it('opens artist detail for singer hits', () => {
    const wrapper = mount(SearchHitList, {
      props: {
        hits: [{ cover: '', id: 401, name: '林间电台' }],
        kind: '歌手',
        title: '歌手',
        toName: Pages.artistDetail,
      },
      global: { stubs: { RouterLink: LinkStub } },
    })
    expect(wrapper.get('a').attributes('href')).toContain('"name":"artistDetail"')
    expect(wrapper.get('a').attributes('aria-label')).toBe('打开歌手：林间电台')
  })

  it('uses a per-hit route when provided', () => {
    const wrapper = mount(SearchHitList, {
      props: {
        hits: [
          {
            cover: '',
            id: 801,
            name: '林间播客',
            to: { name: Pages.voice, query: { listId: '801' } },
          },
        ],
        kind: '声音',
        title: '声音',
        toName: Pages.dj,
      },
      global: { stubs: { RouterLink: LinkStub } },
    })
    expect(wrapper.get('a').attributes('href')).toContain('"name":"voice"')
    expect(wrapper.get('a').attributes('href')).toContain('"listId":"801"')
  })

  it('opens album detail for album hits', () => {
    const wrapper = mount(SearchHitList, {
      props: {
        hits: [{ cover: '', id: 501, name: '夜航' }],
        kind: '专辑',
        title: '专辑',
        toName: Pages.album,
      },
      global: { stubs: { RouterLink: LinkStub } },
    })
    expect(wrapper.get('a').attributes('href')).toContain('"name":"album"')
    expect(wrapper.get('a').attributes('href')).toContain('"id":501')
    expect(wrapper.get('a').attributes('aria-label')).toBe('打开专辑：夜航')
  })

  it('opens video detail for string vid hits', () => {
    const wrapper = mount(SearchHitList, {
      props: {
        hits: [{ cover: '', id: 'VID001', name: '夜航现场' }],
        kind: '视频',
        title: '视频',
        toName: Pages.videoDetail,
      },
      global: { stubs: { RouterLink: LinkStub } },
    })
    expect(wrapper.get('a').attributes('href')).toContain('"name":"videoDetail"')
    expect(wrapper.get('a').attributes('href')).toContain('"id":"VID001"')
    expect(wrapper.get('a').attributes('aria-label')).toBe('打开视频：夜航现场')
  })

  it('uses an explicit heading id when provided', () => {
    const wrapper = mount(SearchHitList, {
      props: {
        headingId: 'search-best-playlist-title',
        hits: [{ cover: '', id: 101, name: '深夜民谣' }],
        kind: '歌单',
        title: '歌单',
        toName: Pages.playlist,
      },
      global: { stubs: { RouterLink: LinkStub } },
    })
    expect(wrapper.get('h2').attributes('id')).toBe('search-best-playlist-title')
    expect(wrapper.get('section').attributes('aria-labelledby')).toBe(
      'search-best-playlist-title',
    )
  })
})
