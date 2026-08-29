// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import NewSongCard from '@/components/discover/NewSongCard.vue'
import type { PersonalizedNewSong } from '@/models/newSong'

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

describe('NewSongCard', () => {
  it('renders song, artists and album metadata', () => {
    const wrapper = mount(NewSongCard, { props: { item: newSong } })

    expect(wrapper.get('img').attributes('alt')).toBe('晚风来信')
    expect(wrapper.text()).toContain('晚风来信')
    expect(wrapper.text()).toContain('林间电台 / 海岸信号')
    expect(wrapper.text()).toContain('专辑：晚风来信')
    expect(wrapper.text()).toContain('播放')
  })

  it('emits a typed song selection', async () => {
    const wrapper = mount(NewSongCard, { props: { item: newSong } })
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted<PersonalizedNewSong[]>('select')?.[0]?.[0]).toEqual(newSong)
  })

  it('renders an unknown-artist fallback', () => {
    const wrapper = mount(NewSongCard, {
      props: { item: { ...newSong, song: { ...newSong.song, artists: [] } } },
    })
    expect(wrapper.text()).toContain('未知歌手')
  })
})
