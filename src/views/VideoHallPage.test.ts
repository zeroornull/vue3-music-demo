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
  props: [
    'clips',
    'clipsError',
    'clipsLoading',
    'groups',
    'groupsError',
    'groupsLoading',
    'more',
    'selected',
  ],
  emits: ['load-more', 'retry', 'select-group'],
  template: `
    <section>
      <span data-testid="clip-count">{{ clips.length }}</span>
      <span v-if="clipsError" data-testid="clip-error">{{ clipsError }}</span>
      <span data-testid="clip-more">{{ more ? 'yes' : 'no' }}</span>
      <button data-testid="page-retry" @click="$emit('retry')">retry</button>
      <button data-testid="page-group" @click="$emit('select-group', 101)">group</button>
      <button data-testid="page-more" @click="$emit('load-more')">more</button>
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
    vi.mocked(getHallVideos).mockResolvedValue({ clips: [clip], more: true })
  })

  it('loads groups and clips, retries, changes group and loads more', async () => {
    vi.mocked(getHallVideos)
      .mockRejectedValueOnce(new Error('video offline'))
      .mockResolvedValueOnce({ clips: [clip], more: true })
      .mockResolvedValueOnce({
        clips: [{ ...clip, vid: 'VID002', title: '翻唱现场' }],
        more: true,
      })
      .mockResolvedValueOnce({
        clips: [{ ...clip, vid: 'VID003', title: '下一页' }],
        more: false,
      })

    const wrapper = mount(VideoHallPage, {
      global: { stubs: { VideoHallView: HallViewStub } },
    })
    await flushPromises()
    expect(wrapper.get('[data-testid="clip-error"]').text()).toBe('video offline')

    await wrapper.get('[data-testid="page-retry"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="clip-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="clip-more"]').text()).toBe('yes')
    expect(getHallVideos).toHaveBeenNthCalledWith(2, { groupId: 0, offset: 0 })

    await wrapper.get('[data-testid="page-group"]').trigger('click')
    await flushPromises()
    expect(getHallVideos).toHaveBeenNthCalledWith(3, { groupId: 101, offset: 0 })

    await wrapper.get('[data-testid="page-more"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="clip-count"]').text()).toBe('2')
    expect(wrapper.get('[data-testid="clip-more"]').text()).toBe('no')
    expect(getHallVideos).toHaveBeenNthCalledWith(4, { groupId: 101, offset: 1 })
  })
})
