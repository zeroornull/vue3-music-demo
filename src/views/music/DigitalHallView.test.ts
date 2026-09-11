// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import DigitalHallView from '@/views/music/DigitalHallView.vue'

const album = {
  artist: { id: 401, name: '林间电台' },
  id: 511,
  name: '数字夜航',
  picUrl: '',
  publishTime: 0,
}

const AlbumStub = defineComponent({
  name: 'NewestAlbumSection',
  props: ['albums', 'emptyTitle', 'error', 'errorTitle', 'loading', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section :data-testid="testid + '-stub'">
      <h2>{{ title }}</h2>
      <button :data-testid="testid + '-retry'" @click="$emit('retry')" />
    </section>
  `,
})

const AreaStub = defineComponent({
  name: 'DigitalAreaBar',
  props: ['selected'],
  emits: ['select'],
  template: '<button data-testid="digital-area" @click="$emit(\'select\', \'JP\')">area</button>',
})

function mountView(props: Record<string, unknown> = {}) {
  return mount(DigitalHallView, {
    props: {
      albums: [],
      styleAlbums: [],
      albumBoard: [],
      singleBoard: [],
      sales: [],
      ...props,
    },
    global: {
      stubs: {
        DigitalAreaBar: AreaStub,
        NewestAlbumSection: AlbumStub,
      },
    },
  })
}

describe('DigitalHallView', () => {
  it('renders four album lists, sales and area selection', async () => {
    const data = mountView({
      albums: [album],
      sales: [{ id: 511, name: '数字夜航', saleNum: 128 }],
    })
    expect(data.get('#digital-title').text()).toBe('数字专辑')
    expect(data.get('[data-testid="digital-new-stub"] h2').text()).toBe('数字新碟')
    expect(data.get('[data-testid="digital-style-stub"] h2').text()).toBe('语种数字专辑')
    expect(data.get('[data-testid="digital-album-board-stub"] h2').text()).toBe(
      '数字专辑周榜',
    )
    expect(data.get('[data-testid="digital-single-board-stub"] h2').text()).toBe(
      '数字单曲周榜',
    )
    expect(data.get('[data-testid="digital-sales"]').text()).toContain('数字夜航')
    await data.get('[data-testid="digital-area"]').trigger('click')
    expect(data.emitted('select-area')).toEqual([['JP']])
    await data.get('[data-testid="digital-new-retry"]').trigger('click')
    expect(data.emitted('retry-albums')).toHaveLength(1)
  })

  it('renders sales error and retry', async () => {
    const failed = mountView({ salesError: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    await failed.get('[data-testid="digital-sales-retry"]').trigger('click')
    expect(failed.emitted('retry-sales')).toHaveLength(1)
  })
})
