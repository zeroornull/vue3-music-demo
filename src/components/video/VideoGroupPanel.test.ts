// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import VideoGroupPanel from '@/components/video/VideoGroupPanel.vue'

const groups = [
  { id: 101, name: '现场' },
  { id: 109, name: '分类9<img src=x>' },
]

function bodyEl(selector: string) {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`missing ${selector}`)
  return el as HTMLElement
}

describe('VideoGroupPanel', () => {
  it('renders every group as text and can close', async () => {
    const wrapper = mount(VideoGroupPanel, {
      props: { groups, selected: 109 },
      attachTo: document.body,
    })

    const layer = bodyEl('.group-layer')
    expect(layer.parentElement).toBe(document.body)
    const panel = bodyEl('[data-testid="video-group-panel"]')
    expect(panel.getAttribute('role')).toBe('dialog')
    expect(panel.textContent).toContain('全部视频')
    expect(panel.textContent).toContain('分类9<img src=x>')
    expect(panel.querySelector('img')).toBeNull()
    expect(
      [...panel.querySelectorAll('button')].find((button) =>
        button.textContent?.includes('分类9'),
      )?.getAttribute('aria-pressed'),
    ).toBe('true')

    bodyEl('[data-testid="video-group-close"]').click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits a selected group and closes from backdrop or escape', async () => {
    const wrapper = mount(VideoGroupPanel, {
      props: { groups, selected: 0 },
      attachTo: document.body,
    })

    const groupButton = [...bodyEl('[data-testid="video-group-panel"]').querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === '现场',
    )
    groupButton?.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('select')?.[0]).toEqual([101])

    bodyEl('[data-testid="video-group-backdrop"]').click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('close')).toHaveLength(2)
    wrapper.unmount()
  })
})
