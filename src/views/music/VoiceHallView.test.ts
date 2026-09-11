// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import VoiceHallView from '@/views/music/VoiceHallView.vue'

const podcast = {
  coverUrl: 'https://images.example.com/v.jpg',
  desc: '林间夜谈',
  djName: '林间电台',
  id: 801,
  name: '深夜播客',
}
const voice = {
  copywriter: '林间电台',
  id: 901,
  name: '第一期',
  paid: false,
  picUrl: '',
}

const BarStub = defineComponent({
  name: 'VoicePodcastBar',
  props: ['podcasts', 'selected'],
  emits: ['select'],
  template:
    '<button data-testid="voice-podcast" @click="$emit(\'select\', 802)">{{ podcasts[0]?.name }}</button>',
})

const ProgramStub = defineComponent({
  name: 'DjProgramSection',
  props: ['emptyTitle', 'error', 'errorTitle', 'loading', 'programs', 'testid', 'title'],
  emits: ['retry'],
  template: `
    <section :data-testid="testid + '-stub'">
      <h2>{{ title }}</h2>
      <button :data-testid="testid + '-retry'" @click="$emit('retry')" />
    </section>
  `,
})

function mountView(props: Record<string, unknown> = {}) {
  return mount(VoiceHallView, {
    props: {
      podcasts: [],
      voices: [],
      hits: [],
      ...props,
    },
    global: {
      stubs: {
        DjProgramSection: ProgramStub,
        VoicePodcastBar: BarStub,
      },
    },
  })
}

describe('VoiceHallView', () => {
  it('renders loading, error/retry, empty podcasts and the voice sections', async () => {
    const loading = mountView({ podcastsLoading: true })
    expect(
      loading.get('[data-testid="voice-podcasts-loading"]').attributes('aria-busy'),
    ).toBe('true')
    expect(loading.find('[data-testid="voice-tracks-stub"]').exists()).toBe(false)

    const failed = mountView({ podcastsError: 'offline' })
    expect(failed.get('[role="alert"]').text()).toContain('offline')
    await failed.get('[data-testid="voice-podcasts-retry"]').trigger('click')
    expect(failed.emitted('retry-podcasts')).toHaveLength(1)
    expect(failed.find('[data-testid="voice-hits-stub"]').exists()).toBe(false)

    const empty = mountView()
    expect(empty.get('[data-testid="voice-podcasts-empty"]').text()).toContain('暂无播客')

    const data = mountView({
      detail: podcast,
      listId: 801,
      lyric: '走过林间。',
      podcasts: [podcast],
      voiceId: 901,
      voices: [voice],
    })
    expect(data.get('#voice-title').text()).toBe('声音')
    expect(data.get('[data-testid="voice-detail"]').text()).toContain('深夜播客')
    expect(data.get('[data-testid="voice-tracks-stub"] h2').text()).toBe('播客声音')
    expect(data.find('[data-testid="voice-hits-stub"]').exists()).toBe(false)
    expect(data.get('[data-testid="voice-lyric"]').text()).toBe('走过林间。')

    const searching = mountView({
      keyword: '夜航',
      listId: 801,
      podcasts: [podcast],
      voices: [voice],
    })
    expect(searching.get('[data-testid="voice-hits-stub"] h2').text()).toBe('搜索声音')
    await searching.setProps({ keyword: '' })
    expect(
      (searching.get('[data-testid="voice-search-input"]').element as HTMLInputElement)
        .value,
    ).toBe('')

    await data.get('[data-testid="voice-podcast"]').trigger('click')
    expect(data.emitted('select-podcast')).toEqual([[802]])
    await data.get('[data-testid="voice-search-input"]').setValue('夜航')
    await data.get('.voice-search').trigger('submit')
    expect(data.emitted('search')).toEqual([['夜航']])
    await data.get('.lyric-voices button').trigger('click')
    expect(data.emitted('select-voice')).toEqual([[901]])
  })
})
