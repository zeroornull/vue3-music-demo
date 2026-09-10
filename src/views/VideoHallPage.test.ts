// @vitest-environment happy-dom

import { defineComponent } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getHotAllMvs, getNewAllMvs } from '@/api/mv'
import {
  getHallVideos,
  getRecommendVideos,
  getVideoCategories,
  getVideoGroups,
} from '@/api/video'
import { createAppRouter } from '@/router'
import { Pages } from '@/router/pages'
import VideoHallPage from '@/views/VideoHallPage.vue'

vi.mock('@/api/mv', () => ({
  getHotAllMvs: vi.fn(),
  getNewAllMvs: vi.fn(),
}))

vi.mock('@/api/video', () => ({
  getHallVideos: vi.fn(),
  getVideoGroups: vi.fn(),
  getVideoCategories: vi.fn(),
  getRecommendVideos: vi.fn(),
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
    'hotAllMvs',
    'more',
    'newAllMvs',
    'recommendClips',
    'selected',
  ],
  emits: [
    'load-more',
    'retry',
    'retry-hot-all-mvs',
    'retry-new-all-mvs',
    'retry-recommend',
    'select-group',
  ],
  template: `
    <section>
      <span data-testid="clip-count">{{ clips.length }}</span>
      <span data-testid="selected-group">{{ selected }}</span>
      <span v-if="clipsError" data-testid="clip-error">{{ clipsError }}</span>
      <span data-testid="clip-more">{{ more ? 'yes' : 'no' }}</span>
      <span data-testid="recommend-count">{{ (recommendClips || []).length }}</span>
      <span data-testid="hot-all-count">{{ (hotAllMvs || []).length }}</span>
      <span data-testid="new-all-count">{{ (newAllMvs || []).length }}</span>
      <button data-testid="page-retry" @click="$emit('retry')">retry</button>
      <button data-testid="page-retry-recommend" @click="$emit('retry-recommend')">
        retry-recommend
      </button>
      <button data-testid="page-all" @click="$emit('select-group', 0)">all</button>
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

async function mountPage(query: Record<string, string> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createAppRouter(createMemoryHistory())
  await router.push({ name: Pages.video, query })
  const wrapper = mount(VideoHallPage, {
    global: {
      plugins: [pinia, router],
      stubs: { VideoHallView: HallViewStub },
    },
  })
  return { router, wrapper }
}

describe('VideoHallPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getVideoGroups).mockReset()
    vi.mocked(getHallVideos).mockReset()
    vi.mocked(getVideoCategories).mockReset()
    vi.mocked(getRecommendVideos).mockReset()
    vi.mocked(getHotAllMvs).mockReset()
    vi.mocked(getNewAllMvs).mockReset()
    vi.mocked(getVideoGroups).mockResolvedValue([{ id: 101, name: '现场' }])
    vi.mocked(getVideoCategories).mockResolvedValue([{ id: 201, name: '音乐' }])
    vi.mocked(getHallVideos).mockResolvedValue({ clips: [clip], more: true })
    vi.mocked(getRecommendVideos).mockResolvedValue([
      { ...clip, vid: 'VID009', title: '推荐现场' },
    ])
    vi.mocked(getHotAllMvs).mockResolvedValue([
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 1,
        id: 911,
        name: '热门全部',
        picUrl: '',
        playCount: 1,
      },
    ])
    vi.mocked(getNewAllMvs).mockResolvedValue([
      {
        artistId: 401,
        artistName: '林间电台',
        artists: [{ id: 401, name: '林间电台' }],
        duration: 1,
        id: 912,
        name: '最新全部',
        picUrl: '',
        playCount: 1,
      },
    ])
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

    const { wrapper } = await mountPage()
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

  it('loads clips for the groupId query', async () => {
    const grouped = { ...clip, vid: 'VID002', title: '翻唱现场' }
    vi.mocked(getHallVideos).mockImplementation(async (query = {}) => {
      if (query.groupId === 101) {
        return { clips: [grouped], more: false }
      }
      return { clips: [clip], more: true }
    })

    const { wrapper } = await mountPage({ groupId: '101' })
    await flushPromises()

    expect(wrapper.get('[data-testid="selected-group"]').text()).toBe('101')
    expect(wrapper.get('[data-testid="clip-count"]').text()).toBe('1')
    expect(getHallVideos).toHaveBeenCalledTimes(1)
    expect(getHallVideos).toHaveBeenCalledWith({ groupId: 101, offset: 0 })
    expect(getHallVideos).not.toHaveBeenCalledWith({ groupId: 0, offset: 0 })
  })

  it.each(['0', 'abc', '1.5', '-3'])(
    'treats invalid groupId %s as all videos',
    async (groupId) => {
      const { wrapper } = await mountPage({ groupId })
      await flushPromises()
      expect(wrapper.get('[data-testid="selected-group"]').text()).toBe('0')
      expect(getHallVideos).toHaveBeenCalledWith({ groupId: 0, offset: 0 })
    },
  )

  it('does not reset the hall group when videoDetail is opened', async () => {
    const { router, wrapper } = await mountPage({ groupId: '101' })
    await flushPromises()
    vi.mocked(getHallVideos).mockClear()

    await router.push({ name: Pages.videoDetail, query: { id: 'VID001' } })
    await flushPromises()

    expect(wrapper.get('[data-testid="selected-group"]').text()).toBe('101')
    expect(getHallVideos).not.toHaveBeenCalled()
  })

  it('writes the groupId query when a group is selected', async () => {
    const { router, wrapper } = await mountPage()
    await flushPromises()

    await wrapper.get('[data-testid="page-group"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe(Pages.video)
    expect(router.currentRoute.value.query.groupId).toBe('101')
    expect(wrapper.get('[data-testid="selected-group"]').text()).toBe('101')
  })

  it('clears the groupId query when all videos are selected', async () => {
    vi.mocked(getHallVideos).mockImplementation(async (query = {}) => {
      if (query.groupId === 101) {
        return {
          clips: [{ ...clip, vid: 'VID002', title: '翻唱现场' }],
          more: false,
        }
      }
      return { clips: [clip], more: true }
    })

    const { router, wrapper } = await mountPage({ groupId: '101' })
    await flushPromises()
    expect(wrapper.get('[data-testid="selected-group"]').text()).toBe('101')

    await wrapper.get('[data-testid="page-all"]').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({})
    expect(wrapper.get('[data-testid="selected-group"]').text()).toBe('0')
    expect(getHallVideos).toHaveBeenCalledWith({ groupId: 0, offset: 0 })
  })

  it('loads recommend clips and all-MV extras on mount and retries them', async () => {
    const { wrapper } = await mountPage()
    await flushPromises()
    expect(wrapper.get('[data-testid="recommend-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="hot-all-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="new-all-count"]').text()).toBe('1')
    expect(getVideoCategories).toHaveBeenCalledTimes(1)
    expect(getRecommendVideos).toHaveBeenCalledTimes(1)
    expect(getHotAllMvs).toHaveBeenCalledTimes(1)
    expect(getNewAllMvs).toHaveBeenCalledTimes(1)

    vi.mocked(getRecommendVideos).mockResolvedValueOnce([
      { ...clip, vid: 'VID010', title: '再推荐' },
    ])
    await wrapper.get('[data-testid="page-retry-recommend"]').trigger('click')
    await flushPromises()
    expect(getRecommendVideos).toHaveBeenCalledTimes(2)
  })
})
