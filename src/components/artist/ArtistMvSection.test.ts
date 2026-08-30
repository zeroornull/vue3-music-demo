// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ArtistMvSection from '@/components/artist/ArtistMvSection.vue'

const CardStub = defineComponent({
  name: 'MvCard',
  props: ['mv'],
  template: '<article>{{ mv.name }}</article>',
})

const mv = {
  artistName: '林间电台',
  duration: 238_000,
  id: 701,
  name: '晚风来信 · Live',
  picUrl: 'https://images.example.com/wide.jpg',
  playCount: 1,
}

describe('ArtistMvSection', () => {
  it('renders mv cards and can load more', async () => {
    const wrapper = mount(ArtistMvSection, {
      props: { more: true, mvs: [mv] },
      global: { stubs: { MvCard: CardStub } },
    })
    expect(wrapper.text()).toContain('晚风来信 · Live')
    await wrapper.get('[data-testid="artist-mvs-more"]').trigger('click')
    expect(wrapper.emitted('load-more')).toHaveLength(1)
  })

  it('opens mv detail from a card', () => {
    const wrapper = mount(ArtistMvSection, {
      props: { mvs: [mv] },
      global: {
        stubs: {
          RouterLink: defineComponent({
            name: 'RouterLink',
            props: ['to'],
            template: '<a :href="JSON.stringify(to)"><slot /></a>',
          }),
        },
      },
    })
    expect(wrapper.get('a').attributes('href')).toContain('"name":"mvDetail"')
    expect(wrapper.get('a').attributes('href')).toContain('"id":701')
  })

  it('retries after an empty error state', async () => {
    const wrapper = mount(ArtistMvSection, {
      props: { error: 'mv offline', mvs: [] },
      global: { stubs: { MvCard: CardStub } },
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('mv offline')
    await wrapper.get('[data-testid="artist-mvs-retry"]').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
