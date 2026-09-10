import { describe, expect, it } from 'vitest'

import { excludeSeenComments } from '@/models/comment'

const hot = { commentId: 1, content: '林间热评', nickname: '林间电台' }
const latest = { commentId: 2, content: '夜色刚好', nickname: '海岸信号' }

describe('excludeSeenComments', () => {
  it('returns null when the source list is null', () => {
    expect(excludeSeenComments(null, [hot])).toBeNull()
  })

  it('returns the source list when seen is empty', () => {
    expect(excludeSeenComments([hot, latest], null)).toEqual([hot, latest])
    expect(excludeSeenComments([hot, latest], [])).toEqual([hot, latest])
  })

  it('drops ids already present in the seen list', () => {
    expect(excludeSeenComments([hot, latest], [hot])).toEqual([latest])
  })
})
