// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getBanners } from '@/api/banner'
import { getPersonalizedMvs } from '@/api/mv'
import { getPrivateContents } from '@/api/privateContent'
import PickedPage from '@/views/music/PickedPage.vue'

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

const PickedViewStub = defineComponent({
  name: 'PickedView',
  props: [
    'banners',
    'bannersError',
    'bannersLoading',
    'mvs',
    'mvsError',
    'mvsLoading',
    'privateContents',
    'privateError',
    'privateLoading',
  ],
  emits: ['retry-banners', 'retry-mvs', 'retry-private', 'select-banner'],
  template: `
    <section>
      <span data-testid="private-count">{{ privateContents.length }}</span>
      <span v-if="privateError" data-testid="private-error">{{ privateError }}</span>
      <span data-testid="mv-count">{{ mvs.length }}</span>
      <button data-testid="page-private-retry" @click="$emit('retry-private')">retry</button>
    </section>
  `,
})

describe('PickedPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getBanners).mockReset()
    vi.mocked(getPersonalizedMvs).mockReset()
    vi.mocked(getPrivateContents).mockReset()
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
  })

  it('loads exclusive videos and recommended MVs, then retries private content', async () => {
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
      global: { stubs: { PickedView: PickedViewStub } },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="private-error"]').text()).toBe(
      'private offline',
    )
    expect(wrapper.get('[data-testid="mv-count"]').text()).toBe('1')

    await wrapper.get('[data-testid="page-private-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="private-count"]').text()).toBe('1')
  })
})
