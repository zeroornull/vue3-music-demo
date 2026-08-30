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
})
