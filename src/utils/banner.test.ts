import { describe, expect, it } from 'vitest'

import { Pages } from '@/router/pages'
import { resolveBannerTarget } from '@/utils/banner'

describe('resolveBannerTarget', () => {
  it('plays songs and opens album, playlist and MV pages', () => {
    expect(resolveBannerTarget({ targetId: 301, targetType: 1 })).toEqual({
      kind: 'play',
      id: 301,
    })
    expect(resolveBannerTarget({ targetId: 501, targetType: 10 })).toEqual({
      kind: 'route',
      name: Pages.album,
      id: 501,
    })
    expect(resolveBannerTarget({ targetId: 101, targetType: 1000 })).toEqual({
      kind: 'route',
      name: Pages.playlist,
      id: 101,
    })
    expect(resolveBannerTarget({ targetId: 701, targetType: 1004 })).toEqual({
      kind: 'route',
      name: Pages.mvDetail,
      id: 701,
    })
  })

  it('keeps unknown types and missing ids unmapped', () => {
    expect(resolveBannerTarget({ targetId: 301, targetType: 0 })).toEqual({
      kind: 'unknown',
    })
    expect(resolveBannerTarget({ targetId: 0, targetType: 1 })).toEqual({
      kind: 'unknown',
    })
    expect(resolveBannerTarget({ targetId: -1, targetType: 10 })).toEqual({
      kind: 'unknown',
    })
    expect(resolveBannerTarget({ targetId: 1.5, targetType: 10 })).toEqual({
      kind: 'unknown',
    })
    expect(resolveBannerTarget({ targetId: Number.NaN, targetType: 1 })).toEqual({
      kind: 'unknown',
    })
    expect(resolveBannerTarget({ targetId: 501, targetType: 3000 })).toEqual({
      kind: 'unknown',
    })
  })
})
