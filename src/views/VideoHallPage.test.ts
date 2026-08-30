// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getHallVideos, getVideoGroups } from '@/api/video'
import VideoHallPage from '@/views/VideoHallPage.vue'

vi.mock('@/api/video', () => ({
  getHallVideos: vi.fn(),
  getVideoGroups: vi.fn(),
}))

const HallViewStub = defineComponent({
  name: 'VideoHallView',
  props: ['clips', 'clipsError', 'clipsLoading', 'groups', 'groupsError', 'groupsLoading', 'selected'],
  emits: ['retry', 'select-group'],
  template: `
    <section>
      <span data-testid="clip-count">{{ clips.length }}</span>
      <span v-if="clipsError" data-testid="clip-error">{{ clipsError }}</span>
      <button data-testid="page-retry" @click="$emit('retry')">retry</button>
      <button data-testid="page-group" @click="$emit('select-group', 101)">group</button>
    </section>
  `,
})

const clip = {
  coverUrl: 'https://images.example.com/clip.jpg',
  creatorName: '林间电台',
  durationms: 180_000,
  playTime: 12_000,
  title: '晚风现场',
  vid: 'VID001',
}

describe('VideoHallPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getVideoGroups).mockReset()
    vi.mocked(getHallVideos).mockReset()
    vi.mocked(getVideoGroups).mockResolvedValue([{ id: 101, name: '现场' }])
    vi.mocked(getHallVideos).mockResolvedValue([clip])
  })

  it('loads groups and clips, retries and changes group', async () => {
    vi.mocked(getHallVideos)
      .mockRejectedValueOnce(new Error('video offline'))
      .mockResolvedValueOnce([clip])
      .mockResolvedValueOnce([{ ...clip, vid: 'VID002', title: '翻唱现场' }])

    const wrapper = mount(VideoHallPage, {
      global: { stubs: { VideoHallView: HallViewStub } },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="clip-error"]').text()).toBe('video offline')

    await wrapper.get('[data-testid="page-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="clip-count"]').text()).toBe('1')
    expect(getHallVideos).toHaveBeenNthCalledWith(2, 0)

    await wrapper.get('[data-testid="page-group"]').trigger('click')
    await flushPromises()
    expect(getHallVideos).toHaveBeenNthCalledWith(3, 101)
  })
})
