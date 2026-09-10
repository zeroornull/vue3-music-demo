import { describe, expect, it } from 'vitest'

import { parseMediaComment } from '@/models/comment'

describe('parseMediaComment', () => {
  it('keeps a positive replyCount and ignores beReplied when replyCount is 0', () => {
    expect(
      parseMediaComment({
        beReplied: [{ commentId: 1, content: '父评' }],
        commentId: 11,
        content: '走过林间。',
        replyCount: 0,
        user: { nickname: '林间电台' },
      }),
    ).toEqual({
      commentId: 11,
      content: '走过林间。',
      nickname: '林间电台',
    })
    expect(
      parseMediaComment({
        commentId: 11,
        content: '走过林间。',
        replyCount: 2,
        user: { nickname: '林间电台' },
      })?.replyCount,
    ).toBe(2)
  })
})
