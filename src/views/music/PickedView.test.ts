// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PickedView from '@/views/music/PickedView.vue'

const BannerStub = defineComponent({
  name: 'BannerCarousel',
  props: ['banners', 'error', 'loading'],
  emits: ['retry', 'select'],
  template:
    '<section data-testid="picked-banners"><button data-testid="banner-retry" @click="$emit(\'retry\')">retry</button></section>',
})

const PrivateStub = defineComponent({
  name: 'PrivateContentSection',
  props: ['error', 'items', 'loading'],
  emits: ['retry'],
  template:
    '<section data-testid="picked-private"><span>{{ items.length }}</span><button data-testid="private-retry" @click="$emit(\'retry\')" /></section>',
})

const MvStub = defineComponent({
  name: 'MvSection',
  props: ['error', 'loading', 'mvs'],
  emits: ['retry'],
  template:
    '<section data-testid="picked-mvs"><span>{{ mvs.length }}</span><button data-testid="mv-retry" @click="$emit(\'retry\')" /></section>',
})

const mv = {
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
}

const privateContent = {
  id: 801,
  name: '林间现场',
  sPicUrl: 'https://images.example.com/cover.jpg',
}

describe('PickedView', () => {
  it('composes banner, exclusive videos and recommended MVs', async () => {
    const wrapper = mount(PickedView, {
      props: {
        banners: [],
        bannersError: null,
        bannersLoading: false,
        mvs: [mv],
        mvsError: null,
        mvsLoading: false,
        privateContents: [privateContent],
        privateError: null,
        privateLoading: false,
      },
      global: {
        stubs: {
          BannerCarousel: BannerStub,
          MvSection: MvStub,
          PrivateContentSection: PrivateStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="picked-banners"]').text()).toContain('retry')
    expect(wrapper.get('[data-testid="picked-private"]').text()).toContain('1')
    expect(wrapper.get('[data-testid="picked-mvs"]').text()).toContain('1')
    expect(wrapper.text()).not.toContain('推荐电台')

    await wrapper.get('[data-testid="banner-retry"]').trigger('click')
    await wrapper.get('[data-testid="private-retry"]').trigger('click')
    await wrapper.get('[data-testid="mv-retry"]').trigger('click')
    expect(wrapper.emitted('retry-banners')).toHaveLength(1)
    expect(wrapper.emitted('retry-private')).toHaveLength(1)
    expect(wrapper.emitted('retry-mvs')).toHaveLength(1)
  })
})
