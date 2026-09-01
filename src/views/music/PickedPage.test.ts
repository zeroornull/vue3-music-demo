// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getBanners } from '@/api/banner'
import { getPersonalizedDjPrograms } from '@/api/dj'
import { getPersonalizedMvs } from '@/api/mv'
import { getPrivateContents } from '@/api/privateContent'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import PickedPage from '@/views/music/PickedPage.vue'

vi.mock('@/views/AlbumView.vue', () => ({
  default: { name: 'AlbumView', template: '<div data-testid="album-stub" />' },
}))
vi.mock('@/views/PlaylistView.vue', () => ({
  default: { name: 'PlaylistView', template: '<div data-testid="playlist-stub" />' },
}))
vi.mock('@/views/MvView.vue', () => ({
  default: { name: 'MvView', template: '<div data-testid="mv-stub" />' },
}))

vi.mock('@/api/banner', () => ({
  getBanners: vi.fn(),
}))

vi.mock('@/api/mv', () => ({
  getPersonalizedMvs: vi.fn(),
  getMvUrl: vi.fn(),
}))

vi.mock('@/api/privateContent', () => ({
  getPrivateContents: vi.fn(),
}))

vi.mock('@/api/dj', () => ({
  getPersonalizedDjPrograms: vi.fn(),
  getDjProgramDetail: vi.fn(),
}))

const PickedViewStub = defineComponent({
  name: 'PickedView',
  props: [
    'banners',
    'bannersError',
    'bannersLoading',
    'djError',
    'djLoading',
    'djPrograms',
    'mvs',
    'mvsError',
    'mvsLoading',
    'privateContents',
    'privateError',
    'privateLoading',
  ],
  emits: [
    'retry-banners',
    'retry-dj',
    'retry-mvs',
    'retry-private',
    'select-banner',
  ],
  template: `
    <section>
      <span data-testid="private-count">{{ privateContents.length }}</span>
      <span v-if="privateError" data-testid="private-error">{{ privateError }}</span>
      <span data-testid="dj-count">{{ djPrograms.length }}</span>
      <span v-if="djError" data-testid="dj-error">{{ djError }}</span>
      <span data-testid="mv-count">{{ mvs.length }}</span>
      <button data-testid="page-private-retry" @click="$emit('retry-private')">retry</button>
      <button data-testid="page-dj-retry" @click="$emit('retry-dj')">retry dj</button>
      <button
        data-testid="select-album-banner"
        @click="$emit('select-banner', { bannerId: 2, pic: 'x', targetId: 501, targetType: 10, typeTitle: '专辑' })"
      >
        album
      </button>
      <button
        data-testid="select-playlist-banner"
        @click="$emit('select-banner', { bannerId: 3, pic: 'x', targetId: 101, targetType: 1000, typeTitle: '歌单' })"
      >
        playlist
      </button>
      <button
        data-testid="select-mv-banner"
        @click="$emit('select-banner', { bannerId: 4, pic: 'x', targetId: 701, targetType: 1004, typeTitle: 'MV' })"
      >
        mv
      </button>
    </section>
  `,
})

describe('PickedPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getBanners).mockReset()
    vi.mocked(getPersonalizedMvs).mockReset()
    vi.mocked(getPrivateContents).mockReset()
    vi.mocked(getPersonalizedDjPrograms).mockReset()
    vi.mocked(getBanners).mockResolvedValue([])
    vi.mocked(getPersonalizedMvs).mockResolvedValue([
      {
        alg: '',
        artistId: 401,
        artistName: '林间电台',
        artists: [],
        canDislike: false,
        copywriter: '',
        duration: 1,
        id: 701,
        name: '晚风来信 · Live',
        picUrl: '',
        playCount: 1,
        subed: false,
        type: 1,
      },
    ])
    vi.mocked(getPrivateContents).mockResolvedValue([
      {
        id: 801,
        name: '林间现场',
        sPicUrl: 'https://images.example.com/cover.jpg',
      },
    ])
    vi.mocked(getPersonalizedDjPrograms).mockResolvedValue([
      {
        copywriter: '睡前电台',
        id: 901,
        name: '深夜民谣',
        picUrl: 'https://images.example.com/dj.jpg',
      },
    ])
  })

  it('loads exclusive videos, recommended radio and MVs, then retries radio', async () => {
    vi.mocked(getPersonalizedDjPrograms)
      .mockRejectedValueOnce(new Error('dj offline'))
      .mockResolvedValueOnce([
        {
          copywriter: '睡前电台',
          id: 901,
          name: '深夜民谣',
          picUrl: 'https://images.example.com/dj.jpg',
        },
      ])
    vi.mocked(getPrivateContents)
      .mockRejectedValueOnce(new Error('private offline'))
      .mockResolvedValueOnce([
        {
          id: 801,
          name: '林间现场',
          sPicUrl: 'https://images.example.com/cover.jpg',
        },
      ])

    const wrapper = mount(PickedPage, {
      global: {
        plugins: [createAppRouter(createMemoryHistory())],
        stubs: { PickedView: PickedViewStub },
      },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="dj-error"]').text()).toBe('dj offline')
    expect(wrapper.get('[data-testid="private-error"]').text()).toBe(
      'private offline',
    )
    expect(wrapper.get('[data-testid="mv-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-dj-retry"]').trigger('click')
    await wrapper.get('[data-testid="page-private-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="dj-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="private-count"]').text()).toBe('1')
  })

  it('opens album, playlist and MV banners', async () => {
    const router = createAppRouter(createMemoryHistory())
    await router.push({ name: Pages.picked })
    const wrapper = mount(PickedPage, {
      global: {
        plugins: [router],
        stubs: { PickedView: PickedViewStub },
      },
    })
    await flushPromises()

    await wrapper.get('[data-testid="select-album-banner"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.album)
    expect(router.currentRoute.value.query.id).toBe('501')

    await router.replace({ name: Pages.picked })
    await wrapper.get('[data-testid="select-playlist-banner"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.playlist)
    expect(router.currentRoute.value.query.id).toBe('101')

    await router.replace({ name: Pages.picked })
    await wrapper.get('[data-testid="select-mv-banner"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe(Pages.mvDetail)
    expect(router.currentRoute.value.query.id).toBe('701')
  })
})
