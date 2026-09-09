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

const DjStub = defineComponent({
  name: 'DjProgramSection',
  props: ['error', 'loading', 'programs'],
  emits: ['retry'],
  template:
    '<section data-testid="picked-dj"><h2>推荐电台</h2><span>{{ programs.length }}</span><button data-testid="dj-retry" @click="$emit(\'retry\')" /></section>',
})

const MvStub = defineComponent({
  name: 'MvSection',
  props: ['emptyTitle', 'error', 'errorTitle', 'limit', 'loading', 'mvs', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section :data-testid="testid === 'mv-toplist' ? 'picked-top-mvs' : 'picked-mvs'">
      <h2>{{ title || '推荐 MV' }}</h2>
      <span>{{ mvs.length }}</span>
      <span v-if="limit != null" data-testid="mv-limit">{{ limit }}</span>
      <span v-if="emptyTitle" data-testid="mv-empty-title">{{ emptyTitle }}</span>
      <span v-if="errorTitle" data-testid="mv-error-title">{{ errorTitle }}</span>
      <button
        :data-testid="testid === 'mv-toplist' ? 'mv-toplist-retry' : 'mv-retry'"
        @click="$emit('retry')"
      />
    </section>
  `,
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

const djProgram = {
  copywriter: '睡前电台',
  id: 901,
  name: '深夜民谣',
  picUrl: 'https://images.example.com/dj.jpg',
}

describe('PickedView', () => {
  it('composes banner, exclusive videos, radio and recommended MVs', async () => {
    const wrapper = mount(PickedView, {
      props: {
        banners: [],
        bannersError: null,
        bannersLoading: false,
        djError: null,
        djLoading: false,
        djPrograms: [djProgram],
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
          DjProgramSection: DjStub,
          MvSection: MvStub,
          PrivateContentSection: PrivateStub,
        },
      },
    })

    expect(wrapper.get('[data-testid="picked-banners"]').text()).toContain('retry')
    expect(wrapper.get('[data-testid="picked-private"]').text()).toContain('1')
    expect(wrapper.get('[data-testid="picked-dj"]').text()).toContain('推荐电台')
    expect(wrapper.get('[data-testid="picked-mvs"]').text()).toContain('1')
    expect(wrapper.get('[data-testid="picked-top-mvs"] h2').text()).toBe('MV 排行')
    expect(wrapper.get('[data-testid="picked-top-mvs"] [data-testid="mv-limit"]').text()).toBe(
      '10',
    )
    expect(wrapper.get('[data-testid="picked-top-mvs"] [data-testid="mv-empty-title"]').text()).toBe(
      '暂无 MV 排行',
    )
    expect(wrapper.get('[data-testid="picked-top-mvs"] [data-testid="mv-error-title"]').text()).toBe(
      'MV 排行加载失败',
    )

    await wrapper.get('[data-testid="banner-retry"]').trigger('click')
    await wrapper.get('[data-testid="private-retry"]').trigger('click')
    await wrapper.get('[data-testid="dj-retry"]').trigger('click')
    await wrapper.get('[data-testid="mv-retry"]').trigger('click')
    await wrapper.get('[data-testid="mv-toplist-retry"]').trigger('click')
    expect(wrapper.emitted('retry-banners')).toHaveLength(1)
    expect(wrapper.emitted('retry-private')).toHaveLength(1)
    expect(wrapper.emitted('retry-dj')).toHaveLength(1)
    expect(wrapper.emitted('retry-mvs')).toHaveLength(1)
    expect(wrapper.emitted('retry-top-mvs')).toHaveLength(1)
  })
})
