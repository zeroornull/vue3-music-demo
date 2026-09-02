// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import NewSongCard from '@/components/discover/NewSongCard.vue'
import type { PersonalizedNewSong } from '@/models/newSong'
import { Pages } from '@/router/pages'

const RouterLinkStub = defineComponent({
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
})

const newSong: PersonalizedNewSong = {
  alg: 'featured',
  canDislike: false,
  id: 301,
  name: '晚风来信',
  picUrl: 'https://images.example.com/song.jpg',
  song: {
    album: { id: 501, name: '晚风来信', picUrl: 'https://images.example.com/album.jpg' },
    artists: [
      { id: 401, name: '林间电台' },
      { id: 402, name: '海岸信号' },
    ],
    id: 301,
    name: '晚风来信',
  },
  type: 4,
}

function mountCard(item: PersonalizedNewSong = newSong) {
  return mount(NewSongCard, {
    props: { item },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('NewSongCard', () => {
  it('renders song, artists and album metadata', () => {
    const wrapper = mountCard()

    expect(wrapper.get('img').attributes('alt')).toBe('晚风来信')
    expect(wrapper.text()).toContain('晚风来信')
    expect(wrapper.text()).toContain('林间电台 / 海岸信号')
    expect(wrapper.text()).toContain('专辑：晚风来信')
    expect(wrapper.text()).toContain('播放')
  })

  it('emits a typed song selection', async () => {
    const wrapper = mountCard()
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted<PersonalizedNewSong[]>('select')?.[0]?.[0]).toEqual(newSong)
  })

  it('renders an unknown-artist fallback', () => {
    const wrapper = mountCard({ ...newSong, song: { ...newSong.song, artists: [] } })
    expect(wrapper.text()).toContain('未知歌手')
  })

  it('links a positive song mv without selecting the card', async () => {
    const wrapper = mountCard({
      ...newSong,
      song: { ...newSong.song, mv: 701 },
    })
    const mv = wrapper.get('[data-testid="song-mv"]')
    expect(mv.text()).toBe('MV')
    expect(mv.attributes('aria-label')).toBe('打开 MV：晚风来信')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: Pages.mvDetail,
      query: { id: 701 },
    })
    await mv.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('hides the MV link when the nested song has no mv', () => {
    expect(mountCard().find('[data-testid="song-mv"]').exists()).toBe(false)
  })

  it('hides the MV link when nested mv is zero', () => {
    expect(
      mountCard({ ...newSong, song: { ...newSong.song, mv: 0 } })
        .find('[data-testid="song-mv"]')
        .exists(),
    ).toBe(false)
  })
})
