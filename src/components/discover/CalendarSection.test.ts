// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CalendarSection from '@/components/discover/CalendarSection.vue'

const event = {
  id: 31,
  picUrl: '',
  resourceId: 301,
  resourceType: 'SONG',
  title: '夜航首发',
}

describe('CalendarSection', () => {
  it('renders events and retries after an error', async () => {
    const wrapper = mount(CalendarSection, {
      props: { error: null, events: [event], loading: false },
    })
    expect(wrapper.get('#calendar-title').text()).toBe('音乐日历')
    expect(wrapper.get('[data-testid="calendar"]').text()).toContain('夜航首发')
    await wrapper.get('[aria-label="打开日历：夜航首发"]').trigger('click')
    expect(wrapper.emitted('select')?.[0]?.[0]).toEqual(event)

    const failed = mount(CalendarSection, {
      props: { error: 'offline', events: [], loading: false },
    })
    await failed.get('[data-testid="calendar-retry"]').trigger('click')
    expect(failed.emitted('retry')).toHaveLength(1)
  })
})
