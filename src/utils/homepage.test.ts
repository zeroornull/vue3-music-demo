import { describe, expect, it } from 'vitest'

import { Pages } from '@/router/pages'
import { resolveCalendarTarget, resolveDragonBallTarget } from '@/utils/homepage'

describe('homepage targets', () => {
  it('maps dragon-ball urls onto existing halls, details and playback', () => {
    expect(resolveDragonBallTarget('orpheus://nm/personalFM')).toEqual({
      kind: 'route',
      name: Pages.fm,
    })
    expect(resolveDragonBallTarget('orpheus://nm/radio')).toEqual({
      kind: 'route',
      name: Pages.djHall,
    })
    expect(resolveDragonBallTarget('orpheus://nm/playlist/ranklist')).toEqual({
      kind: 'route',
      name: Pages.toplist,
    })
    expect(resolveDragonBallTarget('orpheus://nm/artist')).toEqual({
      kind: 'route',
      name: Pages.artist,
    })
    expect(resolveDragonBallTarget('orpheus://nm/video')).toEqual({
      kind: 'route',
      name: Pages.video,
    })
    expect(resolveDragonBallTarget('orpheus://nm/style')).toEqual({
      kind: 'route',
      name: Pages.style,
    })
    expect(resolveDragonBallTarget('https://music.163.com/style?tagId=1000')).toEqual({
      kind: 'route',
      id: 1000,
      name: Pages.style,
    })
    expect(resolveDragonBallTarget('orpheus://nm/voice')).toEqual({
      kind: 'route',
      name: Pages.voice,
    })
    expect(resolveDragonBallTarget('https://music.163.com/voice?listId=801')).toEqual({
      kind: 'route',
      id: 801,
      name: Pages.voice,
    })
    expect(resolveDragonBallTarget('https://music.163.com/playlist?id=101')).toEqual({
      kind: 'route',
      id: 101,
      name: Pages.playlist,
    })
    expect(resolveDragonBallTarget('orpheus://songplay?songId=301')).toEqual({
      kind: 'play',
      id: 301,
    })
    expect(resolveDragonBallTarget('https://music.163.com/mv?id=701')).toEqual({
      kind: 'route',
      id: 701,
      name: Pages.mvDetail,
    })
    expect(resolveDragonBallTarget('https://music.163.com/playlist/101')).toEqual({
      kind: 'route',
      id: 101,
      name: Pages.playlist,
    })
    expect(resolveDragonBallTarget('orpheus://song/301')).toEqual({
      kind: 'play',
      id: 301,
    })
  })

  it('keeps unknown dragon-ball urls unmapped', () => {
    expect(resolveDragonBallTarget('')).toEqual({ kind: 'unknown' })
    expect(resolveDragonBallTarget('orpheus://nm/dailyRecommend')).toEqual({
      kind: 'unknown',
    })
    expect(
      resolveDragonBallTarget('https://music.163.com/login?redirect=/toplist'),
    ).toEqual({ kind: 'unknown' })
  })

  it('maps calendar resources like banners', () => {
    expect(resolveCalendarTarget({ resourceId: 301, resourceType: 'SONG' })).toEqual({
      kind: 'play',
      id: 301,
    })
    expect(resolveCalendarTarget({ resourceId: 501, resourceType: 10 })).toEqual({
      kind: 'route',
      id: 501,
      name: Pages.album,
    })
    expect(resolveCalendarTarget({ resourceId: 101, resourceType: 'PLAYLIST' })).toEqual({
      kind: 'route',
      id: 101,
      name: Pages.playlist,
    })
    expect(resolveCalendarTarget({ resourceId: 701, resourceType: 'MV' })).toEqual({
      kind: 'route',
      id: 701,
      name: Pages.mvDetail,
    })
    expect(resolveCalendarTarget({ resourceId: 0, resourceType: 'SONG' })).toEqual({
      kind: 'unknown',
    })
    expect(resolveCalendarTarget({ resourceId: 301, resourceType: 'LIVE' })).toEqual({
      kind: 'unknown',
    })
  })
})
