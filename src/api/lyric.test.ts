import { describe, expect, it, vi } from 'vitest'

import type { HttpClient } from '@/api/http'
import { getLyric } from '@/api/lyric'

const client = (response: unknown) => {
  const get = vi.fn(async <T>(_path: string, _params?: unknown) => response as T)
  return { client: { get } as Pick<HttpClient, 'get'>, get }
}

describe('Lyric API', () => {
  it('parses timed lines, skips tags and keeps markup as text', async () => {
    const request = client({
      extra: true,
      lrc: {
        lyric: '[ti:夜航]\n[00:12.00]走过林间。<img src=x>\n[01:02.500]第二句\n',
      },
    })
    await expect(getLyric(301, request.client)).resolves.toEqual({
      lines: [
        { text: '走过林间。<img src=x>', time: 12 },
        { text: '第二句', time: 62.5 },
      ],
    })
    expect(request.get).toHaveBeenCalledWith('/lyric', { id: 301 })
  })

  it('attaches matching translated lines as text', async () => {
    const request = client({
      lrc: {
        lyric: '[00:12.00]Walk through the woods.\n[01:02.500]Second line\n',
      },
      tlyric: {
        lyric: '[00:12.00]走过林间。<img src=x>\n[01:02.500]第二句\n',
      },
    })
    await expect(getLyric(301, request.client)).resolves.toEqual({
      lines: [
        {
          text: 'Walk through the woods.',
          time: 12,
          translation: '走过林间。<img src=x>',
        },
        { text: 'Second line', time: 62.5, translation: '第二句' },
      ],
    })
  })

  it('attaches matching romanized lines as text', async () => {
    const request = client({
      lrc: {
        lyric: '[00:12.00]Walk through the woods.\n[01:02.500]Second line\n',
      },
      tlyric: {
        lyric: '[00:12.00]走过林间。<img src=x>\n',
      },
      romalrc: {
        lyric: '[00:12.00]zou guo lin jian.<img src=x>\n[01:02.500]di er ju\n',
      },
    })
    await expect(getLyric(301, request.client)).resolves.toEqual({
      lines: [
        {
          text: 'Walk through the woods.',
          time: 12,
          translation: '走过林间。<img src=x>',
          romanization: 'zou guo lin jian.<img src=x>',
        },
        { text: 'Second line', time: 62.5, romanization: 'di er ju' },
      ],
    })
  })

  it('attaches karaoke words when lrc and yrc share the same millisecond', async () => {
    const request = client({
      lrc: { lyric: '[00:01.118]Hello\n' },
      yrc: { lyric: '[1118,1000](1118,1000,0)Hello\n' },
    })
    await expect(getLyric(301, request.client)).resolves.toEqual({
      lines: [
        {
          text: 'Hello',
          time: 1 + 118 / 1000,
          words: [{ text: 'Hello', time: 1.118 }],
        },
      ],
    })
  })

  it('keeps whole-line text when yrc times do not match', async () => {
    const request = client({
      lrc: { lyric: '[00:12.00]Hello\n' },
      yrc: { lyric: '[0,1000](0,1000,0)Hello\n' },
    })
    await expect(getLyric(301, request.client)).resolves.toEqual({
      lines: [{ text: 'Hello', time: 12 }],
    })
  })

  it('attaches matching karaoke words as text', async () => {
    const request = client({
      lrc: {
        lyric: '[00:12.00]Walk through the woods.\n[01:02.500]Second line\n',
      },
      yrc: {
        lyric:
          '[12000,2000](12000,800,0)Walk (12800,1200,0)through the woods.<img src=x>\n[62500,1000](62500,1000,0)Second line\n',
      },
    })
    await expect(getLyric(301, request.client)).resolves.toEqual({
      lines: [
        {
          text: 'Walk through the woods.',
          time: 12,
          words: [
            { text: 'Walk ', time: 12 },
            { text: 'through the woods.<img src=x>', time: 12.8 },
          ],
        },
        {
          text: 'Second line',
          time: 62.5,
          words: [{ text: 'Second line', time: 62.5 }],
        },
      ],
    })
  })

  it('returns an empty lyric when nolyric is set', async () => {
    await expect(
      getLyric(
        301,
        client({
          nolyric: true,
          lrc: { lyric: '[00:00.00]x' },
          tlyric: { lyric: '[00:00.00]x' },
          romalrc: { lyric: '[00:00.00]x' },
          yrc: { lyric: '[0,1000](0,1000,0)x' },
        }).client,
      ),
    ).resolves.toEqual({ lines: [] })
  })

  it('rejects a missing lrc object', async () => {
    await expect(getLyric(301, client({ lrc: null }).client)).rejects.toThrow(
      '歌词响应格式不正确',
    )
  })
})
